import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { ThemeProviderWrapper } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import UploadPage from "@/pages/upload";
import DocumentsPage from "@/pages/documents";
import DocumentViewPage from "@/pages/document-view";
import Layout from "@/components/layout/layout";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null; // Or a loading spinner

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute component={AdminPage} />
      </Route>
      
      <Route path="/upload">
        <ProtectedRoute component={UploadPage} />
      </Route>

      <Route path="/documents">
        <ProtectedRoute component={DocumentsPage} />
      </Route>

      <Route path="/documents/:id">
        <ProtectedRoute component={DocumentViewPage} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProviderWrapper defaultTheme="system" storageKey="bloter-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <Router />
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProviderWrapper>
    </QueryClientProvider>
  );
}

export default App;
