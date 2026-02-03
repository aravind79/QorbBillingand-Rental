import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";

export interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showSidebar?: boolean;
}

export function AppLayout({ children, title, subtitle, actions, showSidebar = true }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {showSidebar && <Sidebar />}

      {/* Mobile Header */}
      <MobileHeader title={title} />

      {/* Main Content */}
      <div className={`${showSidebar ? 'lg:pl-64' : ''} transition-all duration-300`}>
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header title={title} subtitle={subtitle} actions={actions} />
        </div>

        {/* Page Content with bottom padding for mobile nav */}
        <main className="p-4 lg:p-6 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      {showSidebar && <MobileNav />}
    </div>
  );
}
