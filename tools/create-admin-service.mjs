import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = readEnvFile(path.join(__dirname, "../.env.local"));
const supabaseUrl = process.env.SUPABASE_URL || env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = "sacredcircle45@gmail.com";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) throw listError;

let adminUser = usersData.users.find((user) => user.email?.toLowerCase() === adminEmail);
if (!adminUser) {
  const temporaryPassword = randomBytes(48).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: { name: "Sacred Circle" }
  });
  if (error) throw error;
  adminUser = data.user;
}

const { data: existingProfile, error: profileReadError } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", adminUser.id)
  .maybeSingle();
if (profileReadError) throw profileReadError;

if (!existingProfile) {
  const { error } = await supabase.from("profiles").insert({
    id: adminUser.id,
    email: adminEmail,
    name: "Sacred Circle",
    role: "admin"
  });
  if (error) throw error;
}

const { error: demoteError } = await supabase
  .from("profiles")
  .update({ role: "user" })
  .eq("role", "admin")
  .neq("id", adminUser.id);
if (demoteError) throw demoteError;

const { error: promoteError } = await supabase
  .from("profiles")
  .update({ role: "admin" })
  .eq("id", adminUser.id);
if (promoteError) throw promoteError;

console.log(`Admin access is restricted to ${adminEmail}.`);

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
      })
  );
}
