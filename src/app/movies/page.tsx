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
  Film,
  AlertTriangle,
  X,
  Loader2
} from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { movieService, Movie } from '@/services/movieService';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      setIsLoading(true);
      const data = await movieService.getAll();
      setMovies(Array.isArray(data) ? data : []);
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
      accessorKey: 'movie_name',
      header: 'Movie',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-14 bg-muted rounded overflow-hidden relative group">
            <img 
              src={row.original.media?.image?.url || 'https://via.placeholder.com/150'} 
              alt={row.original.movie_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.title || row.original.movie_name}</div>
            <div className="text-xs text-muted-foreground">{row.original.releaseYear || row.original.release_date?.split('-')[0] || 'N/A'} • {row.original.duration}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'genre_name',
      header: 'Genre',
      cell: ({ row }) => (
        <span className="capitalize text-xs font-medium px-2 py-1 bg-muted rounded-full">
          {row.original.genre_name || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'viewCount',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 font-medium">
          <Eye className="w-4 h-4 text-muted-foreground" />
          {(row.original.viewCount || 0).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'isFeatured',
      header: 'Featured',
      cell: ({ row }) => (
        <div className={cn(
          "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded",
          row.original.isFeatured ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground bg-muted"
        )}>
          <Star className={cn("w-3 h-3", row.original.isFeatured && "fill-current")} />
          {row.original.isFeatured ? 'YES' : 'NO'}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Link 
            href={`/movies/${row.original.slug || row.original.id}/edit`}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button 
            onClick={() => setMovieToDelete(row.original)}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const confirmDelete = async () => {
    if (!movieToDelete) return;
    setIsDeleting(true);
    try {
      await movieService.delete(movieToDelete.id);
      setMovies(prev => prev.filter(m => m.id !== movieToDelete.id));
      setMovieToDelete(null);
    } catch (error) {
      console.error('Failed to delete movie:', error);
      alert('Failed to delete movie. It might be linked to other records.');
    } finally {
      setIsDeleting(false);
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

      {/* Delete Confirmation Modal */}
      {movieToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete Movie</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Are you sure you want to delete <span className="font-semibold text-foreground">{movieToDelete.title || movieToDelete.movie_name}</span>?
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => !isDeleting && setMovieToDelete(null)}
                  className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 mt-5">
                <p className="text-xs text-destructive/90">
                  This action cannot be undone. This will permanently delete the movie and remove all associated data from our servers.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
              <button 
                onClick={() => setMovieToDelete(null)}
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
                    Delete Movie
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
