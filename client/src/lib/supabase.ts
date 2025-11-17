import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://kjyqncjvpnmmxzothrva.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqeXFuY2p2cG5tbXh6b3RocnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzExNTEsImV4cCI6MjA3ODkwNzE1MX0.-3Tw4l_7VCuDT-v1Lcd3cMQmKHQUK7OQwwPEoAqwWn0";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? FALLBACK_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    "Supabase env vars missing. Falling back to the defaults in .env.example."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
