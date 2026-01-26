import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-dvh flex-1 flex-col">
          <Topbar />
          <main className="flex-1 bg-gray-50/50">{children}</main>
        </div>
      </div>
    </div>
  );
}
