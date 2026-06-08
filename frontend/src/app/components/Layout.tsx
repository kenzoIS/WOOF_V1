import { type ReactNode, useEffect, useState, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { WOOFChatbot } from "./WOOFChatbot";
import { NotificationCenter } from "./NotificationCenter";
import { ConnectionBanner } from "./ConnectionBanner";
import { Toaster } from "./ui/sonner";
import { ErrorModal } from "./ErrorModal";

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [showSessionExpired, setShowSessionExpired] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShowSessionExpired(true);
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Activity events to track
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Start the timer initially
    resetInactivityTimer();

    // Add event listeners for user activity
    events.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, true);
    });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer, true);
      });
    };
  }, []);

  const handleSessionExpiredAction = () => {
    // Simulate login redirect
    setShowSessionExpired(false);
    window.location.reload();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Connection Status Banner */}
      <ConnectionBanner />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar - Fixed 240px on desktop, overlay on mobile */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar - Fixed 64px */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto bg-[#FFF2FA]">
          <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Global Components */}
      <WOOFChatbot />
      <NotificationCenter />
      <Toaster />

      {/* Session Expired Modal */}
      <ErrorModal
        isOpen={showSessionExpired}
        onClose={() => {}}
        errorType="session_expired"
        onRetry={handleSessionExpiredAction}
      />
    </div>
  );
}
