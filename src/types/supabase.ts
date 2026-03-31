export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; created_at: string };
        Insert: { id: string; created_at?: string };
        Update: { created_at?: string };
      };
      chats: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          session_id?: string | null;
          title?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: { content?: string };
      };
      attachments: {
        Row: {
          id: string;
          message_id: string | null;
          type: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          extracted_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id?: string | null;
          type: string;
          storage_path: string;
          filename: string;
          mime_type: string;
          extracted_text?: string | null;
          created_at?: string;
        };
        Update: { message_id?: string | null; extracted_text?: string | null };
      };
      anonymous_sessions: {
        Row: {
          session_id: string;
          message_count: number;
          created_at: string;
          last_seen_at: string;
        };
        Insert: {
          session_id: string;
          message_count?: number;
          created_at?: string;
          last_seen_at?: string;
        };
        Update: { message_count?: number; last_seen_at?: string };
      };
    };
    Functions: {
      increment_session_count: {
        Args: { p_session_id: string };
        Returns: number;
      };
    };
  };
};
