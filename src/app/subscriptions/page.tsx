'use client';

import React from 'react';
import { CreditCard, Check, X, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    duration: 30,
    devices: 2,
    quality: 'HD (720p)',
    active: true,
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 14.99,
    duration: 30,
    devices: 4,
    quality: 'Full HD (1080p)',
    active: true,
    color: 'purple'
  },
  {
    id: 'ultra',
    name: 'Ultra 4K Plan',
    price: 19.99,
    duration: 30,
    devices: 6,
    quality: 'Ultra HD (4K + HDR)',
    active: true,
    color: 'gradient'
  }
];

export default function SubscriptionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground">Manage pricing, device limits, and feature sets.</p>
        </div>
        <button className="bg-muted hover:bg-muted/80 border border-border px-5 py-2.5 rounded-xl font-semibold transition-colors">
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="relative group">
            <div className={cn(
              "absolute -inset-0.5 bg-brand-gradient rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"
            )} />
            <div className="relative bg-card border border-border rounded-2xl p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className={cn(
                  "p-3 rounded-2xl",
                  plan.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                  plan.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                  "bg-brand-gradient text-white"
                )}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">
                  ACTIVE
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/ month</span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>{plan.devices} Devices Limit</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>{plan.quality} Quality</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Ad-free Experience</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-border flex gap-3">
                <button className="flex-1 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">
                  Edit Plan
                </button>
                <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors">
                  Disable
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
