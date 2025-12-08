import React, { useState, useCallback } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Drawer,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
} from '@fluentui/react-components';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { useAppStore } from '@/store/appStore';
import '../styles/layout.css';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { theme, setTheme } = useAppStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Determine the Fluent theme based on user preference
  const fluentTheme = theme === 'dark' ? webDarkTheme : webLightTheme;

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = useCallback((newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
    // Apply to document
    document.documentElement.setAttribute('data-theme', newTheme);
  }, [setTheme]);

  return (
    <FluentProvider theme={fluentTheme}>
      <div className="app-shell" data-theme={theme}>
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="sidebar-desktop">
            <SidebarNav />
          </aside>
        )}

        {/* Mobile Sidebar Drawer */}
        {isMobile && isSidebarOpen && (
          <Drawer
            position="start"
            onOpenChange={(_, { open }) => setIsSidebarOpen(open)}
            open={isSidebarOpen}
          >
            <DrawerHeader>
              <h3>FusionDesk</h3>
            </DrawerHeader>
            <DrawerBody>
              <SidebarNav onNavigate={() => setIsSidebarOpen(false)} />
            </DrawerBody>
            <DrawerFooter>
              <Button appearance="secondary" onClick={() => setIsSidebarOpen(false)}>
                Close
              </Button>
            </DrawerFooter>
          </Drawer>
        )}

        {/* Main Content Area */}
        <div className="main-wrapper">
          <TopBar
            onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onThemeToggle={handleThemeToggle}
            currentTheme={theme}
            showMenuButton={isMobile}
          />

          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    </FluentProvider>
  );
};
