"use client";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        <button
          className="icon-btn"
          onClick={() => setSidebarOpen(true)}
          style={{
            display: "none",
            position: "fixed",
            top: 14,
            left: 14,
            zIndex: 60,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            width: 36,
            height: 36,
          }}
        >
          ☰
        </button>
        {children}
      </main>
    </div>
  );
}
