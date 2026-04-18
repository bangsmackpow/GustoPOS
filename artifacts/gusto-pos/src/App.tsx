import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Tabs from "@/pages/Tabs";
import TabDetail from "@/pages/TabDetail";
import Drinks from "@/pages/Drinks";
import Inventory from "@/pages/Inventory";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import InventoryAudit from "@/pages/InventoryAudit";
import InventoryVariance from "@/pages/InventoryVariance";
import BatchAudit from "@/pages/BatchAudit";
import AuditReport from "@/pages/AuditReport";
import Calendar from "@/pages/Calendar";
import { usePosStore } from "@/store";

// Clear stale persisted cache and force fresh data on app start
// This ensures compatibility with updated API schemas and prevents stale data issues
try {
  const cacheVersion = localStorage.getItem("gustopos-cache-version");
  // Increment cache version to force clear all persisted queries
  const newCacheVersion = "3";
  if (cacheVersion !== newCacheVersion) {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith("REACT_QUERY_OFFLINE_CACHE") ||
          key === "gustopos-cache-version")
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem("gustopos-cache-version", newCacheVersion);
  }
} catch {
  // localStorage may be unavailable
}

// Initialize Query Client with aggressive stale times for offline resilience
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
      staleTime: 1000 * 60 * 5,
      retry: 3,
    },
  },
});

// Auth queries should never use stale data — always refetch to get current session state
queryClient.setQueryDefaults(["/api/auth/user"], {
  staleTime: 0,
  gcTime: 0,
  retry: false,
});

// Configure Persister to save state to localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/login" component={Login} />
        <Route path="/tabs" component={Tabs} />
        <Route path="/tabs/:id" component={TabDetail} />
        <Route path="/drinks" component={Drinks} />
        <Route path="/inventory" component={Inventory} />
        <Route path="/inventory/:id/audit" component={InventoryAudit} />
        <Route path="/inventory/variance" component={InventoryVariance} />
        <Route path="/reports" component={Reports} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/batch-audit/:id" component={BatchAudit} />
        <Route
          path="/settings/batch-audit/:id/report"
          component={AuditReport}
        />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function AppContent({ ready }: { ready: boolean }) {
  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        Loading GustoPOS...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          shouldDehydrateQuery: (query: any) => {
            if (query.queryKey.includes("/api/auth/user")) return false;
            return true;
          },
        },
      }}
      onSuccess={() => {
        queryClient.invalidateQueries();
      }}
      onError={() => {
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("REACT_QUERY_OFFLINE_CACHE")) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // ignore
        }
      }}
    >
      <AppContent ready />
    </PersistQueryClientProvider>
  );
}

export default App;
