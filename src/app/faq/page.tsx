'use client';

import React from 'react';
import { Plus, HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const [limit, setLimit] = React.useState<number>(20);
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">FAQ Management</h1>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Show</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-card border border-border text-foreground rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none cursor-pointer shadow-sm"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={500}>500 per page</option>
          </select>
        </div>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Question
        </button>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span className="font-semibold text-lg">Question Sample {i}?</span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
