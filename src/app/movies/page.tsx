'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  Film
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { movieService, Movie } from '@/services/movieService';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      const data = await movieService.getAll();
      setMovies(data);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
      // Fallback to empty array if API fails
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Movie>[] = [
    {
      accessorKey: 'title',
      header: 'Movie',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-muted rounded overflow-hidden relative group">
            <img 
              src={row.original.movie_image || 'https://via.placeholder.com/150'} 
              alt={row.original.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.title}</div>
            <div className="text-xs text-muted-foreground">{row.original.year} • {row.original.duration}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Genre/Type',
      cell: ({ row }) => (
        <span className="capitalize text-xs font-medium px-2 py-1 bg-muted rounded-full">
          {row.original.type || 'Action'}
        </span>
      ),
    },
    {
      accessorKey: 'view_count',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium">
          <Eye className="w-4 h-4 text-muted-foreground" />
          {(row.original.view_count || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'featured',
      header: 'Featured',
      cell: ({ row }) => (
        <div className={cn(
          "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded",
          row.original.featured ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground bg-muted"
        )}>
          <Star className={cn("w-3 h-3", row.original.featured && "fill-current")} />
          {row.original.featured ? 'YES' : 'NO'}
        </div>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.created_at)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(row.original.id)}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    
    try {
      await movieService.delete(id);
      setMovies(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Failed to delete movie. It might be linked to other records.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movies Management</h1>
          <p className="text-muted-foreground mt-1">Manage your cinema library and interactive content.</p>
        </div>
        <Link 
          href="/movies/new"
          className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add New Movie
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border animate-pulse">
            <Film className="w-12 h-12 text-muted animate-bounce mb-4" />
            <p className="text-muted-foreground">Syncing movie library...</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={movies} 
            searchPlaceholder="Search movies by title, genre, or director..." 
          />
        )}
      </div>
    </div>
  );
}
