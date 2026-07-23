import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

let supabaseUrl = '';
let serviceRoleKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const cleanLine = line.trim();
    if (cleanLine.startsWith('#') || !cleanLine) continue;
    const [key, ...valueParts] = cleanLine.split('=');
    const value = valueParts.join('=').trim();
    if (key.trim() === 'SUPABASE_URL') {
      supabaseUrl = value;
    }
    if (key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') {
      serviceRoleKey = value;
    }
  }
} catch (err) {
  console.error("Error reading .env.local file:", err.message);
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

async function main() {
  console.log("Connecting to Supabase Auth Admin API:", supabaseUrl);
  
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error("Auth Admin API error:", response.status, errText);
    process.exit(1);
  }
  
  const data = await response.json();
  const users = data.users || [];
  
  console.log("\n--- Auth Users in Database ---");
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Provider: ${user.app_metadata?.provider}`);
  });
  
  const adminUser = users.find(u => u.email === 'sacredcircle45@gmail.com');
  if (!adminUser) {
    console.log("\n❌ The Sacred Circle admin does not exist in auth.users.");
  } else {
    console.log("\n✅ The Sacred Circle admin exists in auth.users.");
  }
}

main().catch(console.error);
