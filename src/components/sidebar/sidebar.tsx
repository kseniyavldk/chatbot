"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useChats } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth-modal";
import { ANON_MESSAGE_LIMIT } from "@/types";

interface Props {
  isOpen?: boolean;
  onClose?: () => void;
  anonMessageCount?: number;
}

export function Sidebar({ isOpen, onClose, anonMessageCount = 0 }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { chats, isLoading, createChat, renameChat, deleteChat, isCreating } =
    useChats();
  const { user, logout } = useAuth();
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const activeChatId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;

  async function handleNewChat() {
    const chat = await createChat("New chat");
    router.push(`/chat/${chat.id}`);
    onClose?.();
  }

  async function commitRename(id: string) {
    if (editTitle.trim()) await renameChat({ id, title: editTitle.trim() });
    setEditingId(null);
  }

  const now = Date.now();
  const grouped = chats.reduce<{
    today: typeof chats;
    yesterday: typeof chats;
    earlier: typeof chats;
  }>(
    (acc, chat) => {
      const age = now - new Date(chat.updated_at).getTime();
      if (age < 86_400_000) acc.today.push(chat);
      else if (age < 172_800_000) acc.yesterday.push(chat);
      else acc.earlier.push(chat);
      return acc;
    },
    { today: [], yesterday: [], earlier: [] },
  );

  const sections = [
    { label: "Today", items: grouped.today },
    { label: "Yesterday", items: grouped.yesterday },
    { label: "Earlier", items: grouped.earlier },
  ].filter((s) => s.items.length > 0);

  return (
    <>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="sidebar-logo-dot" />
            Chat
          </div>
          <button
            className="new-chat-btn"
            onClick={handleNewChat}
            disabled={isCreating}
          >
            + New chat
          </button>
        </div>

        <div className="chat-list">
          {isLoading ? (
            <div
              style={{ padding: "16px", color: "var(--text-3)", fontSize: 13 }}
            >
              Loading…
            </div>
          ) : chats.length === 0 ? (
            <div
              style={{
                padding: "24px 12px",
                textAlign: "center",
                color: "var(--text-3)",
                fontSize: 13,
              }}
            >
              No chats yet
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.label} className="chat-list-section">
                <div className="chat-list-label">{section.label}</div>
                {section.items.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-item ${activeChatId === chat.id ? "active" : ""}`}
                    onClick={() => {
                      if (editingId !== chat.id) {
                        router.push(`/chat/${chat.id}`);
                        onClose?.();
                      }
                    }}
                  >
                    {editingId === chat.id ? (
                      <input
                        ref={editRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => commitRename(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(chat.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          background: "var(--bg-4)",
                          border: "1px solid var(--accent)",
                          borderRadius: 6,
                          padding: "2px 6px",
                          fontSize: 13,
                          color: "var(--text-1)",
                          fontFamily: "var(--font-sans)",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span className="chat-item-title">{chat.title}</span>
                    )}
                    <div
                      className="chat-item-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="icon-btn"
                        onClick={() => {
                          setEditingId(chat.id);
                          setEditTitle(chat.title);
                          setTimeout(() => editRef.current?.select(), 50);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="icon-btn danger"
                        onClick={() => {
                          deleteChat(chat.id);
                          if (activeChatId === chat.id) router.push("/");
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {!user && (
          <div className="anon-bar">
            <div className="anon-bar-label">
              <span>Free messages</span>
              <span>
                {anonMessageCount} / {ANON_MESSAGE_LIMIT}
              </span>
            </div>
            <div className="anon-bar-track">
              <div
                className="anon-bar-fill"
                style={{
                  width: `${(anonMessageCount / ANON_MESSAGE_LIMIT) * 100}%`,
                }}
              />
            </div>
            <a
              className="anon-bar-cta"
              onClick={() => setAuthModal("register")}
            >
              Sign up for unlimited →
            </a>
          </div>
        )}

        <div className="sidebar-footer">
          {user ? (
            <div className="user-row">
              <div className="user-avatar">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-email">{user.email}</div>
              </div>
              <button
                className="icon-btn"
                onClick={() => logout()}
                title="Log out"
              >
                →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "var(--radius)",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
                onClick={() => setAuthModal("login")}
              >
                Log in
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "var(--radius)",
                  background: "var(--accent)",
                  border: "none",
                  color: "#fff",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
                onClick={() => setAuthModal("register")}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </aside>

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onSwitch={setAuthModal}
        />
      )}
    </>
  );
}
