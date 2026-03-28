import React from 'react';
import { Wine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Login() {
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
        
        <Button 
          size="lg" 
          className="w-full text-lg h-14"
          onClick={() => window.location.href = '/api/login?returnTo=/'}
        >
          System Login
        </Button>
      </div>
    </div>
  );
}
