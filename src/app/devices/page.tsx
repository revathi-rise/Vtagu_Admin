'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Laptop, Tv, XCircle, Loader2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { deviceService, Device } from '@/services/deviceService';
import { formatDate } from '@/lib/utils';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await deviceService.getAll();
      setDevices(data || []);
    } catch (err) {
      console.error('Failed to fetch devices:', err);
      setError('Could not load user devices. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this device?')) return;
    try {
      await deviceService.remove(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to remove device:', err);
      alert('Failed to remove device. Please try again.');
    }
  };

  const filteredDevices = devices.filter(device => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (device.device_name || '').toLowerCase().includes(q);
    const idMatch = (device.device_id || '').toLowerCase().includes(q);
    const userMatch = String(device.userId || device.user_id || '').toLowerCase().includes(q);
    const osMatch = (device.os || '').toLowerCase().includes(q);
    const ipMatch = (device.ip_address || '').toLowerCase().includes(q);
    return nameMatch || idMatch || userMatch || osMatch || ipMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Devices</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage devices logged into the platform.</p>
        </div>
        <button 
          onClick={fetchDevices}
          disabled={isLoading}
          className="self-start sm:self-auto bg-muted/50 hover:bg-muted border border-border px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input 
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by device, User ID, OS or IP..."
          className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 ring-primary/20"
        />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.length > 0 ? (
            filteredDevices.map(device => {
              const isActive = device.is_active === true || (device.is_active as any) === 1 || (device.is_active as any) === '1';
              const deviceName = device.device_name || device.device_id || 'Unnamed Device';
              const userId = device.userId || device.user_id || 'N/A';
              const deviceType = (device.device_type || '').toLowerCase();

              return (
                <div key={device.id || device.device_id} className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between gap-4 group hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                      {deviceType.includes('mobile') || deviceType.includes('phone') ? (
                        <Smartphone className="w-6 h-6 text-primary" />
                      ) : deviceType.includes('tv') ? (
                        <Tv className="w-6 h-6 text-primary" />
                      ) : (
                        <Laptop className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <button 
                      onClick={() => handleRemove(device.id)}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                      title="Remove Device"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-primary transition-colors">{deviceName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                        User ID: {userId}
                      </span>
                      {device.ip_address && (
                        <span className="text-[10px] text-muted-foreground/80 font-mono">
                          {device.ip_address}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {device.os || 'OS Unknown'} {device.os_version || ''} {device.app_version ? `• v${device.app_version}` : ''}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className={`w-4 h-4 ${isActive ? 'text-emerald-500' : 'text-zinc-500'}`} />
                      <span className={`font-bold uppercase ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {device.last_active ? formatDate(device.last_active) : 'N/A'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border">
              <Laptop className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-muted-foreground font-semibold text-base">No user devices found</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                {searchQuery ? 'Try adjusting your search criteria.' : 'Logged-in user devices will appear here.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
