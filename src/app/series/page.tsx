'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Tv, Layers, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { movieService, Movie } from '@/services/movieService';

export default function SeriesPage() {
  const [series, setSeries] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setIsLoading(true);
      const allMovies = await movieService.getAll();
      const onlySeries = allMovies.filter(m => m.movie_type?.toLowerCase() === 'series');
      setSeries(onlySeries);
    } catch (error) {
      console.error('Failed to fetch series:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Movie>[] = [
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
      accessorKey: 'year',
      header: 'Year',
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link href={`/series/${row.original.id}`} className="text-primary text-sm font-medium hover:underline">
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading web series...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={series} searchPlaceholder="Search series..." />
      )}
    </div>
  );
}
