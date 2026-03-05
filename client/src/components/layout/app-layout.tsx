import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, LogOut, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-col hidden md:flex border-r border-border bg-card">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <MessageSquareText className="w-6 h-6 text-primary mr-2" />
          <span className="text-xl font-bold font-display text-gradient">ParlayPost</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            href="/" 
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
              location === "/" 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover-elevate active-elevate-2"
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link 
            href="/groups" 
            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
              location.startsWith("/groups") 
                ? "bg-primary/10 text-primary font-semibold" 
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover-elevate active-elevate-2"
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            Groups
          </Link>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-border bg-card md:hidden">
          <div className="flex items-center">
            <MessageSquareText className="w-6 h-6 text-primary mr-2" />
            <span className="text-lg font-bold font-display text-gradient">ParlayPost</span>
          </div>
          <div className="flex space-x-2">
            <Link href="/" className="p-2 text-muted-foreground hover:text-foreground"><LayoutDashboard className="w-5 h-5" /></Link>
            <Link href="/groups" className="p-2 text-muted-foreground hover:text-foreground"><Users className="w-5 h-5" /></Link>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
