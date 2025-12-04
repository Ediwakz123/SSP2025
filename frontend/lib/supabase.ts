import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseAnonKey } from "./env";

// Create the Supabase client with validated environment variables
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey());
