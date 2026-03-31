"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChats } from "@/hooks/useChats";

export default function HomePage() {
  const router = useRouter();
  const { chats, isLoading, createChat } = useChats();

  useEffect(() => {
    if (isLoading) return;
    if (chats.length > 0) router.replace(`/chat/${chats[0].id}`);
  }, [isLoading, chats, router]);

  if (isLoading)
    return (
      <div className="chat-area">
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="spinner" />
        </div>
      </div>
    );

  return (
    <div className="chat-area">
      <div className="empty-state" style={{ flex: 1 }}>
        <div
          className="empty-state-icon"
          style={{ width: 60, height: 60, fontSize: 28 }}
        >
          ✦
        </div>
        <h2 style={{ fontSize: 22 }}>How can I help you today?</h2>
        <p>Start a conversation, attach documents, or paste an image.</p>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "10px 28px", marginTop: 8 }}
          onClick={async () => {
            const c = await createChat(undefined);
            router.push(`/chat/${c.id}`);
          }}
        >
          New chat
        </button>
      </div>
    </div>
  );
}
