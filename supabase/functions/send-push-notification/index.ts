import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";
const expoTokenPattern = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

type PushTokenRow = {
  expo_push_token: string;
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    const authHeader = req.headers.get("Authorization") || "";
    const accessToken = authHeader.replace(/^Bearer\s+/i, "");
    if (!accessToken) return json({ error: "Authentication required." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const userResult = await userClient.auth.getUser(accessToken);
    const user = userResult.data.user;
    if (!user || userResult.error) return json({ error: "Authentication required." }, 401);

    const { data: isAdmin, error: adminError } = await adminClient.rpc("is_admin", {
      check_user: user.id
    });
    if (adminError || !isAdmin) return json({ error: "Admin access required." }, 403);

    const payload = await req.json();
    const title = String(payload.title || "").trim();
    const message = String(payload.body || payload.message || "").trim();
    const sessionId = payload.session_id ? String(payload.session_id).trim() : null;

    if (title.length < 3 || title.length > 80) {
      return json({ error: "Title must be between 3 and 80 characters." }, 400);
    }
    if (message.length < 3 || message.length > 240) {
      return json({ error: "Message must be between 3 and 240 characters." }, 400);
    }
    if (sessionId && !isUuid(sessionId)) {
      return json({ error: "The selected session is not valid." }, 400);
    }

    const { data: preferences, error: preferenceError } = await adminClient
      .from("notification_preferences")
      .select("user_id")
      .eq("sunday_session_enabled", true)
      .limit(5000);
    if (preferenceError) throw preferenceError;

    const optedInUserIds = Array.from(new Set((preferences || []).map((row) => String(row.user_id))));
    const tokenRows: PushTokenRow[] = [];
    for (const userIds of chunk(optedInUserIds, 200)) {
      const { data, error } = await adminClient
        .from("push_tokens")
        .select("expo_push_token")
        .in("user_id", userIds);
      if (error) throw error;
      tokenRows.push(...((data || []) as PushTokenRow[]));
    }

    const tokens = Array.from(new Set(
      tokenRows
        .map((row) => String(row.expo_push_token || "").trim())
        .filter((token) => expoTokenPattern.test(token))
    ));

    if (!tokens.length) {
      await recordHistory(adminClient, {
        title,
        message,
        userId: user.id,
        sessionId,
        recipientCount: 0,
        acceptedCount: 0,
        failedCount: 0,
        status: "no_recipients"
      });
      return json({
        recipient_count: 0,
        accepted_count: 0,
        failed_count: 0,
        status: "no_recipients"
      });
    }

    const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    const requestHeaders: Record<string, string> = {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json"
    };
    if (expoAccessToken) requestHeaders.Authorization = `Bearer ${expoAccessToken}`;

    let acceptedCount = 0;
    let failedCount = 0;
    const invalidTokens: string[] = [];

    for (const tokenChunk of chunk(tokens, 100)) {
      const messages = tokenChunk.map((token) => ({
        to: token,
        title,
        body: message,
        sound: "default",
        channelId: "sunday-sessions",
        priority: "high",
        data: {
          type: "sunday_session",
          session_id: sessionId
        }
      }));
      const expoResponse = await fetch(expoPushEndpoint, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(messages)
      });
      const expoPayload = await expoResponse.json().catch(() => null);
      if (!expoResponse.ok) {
        throw new Error(expoPayload?.errors?.[0]?.message || "Expo rejected the push request.");
      }

      const tickets = (Array.isArray(expoPayload?.data) ? expoPayload.data : []) as ExpoPushTicket[];
      tokenChunk.forEach((token, index) => {
        const ticket = tickets[index];
        if (ticket?.status === "ok") {
          acceptedCount += 1;
          return;
        }
        failedCount += 1;
        if (ticket?.details?.error === "DeviceNotRegistered") invalidTokens.push(token);
      });
    }

    if (invalidTokens.length) {
      await adminClient.from("push_tokens").delete().in("expo_push_token", invalidTokens);
    }

    const status = acceptedCount === tokens.length
      ? "accepted"
      : acceptedCount > 0
        ? "partial"
        : "failed";
    await recordHistory(adminClient, {
      title,
      message,
      userId: user.id,
      sessionId,
      recipientCount: tokens.length,
      acceptedCount,
      failedCount,
      status
    });

    return json({
      recipient_count: tokens.length,
      accepted_count: acceptedCount,
      failed_count: failedCount,
      status
    });
  } catch (error) {
    console.error("send-push-notification", error);
    return json({ error: error instanceof Error ? error.message : "Unable to send notification." }, 500);
  }
});

async function recordHistory(
  adminClient: ReturnType<typeof createClient>,
  input: {
    title: string;
    message: string;
    userId: string;
    sessionId: string | null;
    recipientCount: number;
    acceptedCount: number;
    failedCount: number;
    status: string;
  }
) {
  const { error } = await adminClient.from("notification_history").insert({
    title: input.title,
    message: input.message,
    target_type: "sunday_session",
    sent_by: input.userId,
    session_id: input.sessionId,
    recipient_count: input.recipientCount,
    accepted_count: input.acceptedCount,
    failed_count: input.failedCount,
    status: input.status
  });
  if (error) throw error;
}

function chunk<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
