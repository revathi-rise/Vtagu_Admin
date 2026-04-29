'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Tag, Loader2 } from 'lucide-react';
import { genreService, Genre } from '@/services/genreService';

export default function GenresPage() {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    try {
      setIsLoading(true);
      const data = await genreService.getAll();
      setGenres(data);
    } catch (error) {
      console.error('Failed to fetch genres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Genres</h1>
          <p className="text-muted-foreground">Manage content categories and discovery tags.</p>
        </div>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Genre
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {genres.length > 0 ? (
            genres.map(genre => (
              <div key={genre.genre_id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors group">
                <div className="p-3 bg-muted rounded-xl w-fit mb-4 group-hover:bg-primary/10 transition-colors">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-lg">{genre.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{genre.slug}</p>
                {genre.status && (
                  <span className="inline-block mt-3 px-2 py-1 bg-muted rounded text-[10px] font-bold uppercase tracking-wider">
                    {genre.status}
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-muted/30 rounded-3xl border border-dashed border-border">
              <p className="text-muted-foreground">No genres found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
