"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchChats, createChat, renameChat, deleteChat } from "@/lib/api";
import { supabaseRealtime } from "@/lib/supabase/realtime";
import type { Chat } from "@/types";

export function useChats() {
  const qc = useQueryClient();

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
  });

  useEffect(() => {
    const channel = supabaseRealtime
      .channel("chats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        () => {
          qc.invalidateQueries({ queryKey: ["chats"] });
        },
      )
      .subscribe();
    return () => {
      supabaseRealtime.removeChannel(channel);
    };
  }, [qc]);

  const createMutation = useMutation({
    mutationFn: (title?: string) => createChat(title),
    onSuccess: (chat) => {
      qc.setQueryData<Chat[]>(["chats"], (old = []) => [chat, ...old]);
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      renameChat(id, title),
    onSuccess: (updated) => {
      qc.setQueryData<Chat[]>(["chats"], (old = []) =>
        old.map((c) => (c.id === updated.id ? updated : c)),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChat(id),
    onMutate: (id) => {
      qc.setQueryData<Chat[]>(["chats"], (old = []) =>
        old.filter((c) => c.id !== id),
      );
    },
    onError: () => qc.invalidateQueries({ queryKey: ["chats"] }),
  });

  return {
    chats,
    isLoading,
    createChat: createMutation.mutateAsync,
    renameChat: renameMutation.mutateAsync,
    deleteChat: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}
