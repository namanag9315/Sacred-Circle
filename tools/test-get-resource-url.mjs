import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('#') || !cleanLine) continue;
    const [key, ...valueParts] = cleanLine.split('=');
    const value = valueParts.join('=').trim();
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL' || key.trim() === 'SUPABASE_URL') {
      supabaseUrl = value;
    }
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' || key.trim() === 'SUPABASE_ANON_KEY') {
      supabaseAnonKey = value;
    }
  }
} catch (err) {
  console.error("Error reading .env.local file:", err.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Simulating sign-in for client...");
  
  // 1. Sign in with explicitly supplied test credentials. Never commit them.
  const email = process.env.SACRED_CIRCLE_TEST_ADMIN_EMAIL;
  const password = process.env.SACRED_CIRCLE_TEST_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("SACRED_CIRCLE_TEST_ADMIN_EMAIL and SACRED_CIRCLE_TEST_ADMIN_PASSWORD are required.");
  }
  
  // Try logging in
  console.log("Signing in test user:", email);
  let signInRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  
  if (!signInRes.ok) {
    const errText = await signInRes.text();
    console.error("Sign in failed:", signInRes.status, errText);
    process.exit(1);
  }
  
  const tokenData = await signInRes.json();
  const accessToken = tokenData.access_token;
  
  console.log("Successfully authenticated. Token prefix:", accessToken.substring(0, 15) + "...");
  
  // 2. Call the Edge Function get-resource-url (Authenticated)
  const resourceId = "36ba173a-e69d-432e-a96b-339e42629c7a";
  console.log(`\nCalling get-resource-url (AUTHENTICATED) for resource: ${resourceId}...`);
  
  const response = await fetch(`${supabaseUrl}/functions/v1/get-resource-url`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resource_id: resourceId })
  });
  
  console.log("Authenticated Response Status:", response.status);
  const responseText = await response.text();
  console.log("Authenticated Response Body:", responseText);

  // 3. Call the Edge Function get-resource-url (ANONYMOUS/GUEST)
  console.log(`\nCalling get-resource-url (ANONYMOUS) for resource: ${resourceId}...`);
  
  const anonResponse = await fetch(`${supabaseUrl}/functions/v1/get-resource-url`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ resource_id: resourceId })
  });
  
  console.log("Anonymous Response Status:", anonResponse.status);
  const anonResponseText = await anonResponse.text();
  console.log("Anonymous Response Body:", anonResponseText);
}

main().catch(console.error);
