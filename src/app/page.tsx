"use client";

import { useChats } from "@/hooks/useChats";

export default function Home() {
  const { chats, createChat } = useChats();

  return (
    <div>
      <button onClick={() => createChat(undefined)}>New chat</button>

      {chats.map((c) => (
        <div key={c.id}>{c.title}</div>
      ))}
    </div>
  );
}
