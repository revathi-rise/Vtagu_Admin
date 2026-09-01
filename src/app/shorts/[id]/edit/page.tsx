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
  Video,
  Info,
  Loader2,
  Trash2,
  Eye,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { shortService, ShortPayload } from '@/services/shortService';
import { genreService, Genre } from '@/services/genreService';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';

const shortSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  video_url: z.string().min(1, 'Video URL is required'),
  thumbnail_url: z.string().optional().or(z.literal('')),
  duration: z.string().optional(),
  languages: z.string().optional(),
  genre_id: z.number().optional(),
  is_free: z.boolean(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().min(0),
});

type ShortFormValues = z.infer<typeof shortSchema>;

const slugify = (text: string) =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

function Toggle({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative w-11 h-6 rounded-full transition-colors duration-200', checked ? 'bg-primary' : 'bg-muted')}
      >
        <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200', checked ? 'left-6' : 'left-1')} />
      </button>
    </div>
  );
}

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
      <label className="block text-sm font-medium mb-1.5 text-foreground/90">{label}</label>
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditShortPage({ params }: PageProps) {
  const router = useRouter();
  const [shortId, setShortId] = React.useState<number | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [preview, setPreview] = React.useState(false);
  const [availableGenres, setAvailableGenres] = React.useState<Genre[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    reset,
  } = useForm<ShortFormValues>({
    resolver: zodResolver(shortSchema),
    defaultValues: {
      is_free: true,
      is_featured: false,
      is_active: true,
      sort_order: 0,
    },
  });

  // Resolve params and load existing data
  React.useEffect(() => {
    genreService.getAll().then(setAvailableGenres).catch(console.error);

    params.then(({ id }) => {
      const numId = parseInt(id, 10);
      setShortId(numId);
      shortService.getById(numId)
        .then((data) => {
          reset({
            title: data.title || '',
            slug: data.slug || '',
            description: data.description || '',
            video_url: data.video_url || '',
            thumbnail_url: data.thumbnail_url || '',
            duration: data.duration || '',
            languages: data.languages || '',
            genre_id: data.genre_id || undefined,
            is_free: data.is_free ?? true,
            is_featured: data.is_featured ?? false,
            is_active: data.is_active ?? true,
            sort_order: data.sort_order ?? 0,
          });
        })
        .catch(() => setLoadError('Failed to load short data.'));
    });
  }, [params, reset]);

  const handleThumbnailUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; url: string }>('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      if (res.data.status && res.data.url) {
        setValue('thumbnail_url', res.data.url, { shouldValidate: true });
      }
    } catch (err) {
      alert('Failed to upload thumbnail.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ShortFormValues) => {
    if (!shortId) return;
    try {
      const payload: Partial<ShortPayload> = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        video_url: data.video_url,
        thumbnail_url: data.thumbnail_url,
        duration: data.duration,
        languages: data.languages,
        genre_id: data.genre_id,
        is_free: data.is_free,
        is_featured: data.is_featured,
        is_active: data.is_active,
        sort_order: data.sort_order,
      };
      await shortService.update(shortId, payload);
      router.push('/shorts');
    } catch {
      alert('Failed to update short. Please try again.');
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white transition-all',
      hasError && 'border-destructive ring-destructive/20'
    );

  const thumbnailUrl = watch('thumbnail_url') || '';

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-destructive font-semibold">{loadError}</p>
        <Link href="/shorts" className="text-primary hover:underline">← Back to Shorts</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/shorts" className="p-2 border border-border rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Short</h1>
            <p className="text-sm text-muted-foreground">Update this short video's details.</p>
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
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-8">

          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Info className="w-5 h-5" />
              General Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Title *</label>
                <input {...register('title')} className={inputClass(!!errors.title)} />
                {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Slug</label>
                <input {...register('slug')} className={inputClass()} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Description</label>
              <textarea {...register('description')} rows={3} className={cn(inputClass(), 'resize-none')} />
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Video className="w-5 h-5" />
              Video & Media
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Video URL *</label>
              <input {...register('video_url')} className={inputClass(!!errors.video_url)} />
              {errors.video_url && <p className="text-xs text-destructive mt-1.5">{errors.video_url.message}</p>}
            </div>
            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Thumbnail (9:16)</label>
              <div className="relative w-40 aspect-[9/16] rounded-2xl overflow-hidden border border-border/80 bg-muted/20 group/thumb">
                {thumbnailUrl ? (
                  <>
                    <img src={thumbnailUrl} alt="Thumb" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-all flex items-center justify-center gap-2">
                      <button type="button" onClick={() => setPreview(true)} className="p-2 bg-white/10 text-white rounded-full border border-white/20"><Eye className="w-4 h-4" /></button>
                      <button type="button" onClick={() => document.getElementById('thumb-edit-upload')?.click()} className="p-2 bg-white/10 text-white rounded-full border border-white/20"><Upload className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setValue('thumbnail_url', '')} className="p-2 bg-red-500/20 text-red-400 rounded-full border border-red-500/30"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={() => document.getElementById('thumb-edit-upload')?.click()}
                    className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl transition-all"
                  >
                    {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" /> : <ImageIcon className="w-6 h-6 text-muted-foreground/60 mb-1" />}
                    <p className="text-[11px] font-semibold text-white/80 text-center px-2">{isUploading ? 'Uploading...' : 'Upload Thumb'}</p>
                  </div>
                )}
              </div>
              <input type="file" id="thumb-edit-upload" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f); e.target.value = ''; }} accept="image/*" className="hidden" />
              <input type="text" value={thumbnailUrl} onChange={(e) => setValue('thumbnail_url', e.target.value)} placeholder="Or paste URL…" className="mt-3 w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white" />
            </div>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Properties</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Duration</label>
                <input {...register('duration')} placeholder="0:45" className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Sort Order</label>
                <input type="number" {...register('sort_order', { valueAsNumber: true })} className={inputClass()} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Languages</label>
              <input {...register('languages')} placeholder="Tamil, English" className={inputClass()} />
            </div>
            <CustomSelect
              label="Genre"
              value={String(watch('genre_id') || '')}
              onChange={(val) => setValue('genre_id', Number(val), { shouldValidate: true })}
              options={
                availableGenres.length > 0
                  ? availableGenres.map(g => ({ label: g.genre_name, value: String(g.genre_id) }))
                  : [{ label: 'Action', value: '4' }, { label: 'Drama', value: '5' }]
              }
              placeholder="Select a genre"
            />
          </section>

          <section className="bg-card border border-border rounded-2xl p-6 space-y-1">
            <h3 className="text-lg font-semibold border-b border-border pb-2 mb-3">Visibility</h3>
            <Toggle label="Free Access" description="Visible without subscription" checked={watch('is_free')} onChange={(v) => setValue('is_free', v)} />
            <Toggle label="Featured" description="Highlight in featured sections" checked={watch('is_featured')} onChange={(v) => setValue('is_featured', v)} />
            <Toggle label="Active / Live" description="Show on public Shorts feed" checked={watch('is_active')} onChange={(v) => setValue('is_active', v)} />
          </section>
        </div>
      </div>

      {/* Thumbnail preview lightbox */}
      {preview && thumbnailUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreview(false)}>
          <img src={thumbnailUrl} alt="Preview" className="max-h-[80vh] max-w-sm rounded-2xl shadow-2xl" />
        </div>
      )}
    </form>
  );
}
