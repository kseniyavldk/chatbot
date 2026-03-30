export type Database = {
  public: {
    Tables: {
      anonymous_sessions: {
        Row: {
          session_id: string;
          message_count: number;
          last_seen_at: string;
        };
        Insert: {
          session_id: string;
          message_count?: number;
          last_seen_at?: string;
        };
        Update: {
          message_count?: number;
          last_seen_at?: string;
        };
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
