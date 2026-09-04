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
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { shortService, ShortPayload } from '@/services/shortService';
import { genreService, Genre } from '@/services/genreService';
import { cn } from '@/lib/utils';
import apiClient from '@/lib/api-client';
import ImageCropperModal from '@/components/ui/ImageCropperModal';

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const shortSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  video_url: z.string().min(1, 'Video URL is required'),
  thumbnail_url: z.string().optional().or(z.literal('')),
  duration: z.string().optional(),
  languages: z.string().optional(),
  genre_id: z.string().optional(),
  is_free: z.boolean(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().min(0),
});

type ShortFormValues = z.infer<typeof shortSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const slugify = (text: string) =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

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

// ─── Toggle Switch ────────────────────────────────────────────────────────────

interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function Toggle({ label, description, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200',
            checked ? 'left-6' : 'left-1'
          )}
        />
      </button>
    </div>
  );
}

// ─── Thumbnail Uploader ───────────────────────────────────────────────────────

interface ThumbnailUploaderProps {
  value: string;
  onChange: (url: string) => void;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function ThumbnailUploader({ value, onChange, isUploading, onUpload }: ThumbnailUploaderProps) {
  const [preview, setPreview] = React.useState(false);

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-foreground/90">
        Thumbnail Image (9:16 portrait)
      </label>
      <div className="relative w-40 aspect-[9/16] rounded-2xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center transition-all group/thumb">
        {value ? (
          <>
            <img
              src={value}
              alt="Thumbnail"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/180x320'; }}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-all flex items-center justify-center gap-2">
              <button type="button" onClick={() => setPreview(true)} className="p-2 bg-white/10 text-white rounded-full border border-white/20 hover:scale-105">
                <Eye className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => document.getElementById('thumb-upload')?.click()} className="p-2 bg-white/10 text-white rounded-full border border-white/20 hover:scale-105">
                <Upload className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => onChange('')} className="p-2 bg-red-500/20 text-red-400 rounded-full border border-red-500/30 hover:scale-105">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div
            onClick={() => document.getElementById('thumb-upload')?.click()}
            className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl transition-all"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground/60 mb-1" />
            )}
            <p className="text-[11px] font-semibold text-white/80 text-center px-2">
              {isUploading ? 'Uploading...' : 'Upload Thumbnail\n(9:16)'}
            </p>
          </div>
        )}
      </div>
      <input
        type="file"
        id="thumb-upload"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ''; }}
        accept="image/*"
        className="hidden"
      />
      {/* Or paste URL */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or paste image URL…"
        className="mt-3 w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
      />

      {/* Image lightbox */}
      {preview && value && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreview(false)}
        >
          <img src={value} alt="Preview" className="max-h-[80vh] max-w-sm rounded-2xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewShortPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = React.useState(false);
  const [availableGenres, setAvailableGenres] = React.useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = React.useState<string[]>([]);

  React.useEffect(() => {
    genreService.getAll().then(setAvailableGenres).catch(console.error);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ShortFormValues>({
    resolver: zodResolver(shortSchema),
    defaultValues: {
      is_free: true,
      is_featured: false,
      is_active: true,
      sort_order: 0,
      genre_id: undefined,
    },
  });

  const titleValue = watch('title');
  React.useEffect(() => {
    if (titleValue) setValue('slug', slugify(titleValue));
  }, [titleValue, setValue]);

  const [cropModalData, setCropModalData] = React.useState<{ file: File, aspectRatio: number } | null>(null);

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropModalData(null);
    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-thumbnail.jpg');
    setIsUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; message?: string; url?: string }>('/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      if (res.data.status && res.data.url) {
        setValue('thumbnail_url', res.data.url, { shouldValidate: true });
      } else {
        alert(res.data.message || 'Failed to upload thumbnail.');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      alert(err.response?.data?.message || 'Failed to upload thumbnail.');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ShortFormValues) => {
    try {
      const payload: ShortPayload = {
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
      await shortService.create(payload);
      router.push('/shorts');
    } catch (error) {
      console.error('Failed to create short:', error);
      alert('Failed to create short. Please try again.');
    }
  };

  const inputClass = (hasError?: boolean) =>
    cn(
      'w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white transition-all',
      hasError && 'border-destructive ring-destructive/20'
    );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      {/* Page header */}
      <div className="flex items-center justify-between pb-5 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/shorts" className="p-2 border border-border rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Add New Short</h1>
            <p className="text-sm text-muted-foreground">Upload a vertical short-format video.</p>
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
            {isSubmitting ? 'Publishing...' : 'Publish Short'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-8">

          {/* General Info */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Info className="w-5 h-5" />
              General Information
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Title *</label>
                <input {...register('title')} placeholder="e.g. Behind the Scenes" className={inputClass(!!errors.title)} />
                {errors.title && <p className="text-xs text-destructive mt-1.5">{errors.title.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Slug (auto-generated)</label>
                <input {...register('slug')} placeholder="behind-the-scenes" className={inputClass()} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Description</label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Short caption or description for this clip…"
                className={cn(inputClass(), 'resize-none')}
              />
            </div>
          </section>

          {/* Media */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary font-semibold mb-2">
              <Video className="w-5 h-5" />
              Video & Media
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Video URL *</label>
              <input
                {...register('video_url')}
                placeholder="https://cdn.example.com/short.mp4"
                className={inputClass(!!errors.video_url)}
              />
              {errors.video_url && <p className="text-xs text-destructive mt-1.5">{errors.video_url.message}</p>}
              <p className="text-xs text-muted-foreground mt-1.5">
                Direct MP4 / HLS / CDN URL. Supports BunnyCDN stream URLs.
              </p>
            </div>

            <div>
              <ThumbnailUploader
                value={watch('thumbnail_url') || ''}
                onChange={(url) => setValue('thumbnail_url', url, { shouldValidate: true })}
                isUploading={isUploading}
                onUpload={(file) => setCropModalData({ file, aspectRatio: 9 / 16 })}
              />
              <p className="text-xs text-muted-foreground mt-2 px-1 leading-relaxed">
                <span className="font-semibold text-primary">Note:</span> If no image is uploaded, the frontend will automatically show a thumbnail generated from the video.
              </p>
            </div>
          </section>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-8">

          {/* Metadata */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <h3 className="text-lg font-semibold border-b border-border pb-2">Properties</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Duration</label>
                <input {...register('duration')} placeholder="e.g. 0:45" className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Sort Order</label>
                <input
                  type="number"
                  {...register('sort_order', { valueAsNumber: true })}
                  className={inputClass()}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Languages</label>
              <input {...register('languages')} placeholder="e.g. Tamil, English" className={inputClass()} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Genres</label>
              {availableGenres.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenres.includes(String(genre.genre_id));
                    return (
                      <button
                        key={genre.genre_id}
                        type="button"
                        onClick={() => {
                          const updated = isSelected
                            ? selectedGenres.filter((g) => g !== String(genre.genre_id))
                            : [...selectedGenres, String(genre.genre_id)];
                          setSelectedGenres(updated);
                          setValue('genre_id', updated.join(','), { shouldValidate: true });
                        }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary shadow-sm" 
                            : "bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-3.5 h-3.5 rounded-sm flex items-center justify-center border transition-colors",
                          isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                        )}>
                          {isSelected && <CheckCircle className="w-2.5 h-2.5" />}
                        </div>
                        {genre.genre_name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border/50">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading genres...
                </div>
              )}
            </div>
          </section>

          {/* Visibility toggles */}
          <section className="bg-card border border-border rounded-2xl p-6 space-y-1">
            <h3 className="text-lg font-semibold border-b border-border pb-2 mb-3">Visibility</h3>
            <Toggle
              label="Free Access"
              description="Visible to all users without subscription"
              checked={watch('is_free')}
              onChange={(v) => setValue('is_free', v)}
            />
            <Toggle
              label="Featured"
              description="Highlight in featured sections"
              checked={watch('is_featured')}
              onChange={(v) => setValue('is_featured', v)}
            />
            <Toggle
              label="Active / Live"
              description="Show on the public Shorts feed"
              checked={watch('is_active')}
              onChange={(v) => setValue('is_active', v)}
            />
          </section>
        </div>
      </div>
    </form>

      {/* Image Cropper Modal */}
      {cropModalData && (
        <ImageCropperModal
          imageFile={cropModalData.file}
          aspectRatio={cropModalData.aspectRatio}
          onClose={() => setCropModalData(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
