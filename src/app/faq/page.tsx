'use client';

import React from 'react';
import { Plus, HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">FAQ Management</h1>
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
