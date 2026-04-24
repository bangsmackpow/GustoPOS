import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ReceiptText,
  Wine,
  Beer,
  Coffee,
  GlassWater,
  Martini,
  Microwave,
  IceCream,
  ChefHat,
  Utensils,
  Pizza,
  PackageSearch,
  BarChart3,
  Settings,
  LogOut,
  User,
  Globe,
  Search,
  ChevronLeft,
  Calendar,
} from "lucide-react";
import { usePosStore } from "@/store";
import { getTranslation } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentAuthUser,
  useGetActiveShift,
  useGetSettings,
} from "@workspace/api-client-react";
import { PinPad } from "./PinPad";
import { QuickSearch } from "./QuickSearch";

const NAV_ITEMS = [
  { path: "/", icon: LayoutDashboard, labelEn: "Dashboard", labelEs: "Panel" },
  { path: "/tabs", icon: ReceiptText, labelEn: "Tabs", labelEs: "Cuentas" },
  { path: "/drinks", icon: Wine, labelEn: "Menu", labelEs: "Menú" },
  {
    path: "/inventory",
    icon: PackageSearch,
    labelEn: "Inventory",
    labelEs: "Inventario",
  },
  {
    path: "/reports",
    icon: BarChart3,
    labelEn: "Reports",
    labelEs: "Reportes",
  },
  {
    path: "/calendar",
    icon: Calendar,
    labelEn: "Calendar",
    labelEs: "Calendario",
  },
  {
    path: "/settings",
    icon: Settings,
    labelEn: "Settings",
    labelEs: "Ajustes",
  },
];

const ICON_MAP: Record<string, any> = {
  Wine,
  Beer,
  Coffee,
  GlassWater,
  Martini,
  Microwave,
  IceCream,
  ChefHat,
  Utensils,
  Pizza,
};

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    language,
    setLanguage,
    activeStaff,
    setActiveStaff,
    isLocked,
    setIsLocked,
  } = usePosStore();
  const [showClearTrashModal, setShowClearTrashModal] = useState(false);
  const {
    data: auth,
    isLoading,
    isFetching: _isFetching,
    isSuccess,
    isError,
  } = useGetCurrentAuthUser({
    staleTime: 0,
    refetchOnMount: "always",
    queryKey: ["/api/auth/user"],
  });
  const { data: shiftData } = useGetActiveShift();
  const { data: settings } = useGetSettings();
  const [showPin, setShowPin] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [lockScreenMode, setLockScreenMode] = useState(false);
  
  // Touchscreen mode flag - currently disabled for desktop/non-touch usage
  // Can be enabled via settings in the future
  const enableTouchscreen = settings?.enableTouchscreen === true;
  
  // If not in touchscreen mode, never show PinPad (use password login instead)
  const queryClient = useQueryClient();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (isLocked) return;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    const timeoutMin = settings?.pinLockTimeoutMin ?? 5;
    idleTimerRef.current = setTimeout(
      () => {
        setIsLocked(true);
        // Only show PinPad in touchscreen mode, otherwise redirect to login
        if (enableTouchscreen) {
          setLockScreenMode(true);
          setShowPin(true);
        } else {
          // Desktop mode: redirect to login page instead of showing PinPad
          setLocation("/login");
        }
      },
      timeoutMin * 60 * 1000,
    );
  }, [isLocked, settings?.pinLockTimeoutMin, setIsLocked]);

  useEffect(() => {
    if (location === "/login") return;
    if (!isSuccess) return;

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];
    const handler = () => resetIdleTimer();
    events.forEach((e) =>
      window.addEventListener(e, handler, { passive: true }),
    );

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      } else if (document.visibilityState === "visible" && !isLocked) {
        resetIdleTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [location, isSuccess, resetIdleTimer, isLocked]);

  const handlePinUnlock = () => {
    setIsLocked(false);
    setLockScreenMode(false);
    setShowPin(false);
    resetIdleTimer();
  };

  const handlePinClose = () => {
    if (lockScreenMode) return;
    setShowPin(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    // Phase 1: Global Admin Trash Alert
    if ((auth as any)?.role === "admin") {
      try {
        const res = await fetch("/api/inventory/trash/count");
        const data = await res.json();
        if (data.count > 0) {
          setShowClearTrashModal(true);
          return; // Wait for modal decision
        }
      } catch (err) {
        // Silently fail
      }
    }
    executeLogout();
  };

  const executeLogout = async () => {
    try {
      await fetch("/api/auth/logout", { credentials: "include" });
    } catch {
      // Silently fail
    }
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    setActiveStaff(null);
    setLocation("/login");
  };

  const handleClearTrashAndLogout = async (shouldClear: boolean) => {
    if (shouldClear) {
      try {
        await fetch("/api/inventory/trash/clear", { method: "DELETE" });
      } catch {
        // Silently fail
      }
    }
    setShowClearTrashModal(false);
    executeLogout();
  };

  // Auth guard: consolidated into single effect to prevent race conditions
  // Only redirect after we have a definitive answer from the server
  useEffect(() => {
    if (location === "/login") return;

    console.log("[Layout] Auth check:", { isError, isSuccess, isLoading, auth });

    if (isError) {
      console.log("[Layout] isError true, redirecting to login");
      setLocation("/login");
      return;
    }

    if (isSuccess && !auth?.isAuthenticated) {
      console.log("[Layout] isSuccess but not authenticated, redirecting to login");
      setLocation("/login");
    }
  }, [isError, isSuccess, auth?.isAuthenticated, location, setLocation]);

  // Sync authenticated user to activeStaff in store when auth succeeds
  // This ensures PinPad-logged-in and Login-logged-in users both populate activeStaff
  useEffect(() => {
    if (isSuccess && auth?.isAuthenticated && auth?.user) {
      // Map AuthUser to StaffUser format for the store
      const staffUser = {
        id: auth.user.id,
        email: auth.user.email ?? "",
        firstName: auth.user.firstName ?? "",
        lastName: auth.user.lastName ?? "",
        role: auth.user.role,
        language: auth.user.language,
        profileImageUrl: auth.user.profileImageUrl ?? null,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setActiveStaff(staffUser);
      // Set app language from user preference
      if (auth.user.language) {
        setLanguage(auth.user.language);
      }
    }
  }, [isSuccess, auth?.isAuthenticated, auth?.user, setLanguage]);

  // Only show loading on initial load, NOT on background refetches
  // isFetching triggers on every staleTime:0 refetch which would block UI perpetually
  if (isLoading && location !== "/login") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  // On login page, always render children
  if (location === "/login") {
    return <>{children}</>;
  }

  // If auth query failed (API unreachable), redirect to login
  if (isError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        Redirecting to login...
      </div>
    );
  }

  // Safety net: if server confirmed user is not authenticated, don't render protected content
  if (isSuccess && !auth?.isAuthenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        Redirecting...
      </div>
    );
  }

  // If we have no definitive answer yet (still loading first fetch), show loading
  if (!isSuccess && !isError) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  }

  const BarIcon = ICON_MAP[settings?.barIcon || "Wine"] || Wine;
  const activeShift = shiftData?.shift;

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside
        className={`glass flex flex-col border-r border-white/5 z-20 transition-all duration-300 ${
          sidebarCollapsed ? "w-16" : "w-24 lg:w-64"
        }`}
      >
        <div className="h-24 flex items-center justify-center border-b border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <BarIcon className="text-primary-foreground w-7 h-7" />
          </div>
          <span
            className={`ml-4 font-display font-bold text-xl tracking-tight transition-opacity duration-300 ${
              sidebarCollapsed ? "hidden" : "hidden lg:block"
            }`}
          >
            {settings?.barName || "Gusto"}
            <span className="text-primary">POS</span>
          </span>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`ml-auto p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
              sidebarCollapsed ? "hidden lg:flex" : "flex"
            }`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${
                sidebarCollapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <nav className="flex-1 px-2 py-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <Icon
                    size={20}
                    className={
                      isActive
                        ? "scale-110"
                        : "group-hover:scale-110 transition-transform"
                    }
                  />
                  <span
                    className={`ml-3 font-medium transition-opacity duration-300 ${
                      sidebarCollapsed ? "hidden" : "hidden lg:block"
                    }`}
                  >
                    {language === "en" ? item.labelEn : item.labelEs}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className={`absolute bg-white rounded-full transition-all duration-300 ${
                        sidebarCollapsed
                          ? "left-1 w-0.5 h-5"
                          : "left-0 w-1 h-6 hidden lg:block"
                      }`}
                    />
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/5 space-y-1">
          <button
            onClick={() => setLanguage(language === "en" ? "es" : "en")}
            className="w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <Globe size={20} />
            <span
              className={`ml-3 font-medium uppercase transition-opacity duration-300 ${
                sidebarCollapsed ? "hidden" : "hidden lg:block"
              }`}
            >
              {language}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut size={20} />
            <span
              className={`ml-3 font-medium transition-opacity duration-300 ${
                sidebarCollapsed ? "hidden" : "hidden lg:block"
              }`}
            >
              {getTranslation("logout", language)}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col relative overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "ml-0" : ""
        }`}
      >
        {/* Header */}
        <header className="h-24 glass border-b border-white/5 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                {activeShift
                  ? getTranslation("active_shift", language)
                  : getTranslation("no_active_shift", language)}
              </h2>
              <p className="text-lg font-display font-bold">
                {activeShift ? activeShift.name : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {location !== "/" && (
              <button
                onClick={() => setShowSearch(true)}
                className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all border border-white/5 group"
                title="Search (⌘K)"
              >
                <Search
                  size={20}
                  className="group-hover:scale-110 transition-transform"
                />
              </button>
            )}

            <button
              onClick={() => (window.location.href = "/login")}
              className="flex items-center gap-3 glass px-4 py-2 rounded-2xl hover:bg-white/10 transition-all border border-white/5 active:scale-95"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold leading-none">
                  {activeStaff
                    ? `${activeStaff.firstName} ${activeStaff.lastName}`
                    : "Switch Staff"}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-tighter">
                  {activeStaff
                    ? getTranslation(activeStaff.role as any, language)
                    : "Tap to Login"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <User size={20} />
              </div>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar bg-[url('/images/pattern.png')] bg-repeat bg-[length:100px_100px] bg-fixed">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {showPin && enableTouchscreen && (
        <PinPad
          onClose={handlePinClose}
          onLogin={lockScreenMode ? handlePinUnlock : undefined}
          lockScreen={lockScreenMode}
        />
      )}
      <QuickSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />

      {/* Clear Trash Global Modal */}
      {showClearTrashModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-xl">
          <div className="glass p-8 rounded-[2.5rem] w-full max-w-md border border-white/10 shadow-2xl">
            <h2 className="text-3xl font-display font-bold mb-4 flex items-center gap-3">
              <LogOut className="text-primary" />
              {getTranslation("logout", language)}
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              There are deleted items in the inventory trash. Would you like to
              **clear the trash** before logging out?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleClearTrashAndLogout(true)}
                className="w-full h-14 bg-destructive text-destructive-foreground rounded-2xl font-bold text-lg hover:brightness-110 transition-all active:scale-95"
              >
                Clear Trash & Logout
              </button>
              <button
                onClick={() => handleClearTrashAndLogout(false)}
                className="w-full h-14 bg-white/5 text-foreground rounded-2xl font-bold text-lg hover:bg-white/10 transition-all active:scale-95 border border-white/10"
              >
                Just Logout
              </button>
              <button
                onClick={() => setShowClearTrashModal(false)}
                className="w-full h-14 bg-transparent text-muted-foreground rounded-2xl font-medium text-lg hover:text-foreground transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
