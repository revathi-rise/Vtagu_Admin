'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';

export default function ActorsPage() {
  const columns = [
    { accessorKey: 'name', header: 'Actor Name' },
    { accessorKey: 'country', header: 'Country' },
    { accessorKey: 'dob', header: 'Date of Birth' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Actors</h1>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Actor
        </button>
      </div>
      <DataTable columns={columns} data={[]} searchPlaceholder="Search actors..." />
    </div>
  );
}
