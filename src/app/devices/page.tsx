'use client';

import React, { useEffect, useState } from 'react';
import { Smartphone, Laptop, Tv, XCircle, Loader2 } from 'lucide-react';
import { deviceService, Device } from '@/services/deviceService';
import { formatDate } from '@/lib/utils';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setIsLoading(true);
      const data = await deviceService.getAll();
      setDevices(data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this device?')) return;
    try {
      await deviceService.remove(id);
      setDevices(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Failed to remove device:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">User Devices</h1>
          <p className="text-muted-foreground">Monitor and manage devices logged into the platform.</p>
        </div>
        <button 
          onClick={fetchDevices}
          className="text-sm font-medium text-primary hover:underline"
        >
          Refresh
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.length > 0 ? (
            devices.map(device => (
              <div key={device.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4 group hover:border-primary/50 transition-all">
                <div className="flex justify-between">
                  <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                    {device.device_type?.toLowerCase().includes('mobile') ? <Smartphone className="w-6 h-6 text-primary" /> : 
                     device.device_type?.toLowerCase().includes('tv') ? <Tv className="w-6 h-6 text-primary" /> : 
                     <Laptop className="w-6 h-6 text-primary" />}
                  </div>
                  <button 
                    onClick={() => handleRemove(device.id)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{device.device_name}</h3>
                  <p className="text-sm text-muted-foreground">User ID: {device.userId}</p>
                  <p className="text-xs text-muted-foreground mt-1">{device.os} {device.os_version}</p>
                </div>
                <div className="pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span className={cn(
                    "font-bold",
                    device.is_active ? "text-green-500" : "text-muted-foreground"
                  )}>
                    {device.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                  <span>Last seen: {formatDate(device.last_active)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border">
              <p className="text-muted-foreground">No devices found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility to handle class merging if not imported
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
