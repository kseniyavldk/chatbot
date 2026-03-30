import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase"; // Путь к твоему файлу с типами

if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const globalForSupabase = globalThis as unknown as {
  _supabaseAdmin: ReturnType<typeof createClient<Database>> | undefined;
};

export const supabaseAdmin =
  globalForSupabase._supabaseAdmin ??
  createClient<Database>(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

if (process.env.NODE_ENV !== "production") {
  globalForSupabase._supabaseAdmin = supabaseAdmin;
}
