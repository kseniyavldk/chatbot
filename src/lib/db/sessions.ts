import { supabaseAdmin } from "@/lib/supabase/server";
import { ANON_MESSAGE_LIMIT } from "@/types";

// ✅ Получение или создание сессии
export async function getOrCreateSession(sessionId: string) {
  const { data, error } = await supabaseAdmin
    .from("anonymous_sessions")
    .upsert(
      {
        session_id: sessionId,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ✅ Увеличение счетчика сообщений
export async function incrementSessionCount(
  sessionId: string,
): Promise<number> {
  // Вызываем RPC (это атомарно и надежнее)
  const { data, error: rpcError } = await supabaseAdmin.rpc(
    "increment_session_count",
    {
      p_session_id: sessionId,
    },
  );

  if (!rpcError) return data ?? 0;

  // Fallback: если RPC не настроен в базе, делаем инкремент вручную
  // Используем .select().single() для получения текущего значения
  const { data: currentData } = await supabaseAdmin
    .from("anonymous_sessions")
    .select("message_count")
    .eq("session_id", sessionId)
    .single();

  const newCount = (currentData?.message_count ?? 0) + 1;

  const { error: updateError } = await supabaseAdmin
    .from("anonymous_sessions")
    .update({
      message_count: newCount,
      last_seen_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  if (updateError) throw updateError;
  return newCount;
}

// ✅ Проверка лимита
export async function isSessionLimitReached(
  sessionId: string,
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("anonymous_sessions")
    .select("message_count")
    .eq("session_id", sessionId)
    .maybeSingle(); // Используем maybeSingle, чтобы не падать, если сессии нет

  if (error || !data) return false;
  return data.message_count >= ANON_MESSAGE_LIMIT;
}
