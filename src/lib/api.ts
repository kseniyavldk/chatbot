import type { Chat, Message, Attachment } from "@/types";

const BASE = "/api";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(body.error ?? "Request failed"), {
      status: res.status,
    });
  }
  return res.json();
}

export async function fetchChats(): Promise<Chat[]> {
  const data = await request<{ chats: Chat[] }>("/chats");
  return data.chats;
}

export async function createChat(title?: string): Promise<Chat> {
  const data = await request<{ chat: Chat }>("/chats", {
    method: "POST",
    body: JSON.stringify({ title }),
  });
  return data.chat;
}

export async function renameChat(id: string, title: string): Promise<Chat> {
  const data = await request<{ chat: Chat }>(`/chats/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return data.chat;
}

export async function deleteChat(id: string): Promise<void> {
  await fetch(`${BASE}/chats/${id}`, { method: "DELETE" });
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const data = await request<{ messages: Message[] }>(`/messages/${chatId}`);
  return data.messages;
}

export async function uploadFile(file: File): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${BASE}/upload`, { method: "POST", body: formData });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(body.error);
  }
  const data = await res.json();
  return data.attachment;
}

export async function login(email: string, password: string) {
  return request<{ user: { id: string; email: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return request<{ user: { id: string; email: string } }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  await fetch(`${BASE}/auth/logout`, { method: "POST" });
}

export async function getMe() {
  return request<{ user: { id: string; email: string } | null }>("/auth/me");
}

export async function streamMessage(
  chatId: string,
  content: string,
  attachmentIds: string[],
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${BASE}/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      content,
      attachment_ids: attachmentIds,
    }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Stream failed" }));
    throw Object.assign(new Error(body.error ?? "Stream failed"), {
      status: res.status,
    });
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    for (const line of text.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const json = JSON.parse(data);
        if (json.text) onChunk(json.text);
      } catch {}
    }
  }
}
