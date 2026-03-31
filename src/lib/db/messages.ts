import { supabaseAdmin } from "@/lib/supabase/server";
import type { Message, Attachment } from "@/types";

const db = supabaseAdmin as any;

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const { data: messages, error } = await db
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!messages || messages.length === 0) return [];

  const messageIds = messages.map((m: any) => m.id);

  const { data: attachments, error: attError } = await db
    .from("attachments")
    .select("*")
    .in("message_id", messageIds);

  if (attError) throw attError;

  const attByMessage: Record<string, Attachment[]> = (attachments ?? []).reduce(
    (acc: Record<string, Attachment[]>, att: any) => {
      if (!acc[att.message_id]) acc[att.message_id] = [];
      acc[att.message_id].push(att);
      return acc;
    },
    {},
  );
  return messages.map((m: any) => ({
    ...m,
    attachments: attByMessage[m.id] ?? [],
  }));
}

export async function createMessage(params: {
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
}): Promise<Message> {
  const { data, error } = await db
    .from("messages")
    .insert({
      chat_id: params.chatId,
      role: params.role,
      content: params.content,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, attachments: [] };
}
