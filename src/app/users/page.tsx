'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate, cn } from '@/lib/utils';
import { Mail, Shield, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { userService, User } from '@/services/userService';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError('Could not load users. Please check your connection.');
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user_name',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shadow-sm">
            {row.original.profile_picture && row.original.profile_picture !== '0' && row.original.profile_picture !== '' ? (
              <img 
                src={row.original.profile_picture} 
                alt={row.original.user_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).onerror = null;
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.original.user_name || 'U')}&background=random&color=fff`;
                }}
              />
            ) : (
              row.original.user_name?.[0]?.toUpperCase() || 'U'
            )}
          </div>
          <div>
            <div className="font-semibold">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'info',
      header: 'Info',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground space-y-1">
          {row.original.mobile ? <div className="font-medium text-foreground">{row.original.mobile}</div> : null}
          <div>{row.original.age ? `${row.original.age} yrs` : 'Age N/A'} • {row.original.gender ? <span className="capitalize">{row.original.gender}</span> : 'Gender N/A'}</div>
        </div>
      )
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => {
        const planStr = row.original.plan;
        const isFree = !planStr || planStr === '0';
        
        let planLabel = 'Free';
        if (!isFree) {
          planLabel = planStr === '1' ? 'Premium' : `Plan ${planStr}`;
        }

        return (
          <div className="flex flex-col items-start gap-1">
            <span className={cn(
              "text-xs font-bold px-2 py-0.5 shadow-sm rounded-full uppercase",
              isFree ? "bg-muted text-muted-foreground" : "bg-brand-gradient text-white"
            )}>
              {planLabel}
            </span>
            {row.original.plan_price !== undefined && row.original.plan_price !== null && (
              <span className="text-xs font-medium text-muted-foreground">${row.original.plan_price}</span>
            )}
          </div>
        );
      }
    },
    {
      id: 'access',
      header: 'Access',
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">{row.original.type === '1' ? 'Admin' : 'User'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <div className={`w-1.5 h-1.5 rounded-full ${row.original.logged_in ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-muted-foreground/50'}`} />
            {row.original.logged_in ? 'Online' : 'Offline'}
          </div>
          {row.original.last_login_ip_address && (
            <div className="text-[10px] text-muted-foreground/70 font-mono tracking-tighter">IP: {row.original.last_login_ip_address}</div>
          )}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.original.status === '1' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="capitalize text-sm font-medium">{row.original.status === '1' ? 'Active' : 'Inactive'}</span>
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage your platform subscribers and devices.</p>
        </div>
        <button 
          onClick={fetchUsers}
          className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
        >
          Refresh Data
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
          <p className="text-muted-foreground">Fetching subscribers...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={users} searchPlaceholder="Search users by name or email..." />
      )}
    </div>
  );
}
