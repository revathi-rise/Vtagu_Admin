'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  ChevronLeft,
  Save,
  Loader2,
  Film,
  Info,
  Image as ImageIcon,
  Upload,
  Eye,
  Trash2,
  ChevronDown,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { episodeService, EpisodePayload } from '@/services/episodeService';
import { languageService, Language } from '@/services/languageService';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

/* ─── Zod schema ─────────────────────────────────────────────────────────── */
const schema = z.object({
  season_id: z.number({ message: 'Season ID is required' }).min(1, 'Season ID must be ≥ 1'),
  episode_number: z.number().min(1, 'Episode number must be ≥ 1'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description_short: z.string().min(5, 'Short description is too short'),
  description_long: z.string().min(10, 'Long description is too short'),
  duration: z.string().min(1, 'Duration is required'),
  languages: z.string().optional(),
  url: z.string().url('Invalid video URL'),
  trailer_url: z.string().url('Invalid trailer URL').optional().or(z.literal('')),
  trailer_alt: z.string().optional(),
  poster_image: z.string().optional(),
  card_image: z.string().optional(),
  poster_alt: z.string().optional(),
  rating: z.number().min(0).max(10),
  featured: z.boolean(),
  free: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const slugify = (text: string) =>
  text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ─── Reusable field wrapper ─────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-foreground/90">{label}</label>
      {children}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}

export default function NewEpisodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultSeasonId = Number(searchParams.get('season_id') || '');

  const [isUploading, setIsUploading] = React.useState(false);
  const [cropModalData, setCropModalData] = React.useState<{
    file: File; field: 'poster_image' | 'card_image'; aspectRatio: number;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = React.useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([]);

  const {
    register, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      season_id: defaultSeasonId || undefined,
      episode_number: 1,
      rating: 0,
      featured: false,
      free: false,
      languages: '',
      trailer_url: '',
      trailer_alt: '',
      poster_image: '',
      card_image: '',
      poster_alt: '',
    },
  });

  const titleValue = watch('title');
  const posterImageUrl = watch('poster_image');
  const cardImageUrl = watch('card_image');

  // Auto-generate slug
  useEffect(() => {
    if (titleValue) setValue('slug', slugify(titleValue), { shouldValidate: true });
  }, [titleValue, setValue]);

  // Fetch languages
  useEffect(() => {
    languageService.getAll().then(setAvailableLanguages).catch(console.error);
  }, []);

  /* ── Image upload ────────────────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'poster_image' | 'card_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropModalData({ file, field, aspectRatio: field === 'poster_image' ? 16 / 9 : 3 / 4 });
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropModalData) return;
    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-image.jpg');
    setIsUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; message: string; url: string }>(
        '/upload-image', formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      );
      if (res.data.status && res.data.url) {
        setValue(cropModalData.field, res.data.url, { shouldValidate: true });
        setCropModalData(null);
      } else {
        alert(res.data.message || 'Upload failed.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Submit ──────────────────────────────────────────────────────────── */
  const onSubmit = async (data: FormValues) => {
    try {
      // Build payload dynamically, omitting empty optional fields
      const payload: Record<string, any> = {
        season_id: data.season_id,
        episode_number: data.episode_number,
        title: data.title,
        slug: data.slug,
        description_short: data.description_short,
        description_long: data.description_long,
        duration: data.duration,
        url: data.url,
        rating: data.rating,
        featured: data.featured,
        free: data.free,
      };

      if (data.languages?.trim()) payload.languages = data.languages.trim();
      
      if (data.trailer_url?.trim()) {
        payload.trailer_url = data.trailer_url.trim();
        payload.trailer_alt = data.trailer_alt?.trim() || `${data.title} Official Trailer`;
      }
      
      if (data.poster_image?.trim()) {
        payload.poster_image = data.poster_image.trim();
        payload.poster_alt = data.poster_alt?.trim() || `${data.title} Poster`;
      }
      
      if (data.card_image?.trim()) {
        payload.card_image = data.card_image.trim();
      }

      await episodeService.create(payload as EpisodePayload);
      router.push('/series');
    } catch (err: any) {
      console.error('Create episode failed:', err);
      alert(err.response?.data?.message || 'Failed to create episode. Please try again.');
    }
  };

  const inputCls = (hasError?: boolean) => cn(
    'w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white transition-all',
    hasError && 'border-destructive ring-destructive/20'
  );

  /* ── Image uploader block ─────────────────────────────────────────────── */
  function ImageUploader({ field, id, label, aspect }: {
    field: 'poster_image' | 'card_image'; id: string; label: string; aspect: string;
  }) {
    const url = field === 'poster_image' ? posterImageUrl : cardImageUrl;
    return (
      <div>
        <label className="block text-sm font-medium mb-1.5 text-foreground/90">{label}</label>
        <div className={cn(
          'relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center transition-all group',
          aspect === '16:9' ? 'w-full aspect-video' : 'aspect-[3/4] w-full max-w-[220px] mx-auto'
        )}>
          {url ? (
            <>
              <img src={url} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                <button type="button" onClick={() => setLightboxUrl(url)} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105">
                  <Eye className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => document.getElementById(id)?.click()} className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105">
                  <Upload className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setValue(field, '', { shouldValidate: true })} className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full border border-red-500/30 transition-all hover:scale-105">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div onClick={() => document.getElementById(id)?.click()} className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl hover:bg-muted/20 transition-all w-full h-full">
              {isUploading && cropModalData?.field === field ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/60 mb-2 group-hover:text-primary transition-colors" />
              )}
              <p className="text-xs font-semibold text-white/90 text-center">
                {isUploading && cropModalData?.field === field ? 'Uploading...' : `Upload ${label}`}
              </p>
            </div>
          )}
        </div>
        <input type="file" id={id} onChange={(e) => handleFileSelect(e, field)} accept="image/*" className="hidden" />
        <input type="hidden" {...register(field)} />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-5 border-b border-border">
          <div className="flex items-center gap-4">
            <Link href="/series" className="p-2 border border-border rounded-xl hover:bg-muted transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Add New Episode</h1>
              <p className="text-sm text-muted-foreground">Fill in the details to publish a new episode.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="bg-brand-gradient text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Publishing...' : 'Publish Episode'}
            </button>
          </div>
        </div>

        {/* ── Two-column layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: General + Media ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* General Information */}
            <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Info className="w-5 h-5" /> General Information
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Season ID" error={errors.season_id?.message}>
                  <input
                    type="number" min={1}
                    {...register('season_id', { valueAsNumber: true })}
                    placeholder="e.g. 1"
                    className={inputCls(!!errors.season_id)}
                  />
                </Field>
                <Field label="Episode Number" error={errors.episode_number?.message}>
                  <input
                    type="number" min={1}
                    {...register('episode_number', { valueAsNumber: true })}
                    className={inputCls(!!errors.episode_number)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Title" error={errors.title?.message}>
                  <input {...register('title')} placeholder="e.g. Journey Of Ashwin Episode 1" className={inputCls(!!errors.title)} />
                </Field>
                <Field label="Slug" error={errors.slug?.message}>
                  <input {...register('slug')} placeholder="auto-generated from title" className={inputCls(!!errors.slug)} />
                </Field>
              </div>

              <Field label="Short Description" error={errors.description_short?.message}>
                <RichTextEditor
                  value={watch('description_short') || ''}
                  onChange={(val) => setValue('description_short', val, { shouldValidate: true })}
                  placeholder="Brief episode summary..."
                />
              </Field>

              <Field label="Long Description" error={errors.description_long?.message}>
                <RichTextEditor
                  value={watch('description_long') || ''}
                  onChange={(val) => setValue('description_long', val, { shouldValidate: true })}
                  placeholder="Detailed episode description..."
                />
              </Field>
            </section>

            {/* Media & Content */}
            <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Film className="w-5 h-5" /> Media & Content
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Video URL" error={errors.url?.message}>
                  <input {...register('url')} placeholder="https://iframe.mediadelivery.net/embed/..." className={inputCls(!!errors.url)} />
                </Field>
                <Field label="Trailer URL" error={errors.trailer_url?.message}>
                  <input {...register('trailer_url')} placeholder="https://..." className={inputCls(!!errors.trailer_url)} />
                </Field>
              </div>

              <Field label="Trailer Alt Text">
                <input {...register('trailer_alt')} placeholder="e.g. Episode 1 Official Trailer" className={inputCls()} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImageUploader field="poster_image" id="ep-poster-upload" label="Poster Image (16:9)" aspect="16:9" />
                <ImageUploader field="card_image" id="ep-card-upload" label="Card Image (3:4)" aspect="3:4" />
              </div>

              <Field label="Poster Alt Text">
                <input {...register('poster_alt')} placeholder="e.g. Episode 1 Poster" className={inputCls()} />
              </Field>
            </section>
          </div>

          {/* ── RIGHT: Properties sidebar ────────────────────────────────── */}
          <div className="space-y-8">
            <section className="bg-card border border-border rounded-2xl p-6 space-y-6">
              <h3 className="text-lg font-semibold border-b border-border pb-2">Properties</h3>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Duration" error={errors.duration?.message}>
                  <input {...register('duration')} placeholder="e.g. 45 min" className={inputCls(!!errors.duration)} />
                </Field>
                <Field label="Rating (0–10)" error={errors.rating?.message}>
                  <input type="number" step="0.1" min="0" max="10"
                    {...register('rating', { valueAsNumber: true })}
                    className={inputCls(!!errors.rating)}
                  />
                </Field>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Languages</label>
                {availableLanguages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
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
                            'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-200',
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary shadow-sm'
                              : 'bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                          )}
                        >
                          <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center border transition-all', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent')}>
                            {isSelected && <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                          </div>
                          {lang.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input {...register('languages')} placeholder="e.g. Tamil, Hindi, English" className={inputCls()} />
                )}
              </div>
            </section>

            {/* Toggles */}
            <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Featured Episode</label>
                <input type="checkbox" {...register('featured')} className="w-5 h-5 rounded border-border accent-primary" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Free for All</label>
                <input type="checkbox" {...register('free')} className="w-5 h-5 rounded border-border accent-primary" />
              </div>
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-xl w-full rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Image Preview</span>
              <button type="button" onClick={() => setLightboxUrl(null)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/40 max-h-[70vh]">
              <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
