// backend/lib/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars. ' +
      'Check your .env.local / Vercel project settings.'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
