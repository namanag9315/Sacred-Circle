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

// Fallback in case they are defined differently
if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!serviceRoleKey) serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Make sure they are defined in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("Supabase URL:", supabaseUrl);
  console.log("Using Service Role client...");
  
  // 1. Delete existing user if any
  console.log("\n1. Cleaning up existing 'admin@sacredcircle.com' if any...");
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Error listing users:", listError.message);
    process.exit(1);
  }
  
  const existingUser = usersData.users.find(u => u.email === 'admin@sacredcircle.com');
  if (existingUser) {
    console.log(`Found existing auth user with ID: ${existingUser.id}. Deleting...`);
    const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
    if (deleteError) {
      console.error("Failed to delete existing auth user:", deleteError.message);
    } else {
      console.log("Successfully deleted existing auth user.");
    }
  }

  // Delete profile just in case
  const { error: profileDeleteError } = await supabase
    .from('profiles')
    .delete()
    .eq('email', 'admin@sacredcircle.com');
  if (profileDeleteError) {
    console.log("Note (safe to ignore): profile cleanup warning:", profileDeleteError.message);
  }

  // 2. Create the user
  console.log("\n2. Creating new auth user: admin@sacredcircle.com...");
  const { data: createData, error: createError } = await supabase.auth.admin.createUser({
    email: 'admin@sacredcircle.com',
    password: 'admin123',
    email_confirm: true,
    user_metadata: { name: 'Sacred Admin' }
  });

  if (createError) {
    console.error("❌ Failed to create auth user:", createError.message);
    process.exit(1);
  }

  const newUserId = createData.user.id;
  console.log(`✅ Auth user created successfully with ID: ${newUserId}`);

  // 3. Double check if profile trigger worked
  console.log("\n3. Verifying if database trigger automatically created the profile...");
  await new Promise(resolve => setTimeout(resolve, 1000)); // wait a second for trigger
  
  const { data: profileCheck, error: profileCheckError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', newUserId)
    .maybeSingle();

  if (profileCheckError) {
    console.log("Warning checking profile:", profileCheckError.message);
  }

  let finalProfile = profileCheck;

  if (!finalProfile) {
    console.log("❌ Profile was NOT created automatically by the database trigger. Attempting manual insert...");
    const { data: manualProfile, error: manualError } = await supabase
      .from('profiles')
      .insert({
        id: newUserId,
        email: 'admin@sacredcircle.com',
        name: 'Sacred Admin',
        role: 'admin'
      })
      .select()
      .single();

    if (manualError) {
      console.error("❌ Failed to manually insert profile row:", manualError.message);
      process.exit(1);
    }
    finalProfile = manualProfile;
    console.log("✅ Profile row manually inserted successfully.");
  } else {
    console.log("✅ Profile row found (created automatically by trigger).");
  }

  // 4. Update the role to 'admin'
  console.log("\n4. Elevating role to 'admin'...");
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', newUserId)
    .select()
    .single();

  if (updateError) {
    console.error("❌ Failed to elevate role to 'admin':", updateError.message);
    process.exit(1);
  }

  console.log("\n🎉 SUCCESS! Admin account is fully created and elevated.");
  console.log("Credentials:");
  console.log("- Email: admin@sacredcircle.com");
  console.log("- Password: admin123");
}

main().catch(console.error);
