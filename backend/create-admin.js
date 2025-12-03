import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create Supabase Admin client
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// List of accounts to create
const ACCOUNTS = [
  { email: "sspdev2k25@gmail.com", password: "admin", role: "admin" },
  { email: "admin@example.com", password: "admin", role: "admin" },
  { email: "admin1@example.com", password: "admin", role: "admin" },
];

async function createAllUsers() {
  for (const acc of ACCOUNTS) {
    console.log(`Creating ${acc.email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { role: acc.role }
    });

    if (error) {
      console.log(`❌ Error for ${acc.email}:`, error.message);
    } else {
      console.log(`✅ Created ${acc.email}`);
    }
  }
}

createAllUsers();
