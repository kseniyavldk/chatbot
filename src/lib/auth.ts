import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";

export const ANON_SESSION_COOKIE = "anon_session_id";
export const AUTH_COOKIE = "sb-access-token";

export type Identity =
  | { type: "authenticated"; userId: string; sessionId: null }
  | { type: "anonymous"; userId: null; sessionId: string };

export async function getIdentity(): Promise<Identity> {
  const cookieStore = await cookies();

  const token = cookieStore.get(AUTH_COOKIE)?.value;

  if (token) {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);
    if (!error && user) {
      return { type: "authenticated", userId: user.id, sessionId: null };
    }
  }

  const existingSession = cookieStore.get(ANON_SESSION_COOKIE)?.value;
  const sessionId = existingSession ?? generateSessionId();

  return { type: "anonymous", userId: null, sessionId };
}

function generateSessionId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
