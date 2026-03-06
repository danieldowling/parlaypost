import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Components
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import Groups from "@/pages/groups";
import GroupDetail from "@/pages/group-detail";
import LiveOdds from "@/pages/live-odds";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // We defer the location change to avoid React warnings during render
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute component={() => (
          <AppLayout>
            <Dashboard />
          </AppLayout>
        )} />
      </Route>
      <Route path="/groups">
        <ProtectedRoute component={() => (
          <AppLayout>
            <Groups />
          </AppLayout>
        )} />
      </Route>
      <Route path="/groups/:id">
        <ProtectedRoute component={() => (
          <AppLayout>
            <GroupDetail />
          </AppLayout>
        )} />
      </Route>
      <Route path="/odds">
        <ProtectedRoute component={() => (
          <AppLayout>
            <LiveOdds />
          </AppLayout>
        )} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
