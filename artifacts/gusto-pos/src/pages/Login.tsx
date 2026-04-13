import React, { useState } from "react";
import { Wine, Lock, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { usePosStore } from "@/store";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { language, setLanguage } = usePosStore();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.status === 429) {
        toast({
          variant: "destructive",
          title: "Too Many Attempts",
          description:
            "Too many login attempts. Please try again in 15 minutes.",
        });
      } else if (data.ok) {
        queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
        setLocation("/");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.error || "Invalid credentials",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to server",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password handler
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          pin: resetPin,
          newPassword: resetNewPassword,
        }),
      });
      const data = await response.json();
      if (response.status === 429) {
        toast({
          variant: "destructive",
          title: "Too Many Attempts",
          description:
            "Too many reset attempts. Please try again in 15 minutes.",
        });
      } else if (data.success) {
        toast({
          title: "Password Reset",
          description: "Your password has been reset. You can now log in.",
        });
        setShowForgot(false);
        setResetEmail("");
        setResetPin("");
        setResetNewPassword("");
      } else {
        toast({
          variant: "destructive",
          title: "Reset Failed",
          description: data.error || "Could not reset password.",
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to server",
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Bar background"
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="z-10 w-full max-w-md p-8 glass rounded-3xl text-center relative border-t border-white/10">
        {/* Language Toggle */}
        <button
          type="button"
          onClick={() => setLanguage(language === "en" ? "es" : "en")}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title={language === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
        >
          <Globe size={20} className="text-muted-foreground" />
        </button>

        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl bg-linear-to-br from-primary to-amber-300 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] border-2 border-background">
          <Wine className="text-primary-foreground w-12 h-12" />
        </div>

        <h1 className="mt-12 text-4xl font-display font-bold text-foreground mb-2">
          Gusto<span className="text-primary">POS</span>
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Management & POS System
        </p>

        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail size={14} /> Username
            </label>
            <input
              type="text"
              required
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="GUSTO"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Lock size={14} /> Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center">
            <Button
              type="submit"
              size="lg"
              className="w-2/3 text-lg h-14"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <button
              type="button"
              className="text-xs text-primary underline ml-2"
              onClick={() => setShowForgot(true)}
            >
              Forgot Password?
            </button>
          </div>
        </form>

        {/* Forgot Password Modal */}
        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-background p-8 rounded-2xl shadow-xl w-full max-w-sm relative">
              <button
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
                onClick={() => setShowForgot(false)}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Reset Password</h2>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-3 py-2"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">PIN</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-3 py-2"
                    value={resetPin}
                    onChange={(e) => setResetPin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full bg-secondary/50 border border-white/10 rounded-xl px-3 py-2"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 mt-2"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-4">
                Enter your email, PIN, and new password. Contact your admin if
                you do not know your PIN.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
