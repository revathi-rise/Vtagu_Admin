'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate, formatCurrency } from '@/lib/utils';
import { subscriptionService, Subscription } from '@/services/subscriptionService';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

export default function TransactionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await subscriptionService.getAll();
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
      setError('Failed to load transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Subscription>[] = [
    { 
      accessorKey: 'subscriptionId', 
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">SUB-{row.original.subscriptionId}</span>
    },
    { 
      accessorKey: 'userId', 
      header: 'User ID',
      cell: ({ row }) => <span className="text-muted-foreground">User #{row.original.userId}</span>
    },
    { 
      accessorKey: 'price_amount', 
      header: 'Amount', 
      cell: ({ row }) => formatCurrency(row.original.paid_amount || row.original.price_amount || 0) 
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
          row.original.status === 'active' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
          {row.original.status}
        </span>
      )
    },
    { 
      accessorKey: 'payment_method', 
      header: 'Method',
      cell: ({ row }) => <span className="capitalize">{row.original.payment_method || 'N/A'}</span>
    },
    { 
      accessorKey: 'timestamp_from', 
      header: 'Date', 
      cell: ({ row }) => formatDate(row.original.timestamp_from) 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">View and manage all user subscription payments.</p>
        </div>
        <button 
          onClick={fetchSubscriptions}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading transaction history...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={subscriptions} searchPlaceholder="Search by ID or User..." />
      )}
    </div>
  );
}

// Helper component/function to avoid import issues if cn is missing in some files but used in my replacement
import { cn } from '@/lib/utils';
