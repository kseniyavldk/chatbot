"use client";
import { use, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat } from "@/hooks/useChat";
import { useChats } from "@/hooks/useChats";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";

const SUGGESTIONS = [
  "Explain quantum entanglement simply",
  "Write a Python web scraper",
  "Draft a project proposal template",
  "Best practices for REST APIs?",
];

export default function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = use(params);
  const qc = useQueryClient();
  const { renameChat } = useChats();
  const {
    messages,
    messagesLoading,
    isStreaming,
    error,
    setError,
    sendMessage,
    stopStreaming,
    pendingAttachments,
    addAttachment,
    removeAttachment,
    uploadingFiles,
  } = useChat(chatId);

  const [title, setTitle] = useState("New chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasAutoNamed = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (hasAutoNamed.current) return;
    const firstUser = messages.find((m) => m.role === "user");
    if (firstUser) {
      hasAutoNamed.current = true;
      const autoTitle =
        firstUser.content.slice(0, 48) +
        (firstUser.content.length > 48 ? "…" : "");
      setTitle(autoTitle);
      renameChat({ id: chatId, title: autoTitle }).catch(() => {});
    }
  }, [messages, chatId, renameChat]);

  const lastMsg = messages[messages.length - 1];
  const isLastStreaming = isStreaming && lastMsg?.role === "assistant";

  return (
    <div className="chat-area">
      <div className="chat-topbar">
        <input
          className="chat-title-editable"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={(e) =>
            renameChat({
              id: chatId,
              title: e.target.value.trim() || "New chat",
            })
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
        />
      </div>

      <div className="messages-scroll">
        {messagesLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px",
            }}
          >
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✦</div>
            <h2>Start a conversation</h2>
            <p>Ask anything — or pick a suggestion below.</p>
            <div className="empty-suggestions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-inner">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isLastStreaming && i === messages.length - 1}
              />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div
          className="toast error"
          onClick={() => setError(null)}
          style={{ cursor: "pointer" }}
        >
          {error}
        </div>
      )}

      <ChatInput
        onSend={sendMessage}
        isStreaming={isStreaming}
        onStop={stopStreaming}
        pendingAttachments={pendingAttachments}
        onAddFile={addAttachment}
        onRemoveAttachment={removeAttachment}
        uploadingFiles={uploadingFiles}
      />
    </div>
  );
}
