'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userService, User } from '@/services/userService';
import { ArrowLeft, Save, Shield, Lock, ShieldCheck, Check, Trash2 } from 'lucide-react';

import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';

export default function ManageUserPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const userId = Number(id);
  const { user: currentUser } = useAuthStore();
  
  const [user, setUser] = useState<User | null>(null);
  const [allPermissions, setAllPermissions] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for edits
  const [type, setType] = useState<string>('0');
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete account "${user?.user_name || user?.email}"? This action cannot be undone.`)) {
      try {
        await userService.delete(userId);
        alert('User deleted successfully.');
        router.push('/users');
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };
  
  useEffect(() => {
    // Only Super Master can access this page
    if (currentUser && String(currentUser.type) !== '1') {
      router.push('/users');
      return;
    }
    
    if (userId) {
      fetchData();
    }
  }, [userId, currentUser, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [userData, permsData] = await Promise.all([
        userService.getProfile(userId),
        userService.getAllPermissions()
      ]);
      
      setUser(userData);
      setType(String(userData.type));
      setIsLocked(!!userData.is_locked);
      setSelectedPermissions(userData.permissions || []);
      setAllPermissions(permsData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePermission = (moduleName: string) => {
    setSelectedPermissions(prev => 
      prev.includes(moduleName) 
        ? prev.filter(p => p !== moduleName) 
        : [...prev, moduleName]
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Update role
      if (type !== String(user?.type)) {
        await userService.updateRole(userId, type);
      }
      
      // Update lock
      if (isLocked !== !!user?.is_locked) {
        await userService.toggleLock(userId, isLocked);
      }
      
      // Update permissions (only if they are an admin)
      if (type === '2') {
        const permIds = selectedPermissions
          .map(name => allPermissions.find(p => p.module_name === name)?.id)
          .filter(Boolean) as number[];
          
        await userService.updatePermissions(userId, permIds);
      } else if (type === '0' && selectedPermissions.length > 0) {
        // Clear permissions if downgraded to normal user
        await userService.updatePermissions(userId, []);
      }
      
      alert('User access updated successfully!');
      router.push('/users');
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update user access');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading user data...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-destructive">User not found.</div>;
  }

  const isSuperMaster = String(user.type) === '1';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/users" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground hover:text-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage User Access</h1>
          <p className="text-muted-foreground">Adjust roles, lock status, and granular permissions for <span className="text-foreground font-semibold">{user.user_name}</span>.</p>
        </div>
      </div>
      
      {isSuperMaster ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-destructive flex items-center gap-4">
          <ShieldCheck className="w-8 h-8" />
          <div>
            <h3 className="font-bold text-lg">Super Master Account</h3>
            <p className="text-sm opacity-90">This account has absolute privileges. You cannot modify the role or permissions of another Super Master.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="col-span-1 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Lock Account</div>
                    <div className="text-xs text-muted-foreground mt-1">Prevent user from logging in.</div>
                  </div>
                  <button
                    onClick={() => setIsLocked(!isLocked)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isLocked ? 'bg-destructive' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isLocked ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="pt-4 border-t border-border mt-4">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 text-sm font-medium transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">User Role</h3>
              <div className="space-y-3">
                {[
                  { label: 'User', value: '0', desc: 'Standard subscriber' },
                  { label: 'Admin', value: '2', desc: 'Has specific dashboard access' }
                ].map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setType(role.value)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      type === role.value 
                        ? 'border-primary bg-primary/5 shadow-sm' 
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${type === role.value ? 'text-primary' : ''}`}>{role.label}</span>
                      {type === role.value && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-6">
            {type === '2' ? (
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Admin Permissions</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Select which modules this Admin has access to manage.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allPermissions.map((perm) => {
                    const isSelected = selectedPermissions.includes(perm.module_name);
                    return (
                      <button
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.module_name)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isSelected 
                            ? 'bg-primary/5 border-primary text-primary shadow-sm' 
                            : 'bg-background border-border text-muted-foreground hover:border-primary/30 hover:bg-muted'
                        }`}
                      >
                        <span className="font-medium text-sm">{perm.module_name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-2xl bg-muted/20 animate-in fade-in duration-200">
                <Shield className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg text-muted-foreground">Permissions Disabled</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm">Standard users do not require dashboard permissions. Change the role to "Admin" to configure access.</p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Save All Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
