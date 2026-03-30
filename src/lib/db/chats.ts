import { supabaseAdmin } from "@/lib/supabase/server";
import type { Chat } from "@/types";

export async function getChatsByUser(userId: string): Promise<Chat[]> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getChatsBySession(sessionId: string): Promise<Chat[]> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("*")
    .eq("session_id", sessionId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getChatById(id: string): Promise<Chat | null> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function createChat(params: {
  userId?: string;
  sessionId?: string;
  title?: string;
}): Promise<Chat> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .insert({
      user_id: params.userId ?? null,
      session_id: params.sessionId ?? null,
      title: params.title ?? "New chat",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateChatTitle(
  id: string,
  title: string,
): Promise<Chat> {
  const { data, error } = await supabaseAdmin
    .from("chats")
    .update({ title })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteChat(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("chats").delete().eq("id", id);

  if (error) throw error;
}

export async function assertChatOwner(
  chatId: string,
  owner: { userId?: string; sessionId?: string },
): Promise<Chat> {
  const chat = await getChatById(chatId);
  if (!chat) throw new Error("NOT_FOUND");

  const owned =
    (owner.userId && chat.user_id === owner.userId) ||
    (owner.sessionId && chat.session_id === owner.sessionId);

  if (!owned) throw new Error("FORBIDDEN");
  return chat;
}
