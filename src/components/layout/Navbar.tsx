'use client';

import React from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 bg-muted px-3 py-1.5 rounded-full w-96 max-w-full">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search movies, users, or transactions..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded-full">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-card" />
        </button>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3 pl-2">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold">{user?.user_name || 'Admin User'}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role || 'Super Admin'}</span>
          </div>
          
          <div className="relative group">
            <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center font-bold text-white text-sm">
                {user?.user_name?.[0] || 'A'}
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
            
            <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="p-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
                  <User size={16} />
                  Profile
                </button>
                <div className="h-px bg-border my-1" />
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

import { User } from 'lucide-react';
