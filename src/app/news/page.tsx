'use client';

import React from 'react';
import { Plus, Bell, Eye } from 'lucide-react';

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">News Popup Templates</h1>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden group">
            <div className="aspect-video bg-muted relative">
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Preview Popup
                  </button>
               </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">New Release Announcement {i}</h3>
                <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase">Active</div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">Get ready for the biggest blockbuster of the season! Available now on PrimeTime.</p>
              <div className="flex justify-end gap-2 text-xs font-medium border-t border-border pt-4 text-muted-foreground">
                Ends: May {10 + i}, 2024
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
