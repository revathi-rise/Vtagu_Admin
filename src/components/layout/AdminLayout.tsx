'use client';

import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuthStore } from '@/store/use-auth-store';
import { useRouter, usePathname } from 'next/navigation';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, hasPermission, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  // Mapping paths to module labels from Sidebar
  const routeModuleMap: Record<string, string> = {
    '/users': 'Users',
    '/movies': 'Movies',
    '/series': 'Web Series',
    '/posters': 'Banners',
    '/actors': 'Actors',
    '/genres': 'Genres',
    '/languages': 'Languages',
    '/currencies': 'Currencies',
    '/interactive': 'Interactive',
    '/subscriptions': 'Subscriptions',
    '/transactions': 'Transactions',
    '/devices': 'Devices',
    '/news': 'News Popup',
  };

  useEffect(() => {
    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }

    if (user && user.is_locked) {
      logout();
      router.push('/login?error=account_locked');
      return;
    }

    if (user && pathname !== '/login' && pathname !== '/dashboard' && pathname !== '/profile' && pathname !== '/faq') {
      // Find matching base path (e.g. /users from /users/edit/1)
      const basePath = Object.keys(routeModuleMap).find(p => pathname.startsWith(p));
      if (basePath) {
        const requiredPermission = routeModuleMap[basePath];
        if (!hasPermission(requiredPermission)) {
          router.push('/dashboard');
        }
      }
    }
  }, [user, pathname, router, hasPermission, logout]);

  const isPendingVerification = user && String(user.type) === '2' && (!user.permissions || user.permissions.length === 0);

  if (!user && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (isPendingVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-yellow-500">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
              <line x1="12" x2="12" y1="8" y2="12"/>
              <line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Verification Pending</h2>
            <p className="text-muted-foreground text-sm">
              Your administrator account has been created, but no module access has been assigned to it yet.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border border-border/50">
            Please contact your client administrator or Super Master to verify your account and configure your dashboard access.
          </div>
          <button 
            onClick={() => {
              logout();
              router.push('/login');
            }} 
            className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-700">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
