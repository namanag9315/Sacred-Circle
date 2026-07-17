#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const standardTables = new Set(["pages", "programs", "events", "videos", "resources"]);
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((arg) => arg !== "--dry-run");

if (!positional.length) {
  printUsage();
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!dryRun && (!supabaseUrl || !serviceRoleKey)) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = dryRun ? null : createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const jobs = collectJobs(positional);

for (const job of jobs) {
  await importCsv(job.file, job.table);
}

function collectJobs(input) {
  const first = resolve(input[0]);
  if (statSync(first).isDirectory()) {
    return readdirSync(first)
      .filter((file) => file.endsWith(".csv"))
      .map((file) => {
        const table = basename(file, ".csv");
        if (!standardTables.has(table)) throw new Error(`Unknown template table: ${table}`);
        return { file: join(first, file), table };
      });
  }

  const table = input[1] || basename(first, ".csv");
  if (!standardTables.has(table)) throw new Error(`Unknown table: ${table}`);
  return [{ file: first, table }];
}

async function importCsv(file, table) {
  const rows = parseCsv(readFileSync(file, "utf8")).map((row) => normalizeRow(table, row));
  console.log(`${dryRun ? "Checking" : "Importing"} ${rows.length} rows into ${table} from ${file}`);

  for (const row of rows) {
    if (dryRun) {
      console.log("  DRY", table, naturalKeyFor(table, row), row.title || row.slug);
      continue;
    }

    const existing = await findExisting(table, row);
    if (existing?.id) {
      const { error } = await supabase.from(table).update(row).eq("id", existing.id);
      if (error) throw error;
      console.log("  updated", table, existing.id, row.title || row.slug);
    } else {
      const { error } = await supabase.from(table).insert(row);
      if (error) throw error;
      console.log("  inserted", table, row.title || row.slug);
    }
  }
}

async function findExisting(table, row) {
  const key = naturalKeyFor(table, row);
  if (!key) return null;
  let query = supabase.from(table).select("id").limit(1);
  for (const [column, value] of Object.entries(key)) {
    if (value === null || value === undefined || value === "") return null;
    query = query.eq(column, value);
  }
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

function naturalKeyFor(table, row) {
  if (table === "pages") return { slug: row.slug };
  if (table === "videos") return { youtube_url: row.youtube_url };
  if (table === "resources") {
    if (row.storage_path) return { storage_path: row.storage_path };
    if (row.external_url) return { external_url: row.external_url };
    if (row.youtube_url) return { youtube_url: row.youtube_url };
    return { title: row.title };
  }
  return { title: row.title };
}

function normalizeRow(table, row) {
  const next = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === "") next[key] = null;
    else if (["display_order", "duration_seconds"].includes(key)) next[key] = Number(value);
    else if (["is_featured", "registration_enabled"].includes(key)) next[key] = ["true", "yes", "1"].includes(String(value).toLowerCase());
    else next[key] = value;
  }

  if (table === "resources" && next.access_type === "session_protected" && !next.session_id) {
    throw new Error(`Protected resource "${next.title}" needs session_id.`);
  }
  if (table === "videos" && !next.youtube_url) throw new Error(`Video "${next.title}" needs youtube_url.`);
  if (table === "pages" && !next.slug) throw new Error("Page row needs slug.");

  return next;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((item) => item !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((item) => item !== "")) rows.push(row);
  }

  const [headers, ...body] = rows;
  if (!headers?.length) return [];
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index]?.trim() ?? ""])));
}

function printUsage() {
  console.log(`
Usage:
  node tools/import-content.mjs content-migration/templates --dry-run
  node tools/import-content.mjs content-migration/templates/programs.csv programs

Required env for real imports:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
`);
}
