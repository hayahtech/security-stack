import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useRouteGuard } from '@/hooks/useRouteGuard';

function RouteGuardWrapper({ children }: { children: ReactNode }) {
  useRouteGuard();
  return <>{children}</>;
}

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <RouteGuardWrapper>
              {children}
            </RouteGuardWrapper>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
