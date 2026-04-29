'use client';

import React from 'react';
import { Plus, Tag } from 'lucide-react';

const genres = [
  { id: '1', name: 'Action', slug: 'action', description: 'Fast-paced, high-stakes excitement.' },
  { id: '2', name: 'Drama', slug: 'drama', description: 'Character-driven narratives and emotional depth.' },
  { id: '3', name: 'Comedy', slug: 'comedy', description: 'Humor and lighthearted storytelling.' },
  { id: '4', name: 'Sci-Fi', slug: 'sci-fi', description: 'Futuristic and imaginative concepts.' },
];

export default function GenresPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Genres</h1>
        <button className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Genre
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {genres.map(genre => (
          <div key={genre.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-colors">
            <div className="p-3 bg-muted rounded-xl w-fit mb-4">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">{genre.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{genre.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
