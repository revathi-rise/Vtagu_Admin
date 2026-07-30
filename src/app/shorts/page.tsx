'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Star,
  Video,
  AlertTriangle,
  X,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Play,
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { shortService, Short } from '@/services/shortService';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function ShortsPage() {
  const [shorts, setShorts] = useState<Short[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shortToDelete, setShortToDelete] = useState<Short | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    fetchShorts();
  }, []);

  const fetchShorts = async () => {
    try {
      setIsLoading(true);
      const data = await shortService.getAll();
      setShorts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch shorts:', error);
      setShorts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (short: Short) => {
    setTogglingId(short.id);
    try {
      const updated = await shortService.toggleActive(short.id, !short.is_active);
      setShorts((prev) =>
        prev.map((s) => (s.id === short.id ? { ...s, is_active: !short.is_active } : s))
      );
    } catch (error) {
      console.error('Failed to toggle active state:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const formatViews = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n}`;
  };

  const columns: ColumnDef<Short>[] = [
    {
      accessorKey: 'title',
      header: 'Short',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {/* Portrait thumbnail */}
          <div className="w-9 h-16 bg-muted rounded-lg overflow-hidden relative group flex-shrink-0">
            {row.original.thumbnail_url ? (
              <img
                src={row.original.thumbnail_url}
                alt={row.original.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-3 h-3 text-white fill-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.title}</div>
            {row.original.description && (
              <div className="text-xs text-muted-foreground max-w-[200px] truncate">
                {row.original.description}
              </div>
            )}
            {row.original.duration && (
              <div className="text-xs text-muted-foreground mt-0.5">{row.original.duration}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'languages',
      header: 'Language',
      cell: ({ row }) => (
        <span className="capitalize text-xs font-medium px-2 py-1 bg-muted rounded-full">
          {row.original.languages || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'view_count',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium">
          <Eye className="w-4 h-4 text-muted-foreground" />
          {formatViews(row.original.view_count || 0)}
        </div>
      ),
    },
    {
      accessorKey: 'is_featured',
      header: 'Featured',
      cell: ({ row }) => (
        <div
          className={cn(
            'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded',
            row.original.is_featured
              ? 'text-amber-500 bg-amber-500/10'
              : 'text-muted-foreground bg-muted'
          )}
        >
          <Star className={cn('w-3 h-3', row.original.is_featured && 'fill-current')} />
          {row.original.is_featured ? 'YES' : 'NO'}
        </div>
      ),
    },
    {
      accessorKey: 'is_free',
      header: 'Access',
      cell: ({ row }) => (
        <span
          className={cn(
            'text-xs font-bold px-2 py-0.5 rounded',
            row.original.is_free
              ? 'text-emerald-400 bg-emerald-400/10'
              : 'text-violet-400 bg-violet-400/10'
          )}
        >
          {row.original.is_free ? 'Free' : 'Premium'}
        </span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: 'Active',
      cell: ({ row }) => {
        const isToggling = togglingId === row.original.id;
        return (
          <button
            onClick={() => handleToggleActive(row.original)}
            disabled={isToggling}
            className="flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
            title={row.original.is_active ? 'Click to deactivate' : 'Click to activate'}
          >
            {isToggling ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : row.original.is_active ? (
              <ToggleRight className="w-6 h-6 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-6 h-6 text-muted-foreground" />
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                row.original.is_active ? 'text-emerald-500' : 'text-muted-foreground'
              )}
            >
              {row.original.is_active ? 'Live' : 'Off'}
            </span>
          </button>
        );
      },
    },
    {
      accessorKey: 'sort_order',
      header: 'Order',
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm font-mono">{row.original.sort_order}</span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/shorts/${row.original.id}/edit`}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setShortToDelete(row.original)}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    if (!shortToDelete) return;
    setIsDeleting(true);
    try {
      await shortService.delete(shortToDelete.id);
      setShorts((prev) => prev.filter((s) => s.id !== shortToDelete.id));
      setShortToDelete(null);
    } catch (error) {
      console.error('Failed to delete short:', error);
      alert('Failed to delete short. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats
  const stats = [
    { label: 'Total Shorts', value: shorts.length, color: 'text-primary' },
    { label: 'Live / Active', value: shorts.filter((s) => s.is_active).length, color: 'text-emerald-400' },
    { label: 'Free', value: shorts.filter((s) => s.is_free).length, color: 'text-blue-400' },
    { label: 'Featured', value: shorts.filter((s) => s.is_featured).length, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shorts Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage vertical short-format video content for the Vtagu Shorts feed.
          </p>
        </div>
        <Link
          href="/shorts/new"
          className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Short
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-1"
          >
            <span className={cn('text-3xl font-black', stat.color)}>{stat.value}</span>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border animate-pulse">
            <Video className="w-12 h-12 text-muted animate-bounce mb-4" />
            <p className="text-muted-foreground">Loading shorts library...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={shorts}
            searchPlaceholder="Search shorts by title, language..."
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {shortToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete Short</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to delete{' '}
                      <span className="font-semibold text-foreground">"{shortToDelete.title}"</span>?
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !isDeleting && setShortToDelete(null)}
                  className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mt-5">
                <p className="text-xs text-destructive/90">
                  This action cannot be undone. This will permanently delete the short video and remove it
                  from the public feed.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <button
                onClick={() => setShortToDelete(null)}
                className="px-4 py-2 text-sm font-semibold hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Short
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
