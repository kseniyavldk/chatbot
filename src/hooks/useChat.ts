"use client";
import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMessages, streamMessage, uploadFile } from "@/lib/api";
import type { Message, Attachment } from "@/types";

export function useChat(chatId: string | null) {
  const qc = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
    staleTime: Infinity,
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>(
    [],
  );
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const addAttachment = useCallback(async (file: File) => {
    setUploadingFiles(true);
    try {
      const att = await uploadFile(file);
      setPendingAttachments((prev) => [...prev, att]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploadingFiles(false);
    }
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!chatId || !content.trim() || isStreaming) return;
      setError(null);

      const attachmentIds = pendingAttachments.map((a) => a.id);
      setPendingAttachments([]);

      const tmpUser: Message = {
        id: `tmp-user-${Date.now()}`,
        chat_id: chatId,
        role: "user",
        content,
        created_at: new Date().toISOString(),
        attachments: pendingAttachments,
      };
      const tmpAssistant: Message = {
        id: `tmp-assistant-${Date.now()}`,
        chat_id: chatId,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      qc.setQueryData<Message[]>(["messages", chatId], (old = []) => [
        ...old,
        tmpUser,
        tmpAssistant,
      ]);
      setIsStreaming(true);

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        await streamMessage(
          chatId,
          content,
          attachmentIds,
          (chunk) => {
            qc.setQueryData<Message[]>(["messages", chatId], (old = []) =>
              old.map((m) =>
                m.id === tmpAssistant.id
                  ? { ...m, content: m.content + chunk }
                  : m,
              ),
            );
          },
          abort.signal,
        );

        qc.invalidateQueries({ queryKey: ["messages", chatId] });
        qc.invalidateQueries({ queryKey: ["chats"] });
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(
          e?.status === 429
            ? "Free message limit reached. Sign up to continue."
            : (e?.message ?? "Something went wrong"),
        );
        qc.setQueryData<Message[]>(["messages", chatId], (old = []) =>
          old.filter((m) => m.id !== tmpUser.id && m.id !== tmpAssistant.id),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [chatId, isStreaming, pendingAttachments, qc],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
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
  };
}
