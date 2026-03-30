"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { login, logout, register, getMe } from "@/lib/api";

export function useAuth() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      qc.setQueryData(["me"], { user: null });
      qc.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    loginPending: loginMutation.isPending,
    registerPending: registerMutation.isPending,
  };
}
