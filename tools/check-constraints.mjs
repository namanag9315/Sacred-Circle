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
  console.log("Checking database constraints for profiles on:", supabaseUrl);
  
  // Query postgres catalog via RPC if possible or system view. 
  // Let's use RPC function if available, or check if we can select from information_schema.
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `
        SELECT conname, contype, pg_get_constraintdef(c.oid) as def
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'profiles';
      `
    })
  });
  
  if (!response.ok) {
    console.log("RPC execute_sql is not available (404/403/500). Falling back to checking table columns...");
    
    // Fallback: check table schema via REST
    const columnsRes = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseAnonKey}`);
    if (columnsRes.ok) {
      const spec = await columnsRes.json();
      console.log("\nTable specs available:", Object.keys(spec.definitions || {}));
      if (spec.definitions && spec.definitions.profiles) {
        console.log("\nProfiles definition properties:");
        console.log(JSON.stringify(spec.definitions.profiles.properties, null, 2));
      }
    } else {
      console.error("Failed to query table columns:", columnsRes.status);
    }
    return;
  }
  
  const constraints = await response.json();
  console.log("\n--- Constraints on profiles table ---");
  console.log(JSON.stringify(constraints, null, 2));
}

main().catch(console.error);
