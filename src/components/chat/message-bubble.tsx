"use client";
import { useMemo } from "react";
import type { Message } from "@/types";

function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, "<pre><code>$2</code></pre>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[\*\-] (.+)$/gm, "<li>$1</li>")
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>',
    );
}

export function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";
  const html = useMemo(
    () => (isUser ? null : renderMarkdown(message.content)),
    [message.content, isUser],
  );
  const images = message.attachments?.filter((a) => a.type === "image") ?? [];
  const docs = message.attachments?.filter((a) => a.type === "document") ?? [];

  return (
    <div className={`msg ${isUser ? "user" : "assistant"}`}>
      <div className={`msg-avatar ${isUser ? "user" : "assistant"}`}>
        {isUser ? "U" : "AI"}
      </div>
      <div className="msg-body">
        {(images.length > 0 || docs.length > 0) && (
          <div className="attachment-grid">
            {images.map((att) => (
              <img
                key={att.id}
                className="attachment-thumb"
                src={`/api/attachment/${att.id}`}
                alt={att.filename}
              />
            ))}
            {docs.map((att) => (
              <div key={att.id} className="attachment-doc">
                <span>📄</span>
                <span>{att.filename}</span>
              </div>
            ))}
          </div>
        )}
        <div className={`msg-bubble ${isStreaming ? "typing-cursor" : ""}`}>
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
          ) : message.content === "" && isStreaming ? (
            <div className="thinking">
              <span />
              <span />
              <span />
            </div>
          ) : (
            <div
              dangerouslySetInnerHTML={{ __html: html ?? message.content }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
