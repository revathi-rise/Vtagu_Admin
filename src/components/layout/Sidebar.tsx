'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Film, 
  Tv, 
  PlayCircle, 
  Users2, 
  Tag, 
  GitBranch, 
  CreditCard, 
  Receipt, 
  Smartphone, 
  Bell, 
  HelpCircle, 
  Settings,
  User
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Film, label: 'Movies', href: '/movies' },
  { icon: Tv, label: 'Series', href: '/series' },
  { icon: PlayCircle, label: 'Episodes', href: '/episodes' },
  { icon: Users2, label: 'Actors', href: '/actors' },
  { icon: Tag, label: 'Genres', href: '/genres' },
  { icon: GitBranch, label: 'Interactive', href: '/interactive' },
  { icon: CreditCard, label: 'Subscriptions', href: '/subscriptions' },
  { icon: Receipt, label: 'Transactions', href: '/transactions' },
  { icon: Smartphone, label: 'Devices', href: '/devices' },
  { icon: Bell, label: 'News Popup', href: '/news' },
  { icon: HelpCircle, label: 'FAQ', href: '/faq' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-card border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center font-bold text-white">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient">
            PrimeTime Admin
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                active 
                  ? "bg-brand-gradient text-white shadow-lg shadow-primary/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("w-5 h-5", active ? "text-white" : "group-hover:text-primary transition-colors")} />
              <span className="text-sm font-medium">{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <Link 
          href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
            pathname === '/profile' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">Admin Profile</span>
        </Link>
      </div>
    </div>
  );
}
