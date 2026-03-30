import { supabaseAdmin } from "@/lib/supabase/server";
import type { Message, Attachment } from "@/types";

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const { data: messages, error } = await supabaseAdmin
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (messages.length === 0) return [];

  const messageIds = messages.map((m) => m.id);

  const { data: attachments, error: attError } = await supabaseAdmin
    .from("attachments")
    .select("*")
    .in("message_id", messageIds);

  if (attError) throw attError;

  const attByMessage = (attachments ?? []).reduce<Record<string, Attachment[]>>(
    (acc, att) => {
      if (!acc[att.message_id]) acc[att.message_id] = [];
      acc[att.message_id].push(att);
      return acc;
    },
    {},
  );

  return messages.map((m) => ({
    ...m,
    attachments: attByMessage[m.id] ?? [],
  }));
}

export async function createMessage(params: {
  chatId: string;
  role: "user" | "assistant" | "system";
  content: string;
}): Promise<Message> {
  const { data, error } = await supabaseAdmin
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
