'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { Smartphone, Lock, User, Loader2, AlertCircle } from 'lucide-react';
import { userService } from '@/services/userService';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@primetime.com');
  const [password, setPassword] = useState('vtagu@2025');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // Static Login for now
    setTimeout(() => {
      if (email === 'admin@primetime.com' && password === 'vtagu@2025') {
        setAuth({
          userId: 1,
          id: '1',
          email: 'admin@primetime.com',
          user_name: 'Super Admin',
          is_admin: true,
          status: 'active',
          mobile: '1234567890',
          createdAt: new Date().toISOString()
        }, 'static-admin-token');
        router.push('/dashboard');
      } else {
        setError('Invalid admin credentials.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-2xl relative z-10 glass-morphism">
          <div className="text-center space-y-2 mb-10">
            <div className="w-16 h-16 bg-brand-gradient rounded-2xl mx-auto flex items-center justify-center font-bold text-white text-3xl shadow-lg shadow-primary/30 mb-6">
              P
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to PrimeTime Admin Portal</p>
          </div>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Email Address</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
                  placeholder="admin@primetime.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-2xl pl-12 pr-4 py-4 text-sm outline-none focus:ring-2 ring-primary/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-gradient text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>Sign In to Dashboard</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Forgot password? Contact system administrator.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 flex justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2 text-xs">
            <Smartphone className="w-4 h-4" />
            Device Management Active
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-4 h-4" />
            End-to-End Encryption
          </div>
        </div>
      </div>
    </div>
  );
}
