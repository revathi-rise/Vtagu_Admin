'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate, cn } from '@/lib/utils';
import { Mail, Shield, User as UserIcon, Loader2, AlertCircle, Settings2, Lock, Unlock, Check, X, ArrowUpDown, Trash2 } from 'lucide-react';
import { userService, User } from '@/services/userService';
import { useAuthStore } from '@/store/use-auth-store';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuthStore();
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ user_name: '', email: '', password: '', type: '0' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        await userService.delete(userId);
        fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'user_name',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          User
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
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
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Plan
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
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
      accessorKey: 'type',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Role
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="capitalize">{String(row.original.type) === '1' ? 'Super Master' : String(row.original.type) === '2' ? 'Admin' : 'User'}</span>
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
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Status
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {row.original.is_locked ? (
              <span className="text-destructive flex items-center gap-1"><Lock className="w-3 h-3"/> Locked</span>
            ) : (
              row.original.status === '1' || row.original.status === 'active' ? <span className="text-green-500">Active</span> : <span className="text-muted-foreground">Inactive</span>
            )}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          Joined
          <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
    }
  ];

  if (String(currentUser?.type) === '1') {
    columns.push({
      id: 'actions',
      header: 'Manage',
      cell: ({ row }) => {
        const isSuperMaster = String(row.original.type) === '1';
        return (
          <div className="flex items-center gap-1.5">
            <Link
              href={isSuperMaster ? '#' : `/users/${row.original.userId}`}
              className={cn(
                "p-2 rounded-lg transition-colors flex items-center justify-center border",
                isSuperMaster ? "border-transparent opacity-30 cursor-not-allowed pointer-events-none" : "hover:bg-muted border-border text-primary"
              )}
              title={isSuperMaster ? "Cannot modify Super Master account" : "Manage Access"}
            >
              <Settings2 className="w-4 h-4" />
            </Link>
            {!isSuperMaster && (
              <button
                onClick={() => handleDeleteUser(row.original.userId, row.original.user_name || row.original.email)}
                className="p-2 rounded-lg transition-colors flex items-center justify-center border border-border text-destructive hover:bg-destructive/10"
                title="Delete User"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    });
  }


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await userService.create(newUser);
      setIsAddingUser(false);
      setNewUser({ user_name: '', email: '', password: '', type: '0' });
      fetchUsers();
    } catch (err: any) {
      if (!err.response) {
        alert('Network Error: Could not connect to the backend server. Please ensure the server is running.');
      } else {
        const errMsg = err.response?.data?.message;
        alert(Array.isArray(errMsg) ? errMsg.join(', ') : (errMsg || 'Failed to create user'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage your platform subscribers and devices.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsAddingUser(true)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" /> Add User
          </button>
          <button 
            onClick={fetchUsers}
            className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
          >
            Refresh Data
          </button>
        </div>
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


      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg">Add New User</h2>
                <p className="text-xs text-muted-foreground">Create a new account manually.</p>
              </div>
              <button onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-4 space-y-4" autoComplete="off">
              {/* Hidden inputs to prevent aggressive browser autofill */}
              <input type="email" name="fake_email_autofill" id="fake_email_autofill" style={{ display: 'none' }} aria-hidden="true" />
              <input type="password" name="fake_password_autofill" id="fake_password_autofill" style={{ display: 'none' }} aria-hidden="true" />
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <input 
                  type="text" 
                  required
                  autoComplete="nope"
                  name="new_user_name"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={newUser.user_name}
                  onChange={e => setNewUser({...newUser, user_name: e.target.value})}
                  placeholder="Enter user name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input 
                  type="email" 
                  required
                  autoComplete="new-user-email"
                  name="new_user_email"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="password" 
                  required
                  minLength={8}
                  autoComplete="new-password"
                  name="new_user_password"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter password (min 8 chars)"
                />
              </div>
              
              {String(currentUser?.type) === '1' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <select 
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                    value={newUser.type}
                    onChange={e => setNewUser({...newUser, type: e.target.value})}
                  >
                    <option value="0">User</option>
                    <option value="2">Admin</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
