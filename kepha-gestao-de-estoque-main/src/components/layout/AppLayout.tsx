import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className={cn(
        'flex flex-col flex-1 min-w-0 transition-all duration-300',
        sidebarCollapsed ? 'ml-0' : 'ml-0'
      )}>
        <AppHeader />
        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
