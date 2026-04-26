import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { GlobalSearch } from "@/components/GlobalSearch";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) {
      window.location.href = "/auth";
    }
  }, [loading, session]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (loading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {children}
      </main>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
