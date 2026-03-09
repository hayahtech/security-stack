import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

interface MainLayoutProps {
  children: React.ReactNode;
}

function LayoutInner({ children }: MainLayoutProps) {
  const { ShortcutsDialog } = useKeyboardShortcuts();

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
      <OnboardingChecklist />
      <ShortcutsDialog />
    </div>
  );
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}
