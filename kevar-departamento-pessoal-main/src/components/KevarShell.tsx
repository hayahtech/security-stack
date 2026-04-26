import { useState } from "react";
import { KevarSidebar, MobileSidebar, MobileMenuButton } from "./KevarSidebar";
import { KevarHeader } from "./KevarHeader";

export function KevarShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background font-inter">
      <div className="hidden lg:block">
        <KevarSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center bg-[hsl(var(--kevar-header))] lg:hidden px-2">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
        </div>
        <KevarHeader />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
