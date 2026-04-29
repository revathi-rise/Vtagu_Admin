'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ChevronLeft, 
  Save, 
  Upload, 
  Image as ImageIcon,
  Film,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { movieService } from '@/services/movieService';
import { cn } from '@/lib/utils';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description_short: z.string().min(10, 'Short description is too short'),
  description_long: z.string().min(20, 'Long description is too short'),
  year: z.number().min(1900).max(new Date().getFullYear()),
  rating: z.string().min(1, 'Rating is required'),
  movie_type: z.string().min(1, 'Movie type is required'),
  type: z.string().min(1, 'Type is required'),
  url: z.string().url('Invalid video URL'),
  trailer_url: z.string().url('Invalid trailer URL').optional().or(z.literal('')),
  movie_image: z.string().url('Invalid image URL'),
  duration: z.string().min(1, 'Duration is required'),
  featured: z.boolean(),
  free: z.boolean(),
  is_interactive: z.boolean(),
});

type MovieFormValues = z.infer<typeof movieSchema>;

export default function NewMoviePage() {
  const router = useRouter();
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<MovieFormValues>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      featured: false,
      free: false,
      is_interactive: false,
      year: new Date().getFullYear(),
    }
  });

  const isInteractive = watch('is_interactive');

  const onSubmit = async (data: MovieFormValues) => {
    try {
      await movieService.create(data);
      router.push('/movies');
    } catch (error) {
      console.error('Failed to create movie:', error);
      alert('Failed to create movie. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between sticky top-16 bg-background/80 backdrop-blur-md py-4 z-10">
        <div className="flex items-center gap-4">
          <Link 
            href="/movies"
            className="p-2 border border-border rounded-xl hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Movie</h1>
            <p className="text-sm text-muted-foreground">Fill in the details to publish a new movie.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-gradient text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Publishing...' : 'Publish Movie'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Info className="w-5 h-5" />
              General Information
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input 
                  {...register('title')}
                  placeholder="e.g. Inception"
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20",
                    errors.title && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <input 
                  {...register('slug')}
                  placeholder="inception-2010"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Short Description</label>
              <textarea 
                {...register('description_short')}
                rows={2}
                placeholder="Brief snapshot of the movie..."
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Long Description</label>
              <textarea 
                {...register('description_long')}
                rows={5}
                placeholder="Detailed plot, cast description, etc..."
                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
              />
            </div>
          </section>

          {/* Media & Links */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Film className="w-5 h-5" />
              Media & Content
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Movie/Video URL</label>
                <input 
                  {...register('url')}
                  placeholder="https://..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trailer URL</label>
                <input 
                  {...register('trailer_url')}
                  placeholder="https://..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Poster Image URL</label>
              <div className="flex gap-4">
                <input 
                  {...register('movie_image')}
                  placeholder="https://..."
                  className="flex-1 bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20"
                />
                <button type="button" className="px-4 py-2 bg-muted border border-border rounded-xl hover:bg-muted/80 flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Metadata */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Properties</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <input 
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <input 
                  {...register('duration')}
                  placeholder="e.g. 2h 15m"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Rating</label>
              <select {...register('rating')} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none">
                <option value="PG-13">PG-13</option>
                <option value="R">R</option>
                <option value="G">G</option>
                <option value="18+">18+</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Genre/Type</label>
              <select {...register('type')} className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none">
                <option value="action">Action</option>
                <option value="drama">Drama</option>
                <option value="comedy">Comedy</option>
                <option value="sci-fi">Sci-Fi</option>
              </select>
            </div>
          </section>

          {/* Toggles */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Featured Movie</label>
              <input type="checkbox" {...register('featured')} className="w-5 h-5 rounded border-border" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Free for All</label>
              <input type="checkbox" {...register('free')} className="w-5 h-5 rounded border-border" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Interactive Content</label>
              <input type="checkbox" {...register('is_interactive')} className="w-5 h-5 rounded border-border" />
            </div>
          </section>

          {isInteractive && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
              <h4 className="text-primary font-semibold flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Interactive Configuration
              </h4>
              <p className="text-xs text-muted-foreground mb-4">You can configure branching decisions in the Interactive Section after saving.</p>
              <Link 
                href="/interactive"
                className="text-sm text-primary font-medium hover:underline"
              >
                Go to Interactive Editor →
              </Link>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
