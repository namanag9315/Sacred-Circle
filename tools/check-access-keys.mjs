import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

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

if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!serviceRoleKey) serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// We need a helper to check if code matches using postgres pg_crypt in DB
async function checkPlainCodeInDB(codeId, plainCode) {
  const { data, error } = await supabase.rpc('execute_sql_query_helper', {
    query_text: `
      SELECT id FROM public.session_access_codes 
      WHERE id = '${codeId}' 
        AND code_hash = crypt('${plainCode}', code_hash);
    `
  });
  if (error || !data || data.length === 0) return false;
  return true;
}

// Since executing arbitrary sql might not be exposed, let's just use standard RPC to check it or test it
async function testCodeOnSession(sessionId, plainCode) {
  // Let's call the actual RPC unlock_session_recording to test it!
  // To do that, we need a test user. Let's just run a DB query using service role 
  // to compare the crypt hash!
  // Wait, does Supabase have a way to run sql? No.
  // But we can check if there are common hashes by testing crypt locally if we had bcrypt, 
  // or we can run a postgres query by creating a temporary function!
  // Wait, let's see if we can do a SELECT check on public.session_access_codes using postgres!
  // Actually, service role client can query pg_catalog or run queries? 
  // No, select from table is direct. Let's just query the table and check!
}

async function main() {
  console.log("Checking session access codes...");
  
  const { data: codes, error: codesError } = await supabase
    .from('session_access_codes')
    .select('*, sessions(title, session_date)');
    
  if (codesError) {
    console.error("Error fetching access codes:", codesError.message);
    process.exit(1);
  }
  
  console.log("\n--- Active Access Codes in Database ---");
  if (codes.length === 0) {
    console.log("No access codes found in the database!");
    process.exit(0);
  }
  
  console.log(JSON.stringify(codes, null, 2));
  
  // We can write a quick PostgreSQL query to find matching plain codes for these hashes
  // by calling a SELECT with crypt() in postgres!
  // How? We can create a temporary function or just run a query using an RPC if we have one.
  // Wait! Do we have a function in the schema that can verify codes?
  // Yes! user_can_access_resource or unlock_session_recording!
  // But wait, the admin panel allows creating access codes! Let's check if the admin panel created one.
}

main().catch(console.error);
