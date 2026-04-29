'use client';

import React from 'react';
import { ShieldCheck, User, Mail, Calendar, Key, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-brand-gradient flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-primary/20">
              {user?.user_name?.[0] || 'A'}
            </div>
            <button className="absolute bottom-0 right-0 p-2 bg-card border border-border rounded-full hover:bg-muted transition-colors shadow-lg">
              <Camera className="w-5 h-5 text-primary" />
            </button>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold">{user?.user_name || 'Super Admin'}</h2>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mt-1">{user?.role || 'Administrator'}</p>
          </div>
          <div className="w-full h-px bg-border" />
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground italic">Admin ID</span>
              <span className="font-mono text-xs">{user?.id || 'ADM-8821'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground italic">Last Login</span>
              <span className="text-xs">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-8 space-y-8">
            <div className="flex items-center gap-2 text-primary font-bold">
              <ShieldCheck className="w-5 h-5" />
              Account Details
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    defaultValue={user?.user_name || ''}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    defaultValue={user?.email || ''}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-primary font-bold mb-6">
                <Key className="w-5 h-5" />
                Change Password
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Password</label>
                  <input 
                    type="password"
                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    placeholder="••••••••"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                    <input 
                      type="password"
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                    <input 
                      type="password"
                      className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 ring-primary/20 outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end">
              <button className="bg-brand-gradient text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Save Profile Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
