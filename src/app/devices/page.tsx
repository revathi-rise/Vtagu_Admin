'use client';

import React from 'react';
import { Smartphone, Laptop, Tv, XCircle } from 'lucide-react';

const devices = [
  { id: '1', name: 'iPhone 15 Pro', type: 'Mobile', ip: '192.168.1.1', user: 'John Doe', last_login: '10 mins ago' },
  { id: '2', name: 'Samsung TV QLED', type: 'Smart TV', ip: '192.168.1.45', user: 'Jane Smith', last_login: '2 hours ago' },
  { id: '3', name: 'MacBook Pro', type: 'Desktop', ip: '10.0.0.12', user: 'John Doe', last_login: 'Just now' },
];

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">User Devices</h1>
      <p className="text-muted-foreground">Monitor and manage devices logged into the platform.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <div key={device.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex justify-between">
              <div className="p-3 bg-muted rounded-xl">
                {device.type === 'Mobile' ? <Smartphone className="w-6 h-6" /> : 
                 device.type === 'Smart TV' ? <Tv className="w-6 h-6" /> : <Laptop className="w-6 h-6" />}
              </div>
              <button className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition-colors">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div>
              <h3 className="font-bold text-lg">{device.name}</h3>
              <p className="text-sm text-muted-foreground">User: {device.user}</p>
            </div>
            <div className="pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>IP: {device.ip}</span>
              <span>Logged: {device.last_login}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
