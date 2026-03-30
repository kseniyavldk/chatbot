"use client";
import { useRef, useCallback, KeyboardEvent } from "react";
import type { Attachment } from "@/types";

interface Props {
  onSend: (content: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  pendingAttachments: Attachment[];
  onAddFile: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
  uploadingFiles: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
  pendingAttachments,
  onAddFile,
  onRemoveAttachment,
  uploadingFiles,
  disabled,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function autoResize() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 240) + "px";
  }

  function handleSend() {
    const val = textareaRef.current?.value.trim();
    if (!val || isStreaming || disabled) return;
    onSend(val);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault();
        const file = imageItem.getAsFile();
        if (file) onAddFile(file);
      }
    },
    [onAddFile],
  );

  return (
    <div className="input-area">
      <div
        className="input-box"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          Array.from(e.dataTransfer.files).forEach(onAddFile);
        }}
      >
        {pendingAttachments.length > 0 && (
          <div className="input-attachments-preview">
            {pendingAttachments.map((att) => (
              <div key={att.id} className="input-att-item">
                {att.type === "image" ? (
                  <img
                    src={`/api/attachment/${att.id}`}
                    alt={att.filename}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 8,
                      objectFit: "cover",
                      border: "1px solid var(--border)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--bg-3)",
                      fontSize: 12,
                      color: "var(--text-2)",
                    }}
                  >
                    <span>📄</span>
                    <span>{att.filename}</span>
                  </div>
                )}
                <button
                  className="input-att-remove"
                  onClick={() => onRemoveAttachment(att.id)}
                >
                  ✕
                </button>
              </div>
            ))}
            {uploadingFiles && (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className="spinner" />
              </div>
            )}
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Message… (Shift+Enter for newline)"
          onInput={autoResize}
          disabled={disabled}
          rows={1}
          onPaste={handlePaste}
          onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="input-toolbar">
          <div className="input-tools">
            <button
              className="icon-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              📎
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.md"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                Array.from(e.target.files ?? []).forEach(onAddFile);
                e.target.value = "";
              }}
            />
          </div>
          {isStreaming ? (
            <button
              className="send-btn"
              onClick={onStop}
              style={{
                background: "var(--bg-4)",
                border: "1px solid var(--border)",
              }}
            >
              ■
            </button>
          ) : (
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={disabled}
            >
              ↑
            </button>
          )}
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 8,
          fontSize: 11.5,
          color: "var(--text-3)",
        }}
      >
        AI can make mistakes. Verify important information.
      </div>
    </div>
  );
}
