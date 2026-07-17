#!/usr/bin/env node
import { createHmac, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(__dirname, "..");
loadEnv(join(repoRoot, ".env.local"));

const flags = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("--")));
const files = process.argv.slice(2).filter((arg) => !arg.startsWith("--")).map((file) => resolve(file));
const dryRun = flags.has("--dry-run");
const skipUpload = flags.has("--skip-upload");

if (!files.length) {
  printUsage();
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const supabase = dryRun ? null : createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const imported = [];
const skipped = [];

for (const file of files) {
  try {
    if (!existsSync(file)) throw new Error("File does not exist.");
    const parsed = parseSessionAudioFilename(file);
    if (!parsed) {
      skipped.push({ file, reason: "No supported session date was found in the filename." });
      continue;
    }

    const extension = extname(file).toLowerCase();
    if (![".mp3", ".m4a", ".aac"].includes(extension)) {
      skipped.push({ file, reason: `Unsupported audio extension ${extension || "(none)"}. Use MP3, M4A, or AAC.` });
      continue;
    }

    const durationSeconds = readDurationSeconds(file);
    const storagePath = `protected/sunday-sessions/${parsed.dateKey}/${slugify(parsed.sessionName)}-${parsed.dateKey}${extension}`;
    const audioTitle = `${parsed.sessionName} - ${formatDateLabel(parsed.dateKey)}`;

    if (dryRun) {
      imported.push({ file, audioTitle, date: parsed.dateKey, storagePath, durationSeconds, dryRun: true });
      continue;
    }

    const session = await upsertSession(parsed.sessionName, parsed.dateKey, durationSeconds);
    if (!skipUpload) {
      await uploadToR2(storagePath, readFileSync(file), contentTypeFor(extension));
    }
    await upsertResource({
      audioTitle,
      dateKey: parsed.dateKey,
      durationSeconds,
      sessionId: session.id,
      storagePath
    });

    imported.push({ file, audioTitle, date: parsed.dateKey, storagePath, durationSeconds, uploaded: !skipUpload });
  } catch (error) {
    skipped.push({ file, reason: error instanceof Error ? error.message : "Unknown error" });
  }
}

console.log(JSON.stringify({ imported, skipped }, null, 2));

async function upsertSession(sessionName, dateKey, durationSeconds) {
  const dayStart = `${dateKey}T00:00:00+05:30`;
  const dayEnd = `${addDays(dateKey, 1)}T00:00:00+05:30`;
  const sessionAtFour = `${dateKey}T16:00:00+05:30`;

  const { data: existing, error: existingError } = await supabase
    .from("sessions")
    .select("id")
    .gte("session_date", dayStart)
    .lt("session_date", dayEnd)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  const payload = {
    title: sessionName,
    topic: sessionName,
    description: `Sacred Circle session audio for ${formatDateLabel(dateKey)}.`,
    session_date: sessionAtFour,
    duration_minutes: durationSeconds ? Math.max(1, Math.round(durationSeconds / 60)) : null,
    zoom_link: null,
    status: "completed"
  };

  if (existing?.id) {
    const { data, error } = await supabase.from("sessions").update(payload).eq("id", existing.id).select("id").single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.from("sessions").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}

async function upsertResource({ audioTitle, dateKey, durationSeconds, sessionId, storagePath }) {
  const payload = {
    title: audioTitle,
    description: `Sacred Circle session recording from ${formatDateLabel(dateKey)}.`,
    type: "audio",
    category: "Session Recording",
    access_type: "session_protected",
    storage_provider: "r2",
    storage_path: storagePath,
    youtube_url: null,
    external_url: null,
    session_id: sessionId,
    page_id: null,
    duration_seconds: durationSeconds,
    is_featured: false,
    display_order: -Number(dateKey.replaceAll("-", "")),
    source_url: null,
    migration_status: "imported",
    status: "published"
  };

  const { data: existing, error: existingError } = await supabase
    .from("resources")
    .select("id")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (existingError) throw existingError;

  const write = existing?.id
    ? supabase.from("resources").update(payload).eq("id", existing.id)
    : supabase.from("resources").insert(payload);
  const { error } = await write;
  if (error) throw error;
}

async function uploadToR2(key, body, contentType) {
  const config = resolveR2Config();
  if (!config.endpoint || !config.bucket || !config.accessKeyId || !config.secretAccessKey) {
    throw new Error("Cloudflare R2 environment variables are missing.");
  }

  const endpoint = new URL(config.endpoint);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  endpoint.pathname = `/${config.bucket}/${encodedKey}`;
  endpoint.search = "";
  endpoint.hash = "";

  const method = "PUT";
  const host = endpoint.host;
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(body);
  const canonicalUri = endpoint.pathname;
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [method, canonicalUri, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signature = hmacHex(getSignatureKey(config.secretAccessKey, dateStamp, "auto", "s3"), stringToSign);
  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(endpoint, {
    method,
    headers: {
      Authorization: authorization,
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    },
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`R2 upload failed for ${key}: ${response.status} ${text}`);
  }
}

function parseSessionAudioFilename(file) {
  const name = basename(file, extname(file)).toLowerCase();
  const monthPattern = /(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?[-\s.]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[-\s.]+(\d{2,4})/i;
  const numericPattern = /(0?[1-9]|[12]\d|3[01])[.-](0?[1-9]|1[0-2])[.-](\d{2,4})/;
  const match = name.match(monthPattern) || name.match(numericPattern);
  if (!match || match.index === undefined) return null;

  const titlePart = name.slice(0, match.index).replace(/[_-]+$/g, "");
  const sessionName = toTitle(titlePart.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim());
  if (!sessionName) return null;

  let day;
  let month;
  let year;

  if (Number.isNaN(Number(match[2]))) {
    day = Number(match[1]);
    month = monthNumber(match[2]);
    year = normalizeYear(match[3]);
  } else {
    day = Number(match[1]);
    month = Number(match[2]);
    year = normalizeYear(match[3]);
  }

  if (!day || !month || !year) return null;
  return {
    sessionName,
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  };
}

function readDurationSeconds(file) {
  const result = spawnSync("afinfo", [file], { encoding: "utf8" });
  const output = `${result.stdout || ""}\n${result.stderr || ""}`;
  const match = output.match(/estimated duration:\s+([\d.]+)\s+sec/i);
  return match ? Math.round(Number(match[1])) : null;
}

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveR2Config() {
  const bucket = process.env.R2_BUCKET || "sacred-circle-media";
  let endpoint = process.env.R2_ENDPOINT || "";
  if (!endpoint && process.env.R2_ACCOUNT_ID) endpoint = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  if (endpoint) {
    const url = new URL(endpoint);
    const bucketFromPath = url.pathname.replace(/^\/+|\/+$/g, "");
    url.pathname = "";
    url.search = "";
    url.hash = "";
    endpoint = url.toString().replace(/\/$/, "");
    return {
      endpoint,
      bucket: process.env.R2_BUCKET || bucketFromPath || bucket,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    };
  }
  return {
    endpoint,
    bucket,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  };
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function getSignatureKey(secretAccessKey, dateStamp, regionName, serviceName) {
  const kDate = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmacBuffer(kDate, regionName);
  const kService = hmacBuffer(kRegion, serviceName);
  return hmacBuffer(kService, "aws4_request");
}

function hmacBuffer(key, data) {
  return createHmac("sha256", key).update(data).digest();
}

function hmacHex(key, data) {
  return createHmac("sha256", key).update(data).digest("hex");
}

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function contentTypeFor(extension) {
  if (extension === ".m4a") return "audio/mp4";
  if (extension === ".aac") return "audio/aac";
  return "audio/mpeg";
}

function addDays(value, days) {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(value) {
  const parsed = new Date(`${value}T00:00:00+05:30`);
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function monthNumber(value) {
  const key = value.slice(0, 3).toLowerCase();
  return {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  }[key] || 0;
}

function normalizeYear(value) {
  const year = Number(value);
  if (!Number.isFinite(year)) return 0;
  return year < 100 ? 2000 + year : year;
}

function toTitle(value) {
  return value.split(" ").filter(Boolean).map((part) => {
    if (/^\d+$/.test(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(" ");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "sacred-circle";
}

function printUsage() {
  console.log(`
Usage:
  node tools/import-session-audios.mjs "/path/to/audio-17-may-2026.mp3" [...]
  node tools/import-session-audios.mjs --dry-run "/path/to/audio-17-may-2026.mp3"
  node tools/import-session-audios.mjs --skip-upload "/path/to/audio-17-may-2026.mp3"

The filename must contain a date such as:
  theta-self-healing---21-june-2026.mp3
  3-finger-technique--12.1.25.mp3
`);
}
