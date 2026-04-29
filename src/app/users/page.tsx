'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
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
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
            {row.original.user_name?.[0] || 'U'}
          </div>
          <div>
            <div className="font-medium">{row.original.user_name}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {row.original.email}
            </div>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => (
        <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-full uppercase">
          {row.original.plan || 'Free'}
        </span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${row.original.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="capitalize">{row.original.status}</span>
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => formatDate(row.original.createdAt)
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
