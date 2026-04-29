'use client';

import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Tv, Layers, Plus } from 'lucide-react';
import Link from 'next/link';

interface Series {
  series_id: string;
  title: string;
  seasons: number;
  episodes: number;
  status: 'ongoing' | 'completed';
  rating: string;
}

const mockSeries: Series[] = [
  { series_id: '1', title: 'The Great Venture', seasons: 3, episodes: 36, status: 'ongoing', rating: 'PG-13' },
  { series_id: '2', title: 'Midnight Mystery', seasons: 1, episodes: 10, status: 'completed', rating: 'R' },
];

export default function SeriesPage() {
  const columns: ColumnDef<Series>[] = [
    {
      accessorKey: 'title',
      header: 'Series',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
            <Tv className="w-5 h-5" />
          </div>
          <span className="font-semibold">{row.original.title}</span>
        </div>
      )
    },
    {
      accessorKey: 'seasons',
      header: 'Seasons',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium">
          <Layers className="w-4 h-4 text-muted-foreground" />
          {row.original.seasons}
        </div>
      )
    },
    {
      accessorKey: 'episodes',
      header: 'Total Episodes',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link href={`/series/${row.original.series_id}`} className="text-primary text-sm font-medium hover:underline">
          Manage Seasons →
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Series</h1>
          <p className="text-muted-foreground">Manage multi-seasonal content and episodic structure.</p>
        </div>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Series
        </button>
      </div>
      <DataTable columns={columns} data={mockSeries} />
    </div>
  );
}
