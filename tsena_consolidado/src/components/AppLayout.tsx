import { ReactNode } from 'react';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import SetupModal from './SetupModal';
import { useAppMode } from '@/contexts/AppModeContext';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { isSetupComplete } = useAppMode();

  return (
    <>
      <SetupModal />
      {isSetupComplete && (
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  );
};

export default AppLayout;
