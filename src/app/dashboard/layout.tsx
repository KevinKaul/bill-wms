import KBar from "@/components/kbar";
import AppSidebar from "@/components/layout/app-sidebar";
import Header from "@/components/layout/header";
import { DashboardProvider } from "@/components/layout/dashboard-provider";
import { SidebarInset } from "@/components/ui/sidebar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WMS Dashboard",
  description: "仓库管理系统",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KBar>
      <DashboardProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <Header />
          {/* page main content */}
          {children}
          {/* page main content ends */}
        </SidebarInset>
      </DashboardProvider>
    </KBar>
  );
}
