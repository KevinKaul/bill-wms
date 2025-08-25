"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";

interface DashboardProviderProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function DashboardProvider({
  children,
  defaultOpen = true,
}: DashboardProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(defaultOpen);

  useEffect(() => {
    setMounted(true);
    // 在客户端读取localStorage而不是服务器端的cookies
    const savedState = localStorage.getItem("sidebar_state");
    if (savedState !== null) {
      setSidebarOpen(savedState === "true");
    }
  }, []);

  // 防止hydration mismatch
  if (!mounted) {
    return (
      <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      defaultOpen={sidebarOpen}
      onOpenChange={(open) => {
        setSidebarOpen(open);
        localStorage.setItem("sidebar_state", String(open));
      }}
    >
      {children}
    </SidebarProvider>
  );
}
