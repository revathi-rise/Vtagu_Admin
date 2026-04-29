'use client';

import React, { useEffect, useState } from 'react';
import { CreditCard, Check, X, Shield, Zap, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { planService, Plan } from '@/services/planService';

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setIsLoading(true);
      const data = await planService.getAll();
      setPlans(data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div key={plan.id} className="relative group">
                <div className={cn(
                  "absolute -inset-0.5 bg-brand-gradient rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur"
                )} />
                <div className="relative bg-card border border-border rounded-2xl p-8 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-2 px-3 py-1 text-xs font-bold rounded-full",
                      plan.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                    )}>
                      {plan.status?.toUpperCase() || 'INACTIVE'}
                    </div>
                  </div>

                  <div className="space-y-2 mb-8">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/ {plan.duration_days} days</span>
                    </div>
                  </div>

                  <div className="space-y-4 flex-1">
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Standard Quality</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border flex gap-3">
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors">
                      Edit Plan
                    </button>
                    <button className="flex-1 py-2 rounded-xl text-sm font-semibold text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors">
                      {plan.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border">
              <p className="text-muted-foreground">No subscription plans found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
