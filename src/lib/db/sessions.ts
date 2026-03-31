import { supabaseAdmin } from "@/lib/supabase/server";
import { ANON_MESSAGE_LIMIT } from "@/types";

const db = supabaseAdmin as any;

export async function getOrCreateSession(sessionId: string) {
  const { data: existing } = await db
    .from("anonymous_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (existing) return existing;

  const { data, error } = await db
    .from("anonymous_sessions")
    .insert({ session_id: sessionId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function incrementSessionCount(sessionId: string): Promise<void> {
  const { data: row } = await db
    .from("anonymous_sessions")
    .select("message_count")
    .eq("session_id", sessionId)
    .single();

  await db
    .from("anonymous_sessions")
    .update({
      message_count: (row?.message_count ?? 0) + 1,
      last_seen_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);
}

export async function isSessionLimitReached(
  sessionId: string,
): Promise<boolean> {
  const { data } = await db
    .from("anonymous_sessions")
    .select("message_count")
    .eq("session_id", sessionId)
    .single();

  return (data?.message_count ?? 0) >= ANON_MESSAGE_LIMIT;
}
