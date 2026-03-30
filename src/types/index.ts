export interface Profile {
  id: string;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string | null;
  session_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  message_id: string;
  type: "image" | "document";
  storage_path: string;
  filename: string;
  mime_type: string;
  extracted_text: string | null;
  created_at: string;
}

export interface AnonymousSession {
  session_id: string;
  message_count: number;
  created_at: string;
  last_seen_at: string;
}

export const ANON_MESSAGE_LIMIT = 3;
