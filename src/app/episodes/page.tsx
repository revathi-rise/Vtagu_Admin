'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';
import { PlayCircle, Plus, Loader2, AlertCircle, Film, Edit, Trash2 } from 'lucide-react';
import { episodeService, Episode } from '@/services/episodeService';

export default function EpisodesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEpisodes();
  }, []);

  const fetchEpisodes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await episodeService.getAll();
      setEpisodes(data || []);
    } catch (err: any) {
      console.error('Failed to fetch episodes:', err);
      setError('Could not load episodes. Please check your connection.');
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Episode>[] = [
    {
      accessorKey: 'title',
      header: 'Episode',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-8 bg-muted rounded overflow-hidden relative">
            {row.original.image ? (
              <img src={row.original.image} alt={row.original.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <PlayCircle className="w-4 h-4" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.title}</div>
            <div className="text-xs text-muted-foreground">Ep {row.original.episode_number} • {row.original.duration}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'seasonId',
      header: 'Season ID',
      cell: ({ row }) => <span className="text-sm font-medium">Season {row.original.seasonId}</span>
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.created_at ? formatDate(row.original.created_at) : 'N/A'}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.original.episodeId)}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      await episodeService.delete(id);
      setEpisodes(prev => prev.filter(e => e.episodeId !== id));
    } catch (error) {
      console.error('Failed to delete episode:', error);
      alert('Failed to delete episode.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Episodes</h1>
          <p className="text-muted-foreground">Manage individual video segments and metadata.</p>
        </div>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" />
          Add Episode
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading episodes...</p>
        </div>
      ) : episodes.length > 0 ? (
        <DataTable columns={columns} data={episodes} searchPlaceholder="Search episodes by title..." />
      ) : (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
          <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold">No episodes found</h3>
          <p className="text-muted-foreground max-w-xs mx-auto mt-2">
            Try adding your first episode to get started.
          </p>
        </div>
      )}
    </div>
  );
}
