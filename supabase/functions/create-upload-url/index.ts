import { createClient } from "npm:@supabase/supabase-js@2";
import { PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const allowedPrefixes = [
  "public/audios/",
  "public/images/",
  "public/pdfs/",
  "protected/sunday-sessions/"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const r2Endpoint = Deno.env.get("R2_ENDPOINT");
    const r2AccountId = Deno.env.get("R2_ACCOUNT_ID");
    const r2AccessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const r2SecretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY");
    const r2Config = resolveR2Config(r2Endpoint, r2AccountId, Deno.env.get("R2_BUCKET"));

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase environment variables are missing.");
    }
    if (!r2Config.endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
      throw new Error("Cloudflare R2 environment variables are missing.");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const token = authHeader.replace("Bearer ", "");
    const userResult = await userClient.auth.getUser(token);
    const user = userResult.data.user;

    if (!user || userResult.error) {
      return json({ error: "Authentication required." }, 401);
    }

    const { data: isAdmin, error: adminError } = await adminClient.rpc("is_admin", {
      check_user: user.id
    });
    if (adminError || !isAdmin) {
      return json({ error: "Admin access required." }, 403);
    }

    const body = await req.json();
    const path = normalizePath(String(body.path || ""));
    const contentType = String(body.content_type || "application/octet-stream");

    if (!path) return json({ error: "path is required." }, 400);
    if (!allowedPrefixes.some((prefix) => path.startsWith(prefix))) {
      return json({ error: "Upload path must be inside the Sacred Circle media folders." }, 400);
    }
    if (path.includes("..") || path.startsWith("/") || path.endsWith("/")) {
      return json({ error: "Upload path is not valid." }, 400);
    }
    if (!isAllowedContentType(contentType, path)) {
      return json({ error: "Only MP3/AAC audio, images, and PDFs are allowed." }, 400);
    }

    const client = new S3Client({
      region: "auto",
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretAccessKey
      }
    });

    const command = new PutObjectCommand({
      Bucket: r2Config.bucket,
      Key: path,
      ContentType: contentType
    });
    const url = await getSignedUrl(client, command, { expiresIn: 60 * 10 });

    return json({ url, path, expires_in: 600 });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create upload URL." }, 500);
  }
});

function normalizePath(path: string) {
  return path.trim().replace(/^sacred-circle-media\//, "");
}

function isAllowedContentType(contentType: string, path: string) {
  const lowerPath = path.toLowerCase();
  const lowerType = contentType.toLowerCase();
  if (lowerPath.endsWith(".mp3")) return lowerType === "audio/mpeg" || lowerType === "audio/mp3" || lowerType === "application/octet-stream";
  if (lowerPath.endsWith(".m4a") || lowerPath.endsWith(".aac")) return lowerType.includes("aac") || lowerType.includes("mp4") || lowerType === "application/octet-stream";
  if (lowerPath.endsWith(".pdf")) return lowerType === "application/pdf" || lowerType === "application/octet-stream";
  if (/\.(png|jpg|jpeg|webp)$/i.test(lowerPath)) return lowerType.startsWith("image/") || lowerType === "application/octet-stream";
  return false;
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

function resolveR2Config(endpoint: string | undefined, accountId: string | undefined, bucket: string | undefined) {
  const fallbackBucket = bucket || "sacred-circle-media";
  if (!endpoint) {
    return {
      endpoint: accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "",
      bucket: fallbackBucket
    };
  }

  const url = new URL(endpoint);
  const bucketFromPath = url.pathname.replace(/^\/+|\/+$/g, "");
  url.pathname = "";
  url.search = "";
  url.hash = "";

  return {
    endpoint: url.toString().replace(/\/$/, ""),
    bucket: bucket || bucketFromPath || fallbackBucket
  };
}
