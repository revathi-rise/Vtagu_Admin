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
  Info,
  Loader2,
  Trash2,
  ChevronDown,
  Eye,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { movieService } from '@/services/movieService';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import { languageService, Language } from '@/services/languageService';
import { genreService, Genre } from '@/services/genreService';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import ImageCropperModal from '@/components/ui/ImageCropperModal';

const movieSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description_short: z.string().min(10, 'Short description is too short'),
  description_long: z.string().min(20, 'Long description is too short'),
  year: z.number().min(1900).max(new Date().getFullYear() + 5),
  rating: z.number().min(0).max(10),
  url: z.string().url('Invalid video URL'),
  trailer_url: z.string().url('Invalid trailer URL').optional().or(z.literal('')),
  movie_image: z.string().url('Invalid image URL'),
  card_image: z.string().url('Invalid card image URL').optional().or(z.literal('')),
  duration: z.string().min(1, 'Duration is required'),
  featured: z.boolean(),
  free: z.boolean(),
  is_interactive: z.boolean(),
  languages: z.string().optional(),
  director: z.string().min(1, 'Director is required'),
  actors: z.string().min(1, 'Actors are required'),
  genre_id: z.number().optional(),
  country_id: z.number().optional(),
});

type MovieFormValues = z.infer<typeof movieSchema>;

interface CustomSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

function CustomSelect({ label, value, onChange, options, placeholder }: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-medium mb-1.5 text-foreground">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-left transition-all hover:bg-muted/80 text-white"
      >
        <span>{selectedOption ? selectedOption.label : placeholder || 'Select option'}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isOpen && "transform rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-30 py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-4 py-2 text-sm transition-colors text-white",
                value === opt.value 
                  ? "text-primary font-semibold bg-primary/10" 
                  : "text-muted-foreground hover:text-white hover:bg-muted/50"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function NewMoviePage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = React.useState(false);
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
      languages: '',
      rating: 0,
      director: '',
      actors: '',
      genre_id: 4,
      country_id: 1,
      card_image: '',
    }
  });

  const isInteractive = watch('is_interactive');
  const movieImageUrl = watch('movie_image');
  const cardImageUrl = watch('card_image');
  const titleValue = watch('title');

  React.useEffect(() => {
    if (titleValue) {
      setValue('slug', slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, setValue]);

  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = React.useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = React.useState<Genre[]>([]);

  React.useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const langs = await languageService.getAll();
        setAvailableLanguages(langs);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      }
    };
    const fetchGenres = async () => {
      try {
        const genresList = await genreService.getAll();
        setAvailableGenres(genresList || []);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchLanguages();
    fetchGenres();
  }, []);

  const [cropModalData, setCropModalData] = React.useState<{ file: File, field: 'movie_image' | 'card_image', aspectRatio: number } | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, field: 'movie_image' | 'card_image') => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    event.target.value = '';
    
    const aspectRatio = field === 'movie_image' ? 16 / 9 : 3 / 4;
    setCropModalData({ file, field, aspectRatio });
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropModalData) return;

    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-image.jpg');

    setIsUploading(true);
    try {
      const response = await apiClient.post<{ status: boolean; message: string; url: string }>(
        '/upload-image',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // Extend timeout to 60 seconds for uploads
        }
      );

      if (response.data.status && response.data.url) {
        setValue(cropModalData.field, response.data.url, { shouldValidate: true });
        setCropModalData(null);
      } else {
        alert(response.data.message || 'Failed to upload image.');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: MovieFormValues) => {
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        description_short: data.description_short,
        description_long: data.description_long,
        year: data.year,
        duration: data.duration,
        rating: data.rating,
        genre_id: data.genre_id,
        country_id: data.country_id || 1,
        actors: data.actors,
        director: data.director,
        languages: data.languages || '',
        featured: data.featured,
        free: data.free,
        is_interactive: data.is_interactive,
        movie_image: data.movie_image,
        card_image: data.card_image || '',
        url: data.url,
        trailer_url: data.trailer_url || '',
        trailer_alt: `${data.title} official trailer`,
      };

      await movieService.create(payload);
      router.push('/movies');
    } catch (error) {
      console.error('Failed to create movie:', error);
      alert('Failed to create movie. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative animate-in slide-in-from-bottom-4 duration-500">
      {/* Render Cropper Modal */}
      {cropModalData && (
        <ImageCropperModal
          imageFile={cropModalData.file}
          aspectRatio={cropModalData.aspectRatio}
          onClose={() => setCropModalData(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      <div className="flex items-center justify-between pb-5 border-b border-border">
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
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Title</label>
                <input 
                  {...register('title')}
                  placeholder="e.g. Inception"
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.title && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Slug</label>
                <input 
                  {...register('slug')}
                  placeholder="inception-2010"
                  className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Director</label>
                <input 
                  {...register('director')}
                  placeholder="e.g. James Cameron"
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.director && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.director && <p className="text-xs text-destructive mt-1.5">{errors.director.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Actors / Cast</label>
                <input 
                  {...register('actors')}
                  placeholder="e.g. Sam Worthington, Zoe Saldana"
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.actors && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.actors && <p className="text-xs text-destructive mt-1.5">{errors.actors.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Short Description</label>
              <RichTextEditor 
                value={watch('description_short') || ''}
                onChange={(val) => setValue('description_short', val, { shouldValidate: true })}
                placeholder="Brief snapshot of the movie..."
              />
              {errors.description_short && (
                <p className="text-xs text-destructive mt-1.5">{errors.description_short.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Long Description</label>
              <RichTextEditor 
                value={watch('description_long') || ''}
                onChange={(val) => setValue('description_long', val, { shouldValidate: true })}
                placeholder="Detailed plot, cast description, etc..."
              />
              {errors.description_long && (
                <p className="text-xs text-destructive mt-1.5">{errors.description_long.message}</p>
              )}
            </div>
          </section>

          {/* Media & Links */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Film className="w-5 h-5" />
              Media & Content
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Movie/Video URL</label>
                <input 
                  {...register('url')}
                  placeholder="https://..."
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.url && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.url && <p className="text-xs text-destructive mt-1.5">{errors.url.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Trailer URL</label>
                <input 
                  {...register('trailer_url')}
                  placeholder="https://..."
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.trailer_url && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.trailer_url && <p className="text-xs text-destructive mt-1.5">{errors.trailer_url.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Poster Image (16:9) */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Poster Image (16:9)</label>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center transition-all group/poster">
                  {movieImageUrl ? (
                    <>
                      <img 
                        src={movieImageUrl} 
                        alt="Movie Poster" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover/poster:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxImageUrl(movieImageUrl);
                            setIsPreviewOpen(true);
                          }}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                          title="Preview Image"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('poster-upload')?.click()}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                          title="Upload New"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('movie_image', '', { shouldValidate: true })}
                          className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white rounded-full border border-red-500/30 transition-all hover:scale-105"
                          title="Delete Image"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('poster-upload')?.click()}
                      className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-all duration-300 w-full h-full"
                    >
                      {isUploading && cropModalData?.field === 'movie_image' ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/60 mb-2 group-hover/poster:text-primary transition-colors" />
                      )}
                      <p className="text-xs font-semibold text-white/90 text-center">
                        {isUploading && cropModalData?.field === 'movie_image' ? 'Uploading cropped poster...' : 'Upload Poster (16:9)'}
                      </p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="poster-upload"
                  onChange={(e) => handleFileSelect(e, 'movie_image')} 
                  accept="image/*" 
                  className="hidden" 
                />
                <input type="hidden" {...register('movie_image')} />
                {errors.movie_image && <p className="text-xs text-destructive mt-1.5">{errors.movie_image.message}</p>}
              </div>

              {/* Card Image (3:4) */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Card Image (3:4)</label>
                <div className="relative w-full aspect-video md:aspect-[3/4] max-h-[180px] md:max-h-none rounded-2xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center transition-all group/card">
                  {cardImageUrl ? (
                    <>
                      <img 
                        src={cardImageUrl} 
                        alt="Movie Card" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setLightboxImageUrl(cardImageUrl);
                            setIsPreviewOpen(true);
                          }}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                          title="Preview Image"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => document.getElementById('card-upload')?.click()}
                          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                          title="Upload New"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('card_image', '', { shouldValidate: true })}
                          className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-white rounded-full border border-red-500/30 transition-all hover:scale-105"
                          title="Delete Image"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => document.getElementById('card-upload')?.click()}
                      className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center p-6 border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-all duration-300 w-full h-full"
                    >
                      {isUploading && cropModalData?.field === 'card_image' ? (
                        <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/60 mb-2 group-hover/card:text-primary transition-colors" />
                      )}
                      <p className="text-xs font-semibold text-white/90 text-center">
                        {isUploading && cropModalData?.field === 'card_image' ? 'Uploading cropped card...' : 'Upload Card (3:4)'}
                      </p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  id="card-upload"
                  onChange={(e) => handleFileSelect(e, 'card_image')} 
                  accept="image/*" 
                  className="hidden" 
                />
                <input type="hidden" {...register('card_image')} />
                {errors.card_image && <p className="text-xs text-destructive mt-1.5">{errors.card_image.message}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {/* Metadata */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Properties</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Year</label>
                <input 
                  type="number"
                  {...register('year', { valueAsNumber: true })}
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.year && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.year && <p className="text-xs text-destructive mt-1.5">{errors.year.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Duration</label>
                <input 
                  {...register('duration')}
                  placeholder="e.g. 2h 15m"
                  className={cn(
                    "w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                    errors.duration && "border-destructive ring-destructive/20"
                  )}
                />
                {errors.duration && <p className="text-xs text-destructive mt-1.5">{errors.duration.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Rating (0-10)</label>
              <input 
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register('rating', { valueAsNumber: true })}
                className={cn(
                  "w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white",
                  errors.rating && "border-destructive ring-destructive/20"
                )}
              />
              {errors.rating && <p className="text-xs text-destructive mt-1.5">{errors.rating.message}</p>}
            </div>

            <CustomSelect
              label="Genre"
              value={String(watch('genre_id') || '')}
              onChange={(value) => {
                setValue('genre_id', Number(value), { shouldValidate: true });
              }}
              options={
                availableGenres.length > 0
                  ? availableGenres.map((g) => ({
                      label: g.genre_name,
                      value: String(g.genre_id),
                    }))
                  : [
                      { label: 'Action', value: '4' },
                      { label: 'Drama', value: '5' },
                      { label: 'Comedy', value: '6' },
                      { label: 'Sci-Fi', value: '7' }
                    ]
              }
            />

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Languages</label>
              {availableLanguages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {availableLanguages.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.name);
                    return (
                      <button
                        key={lang.slug}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? selectedLanguages.filter((l) => l !== lang.name)
                            : [...selectedLanguages, lang.name];
                          setSelectedLanguages(updated);
                          setValue('languages', updated.join(', '), { shouldValidate: true });
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-3.5 h-3.5 rounded flex items-center justify-center border transition-all",
                          isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/30 bg-transparent"
                        )}>
                          {isSelected && <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>}
                        </div>
                        {lang.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-muted/30 p-3 border border-border/50 rounded-xl">
                  Loading languages...
                </div>
              )}
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

      {/* High-res Image Preview Lightbox Modal */}
      {isPreviewOpen && lightboxImageUrl && (
        <>
          <div 
            onClick={() => {
              setIsPreviewOpen(false);
              setLightboxImageUrl(null);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity duration-300 flex items-center justify-center p-4 animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl max-h-[85vh] w-full rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Image Preview</span>
                <button 
                  type="button"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    setLightboxImageUrl(null);
                  }}
                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-black/40 overflow-hidden max-h-[70vh]">
                <img 
                  src={lightboxImageUrl} 
                  alt="Preview" 
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300';
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </form>
  );
}
