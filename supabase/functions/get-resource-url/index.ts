import { createClient } from "npm:@supabase/supabase-js@2";
import { S3Client, GetObjectCommand } from "npm:@aws-sdk/client-s3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

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

    const authHeader = req.headers.get("Authorization") || "";
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userClient = authHeader
      ? createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } }
        })
      : null;
    
    // Get user optionally (don't fail immediately for public audios)
    let user = null;
    if (userClient) {
      const token = authHeader.replace("Bearer ", "");
      const userResult = await userClient.auth.getUser(token);
      user = userResult.data?.user || null;
    }

    const body = await req.json();
    const resourceId = body.resource_id as string | undefined;
    const accessCode = typeof body.access_code === "string" ? body.access_code.trim() : "";
    if (!resourceId) return json({ error: "resource_id is required." }, 400);

    const { data: resource, error: resourceError } = await adminClient
      .from("resources")
      .select("*")
      .eq("id", resourceId)
      .eq("status", "published")
      .single();

    if (resourceError || !resource) return json({ error: "Resource not found." }, 404);

    if (resource.access_type === "session_protected") {
      if (!user || !userClient) return json({ error: "Authentication required.", status: "auth_required" }, 401);

      const { data: authorization, error: authorizationError } = await userClient.rpc("authorize_resource_playback", {
        p_resource_id: resourceId,
        p_code: accessCode
      });
      if (authorizationError) throw authorizationError;

      const authorizationStatus = String(authorization || "access_denied");
      if (authorizationStatus === "rate_limited") {
        return json({ error: "Too many attempts. Please wait 15 minutes before trying again.", status: authorizationStatus }, 429);
      }
      if (authorizationStatus === "expired_code") {
        return json({ error: "This Sacred Access Key has expired.", status: authorizationStatus }, 403);
      }
      if (authorizationStatus === "auth_required") {
        return json({ error: "Authentication required.", status: authorizationStatus }, 401);
      }
      if (authorizationStatus === "resource_not_found") {
        return json({ error: "Resource not found.", status: authorizationStatus }, 404);
      }
      if (!["authorized", "unlocked"].includes(authorizationStatus)) {
        return json({ error: "The Sacred Access Key is incorrect.", status: authorizationStatus }, 403);
      }
    } else if (resource.access_type !== "public") {
      if (!user) return json({ error: "Authentication required." }, 401);

      const { data: canAccess, error: accessError } = await adminClient.rpc("user_can_access_resource", {
        check_resource: resourceId,
        check_user: user.id
      });

      if (accessError || !canAccess) {
        return json({ error: "Access denied." }, 403);
      }
    }

    // A protected resource must not disclose a permanent third-party URL.
    // Store protected recordings privately in Supabase Storage or R2 so this
    // endpoint can issue a time-limited URL only after checking the key.
    if (
      resource.access_type === "session_protected" &&
      (resource.external_url || resource.youtube_url)
    ) {
      return json(
        {
          error: "Protected recordings must use private Supabase Storage or R2 media.",
          status: "protected_media_must_be_private"
        },
        409
      );
    }

    if (resource.external_url) return json({ url: resource.external_url });
    if (resource.youtube_url) return json({ url: resource.youtube_url });

    // Cover the full recording plus a restart/seek buffer without issuing a
    // permanent media URL. The previous fixed 15-minute TTL could interrupt
    // longer Sunday sessions while the app was playing in the background.
    const signedUrlTtlSeconds = Math.min(
      Math.max(Number(resource.duration_seconds || 0) + 30 * 60, 60 * 60),
      6 * 60 * 60
    );

    if (resource.storage_provider === "supabase" && resource.storage_path) {
      const signed = await adminClient.storage.from("sacred-circle-media").createSignedUrl(resource.storage_path, signedUrlTtlSeconds);
      if (signed.error) throw signed.error;
      return json({ url: signed.data.signedUrl });
    }

    if (resource.storage_provider === "r2" && resource.storage_path) {
      if (!r2Config.endpoint || !r2AccessKeyId || !r2SecretAccessKey) {
        throw new Error("Cloudflare R2 environment variables are missing.");
      }

      const client = new S3Client({
        region: "auto",
        endpoint: r2Config.endpoint,
        credentials: {
          accessKeyId: r2AccessKeyId,
          secretAccessKey: r2SecretAccessKey
        }
      });
      const command = new GetObjectCommand({ Bucket: r2Config.bucket, Key: resource.storage_path });
      const url = await getSignedUrl(client, command, { expiresIn: signedUrlTtlSeconds });
      return json({ url });
    }

    return json({ error: "No playable URL is attached." }, 404);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unable to create media URL." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store, max-age=0",
      "Pragma": "no-cache"
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
