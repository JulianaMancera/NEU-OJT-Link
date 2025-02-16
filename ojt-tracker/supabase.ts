import { createClient } from "@supabase/supabase-js";

// Load environment variables (make sure these exist in .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client with session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // ✅ This ensures session data is stored
    autoRefreshToken: true, // ✅ Automatically refreshes token
    detectSessionInUrl: true, // ✅ Detects session from URL after login
  },
});
