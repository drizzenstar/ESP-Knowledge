import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Articles from "@/pages/articles";
import ArticleEditor from "@/pages/article-editor";
import Categories from "@/pages/categories";
import FileLibrary from "@/pages/file-library";
import UserManagement from "@/pages/user-management";
import Profile from "@/pages/profile";
import AuthPage from "@/pages/auth-page";
import Permissions from "@/pages/permissions";
import SystemSettings from "@/pages/system-settings";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/articles" component={Articles} />
          <Route path="/articles/new" component={ArticleEditor} />
          <Route path="/articles/:id/edit" component={ArticleEditor} />
          <Route path="/categories" component={Categories} />
          <Route path="/files" component={FileLibrary} />
          <Route path="/users" component={UserManagement} />
          <Route path="/profile" component={Profile} />
          <Route path="/permissions" component={Permissions} />
          <Route path="/system-settings" component={SystemSettings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
