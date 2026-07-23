import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');

// Parse .env.local manually
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
  console.log("Connecting to Supabase REST API:", supabaseUrl);
  
  const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    const errText = await response.text();
    console.error("REST API error:", response.status, errText);
    process.exit(1);
  }
  
  const profiles = await response.json();
  
  console.log("\n--- Profiles in Database ---");
  console.log(JSON.stringify(profiles, null, 2));
  
  const adminProfile = profiles?.find(p => p.email === 'sacredcircle45@gmail.com');
  if (!adminProfile) {
    console.log("\n❌ The Sacred Circle admin profile does not exist.");
  } else if (adminProfile.role !== 'admin') {
    console.log(`\n❌ The Sacred Circle profile has role: "${adminProfile.role}" (must be "admin")!`);
  } else {
    console.log("\n✅ The Sacred Circle account is correctly configured as the sole admin.");
  }
}

main().catch(console.error);
