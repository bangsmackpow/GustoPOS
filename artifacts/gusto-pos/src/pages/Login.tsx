import React, { useState } from 'react';
import { Wine, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        // Success! Force a full page reload to clear all caches and start fresh
        window.location.href = '/';
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: data.error || "Invalid credentials"
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not connect to server"
      });
    } finally {
      setIsLoading(false);
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
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="z-10 w-full max-w-md p-8 glass rounded-3xl text-center relative border-t border-white/10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] border-2 border-background">
          <Wine className="text-primary-foreground w-12 h-12" />
        </div>
        
        <h1 className="mt-12 text-4xl font-display font-bold text-foreground mb-2">Gusto<span className="text-primary">POS</span></h1>
        <p className="text-muted-foreground mb-8 text-lg">Management & POS System</p>
        
        <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Mail size={14} /> Email
            </label>
            <input 
              type="email" 
              required
              className="w-full bg-secondary/50 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <Button 
            type="submit"
            size="lg" 
            className="w-full text-lg h-14"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
