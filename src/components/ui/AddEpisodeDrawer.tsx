 'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X,
  Save,
  Loader2,
  Film,
  Info,
  Image as ImageIcon,
  Upload,
  Eye,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { episodeService, EpisodePayload } from '@/services/episodeService';
import { languageService, Language } from '@/services/languageService';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

/* ─── Zod Schema ─────────────────────────────────────────────────────────── */
const schema = z.object({
  season_id: z.number({ message: 'Season is required' }).min(1, 'Season is required'),
  episode_number: z.number().min(1, 'Episode number must be at least 1'),
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description_short: z.string().min(5, 'Short description is required'),
  description_long: z.string().min(10, 'Long description is required'),
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

/* ─── Slugify helper ─────────────────────────────────────────────────────── */
const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');

/* ─── Props ──────────────────────────────────────────────────────────────── */
interface AddEpisodeDrawerProps {
  isOpen: boolean;
  defaultSeasonId?: number;
  seasonIds: number[];
  onClose: () => void;
  onCreated: () => void;
}

export default function AddEpisodeDrawer({
  isOpen,
  defaultSeasonId,
  seasonIds,
  onClose,
  onCreated,
}: AddEpisodeDrawerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [cropModalData, setCropModalData] = useState<{
    file: File;
    field: 'poster_image' | 'card_image';
    aspectRatio: number;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const seasonDropdownRef = React.useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      season_id: defaultSeasonId ?? (seasonIds[0] ?? 0),
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
  const selectedSeasonId = watch('season_id');

  // Auto-generate slug from title
  useEffect(() => {
    if (titleValue) setValue('slug', slugify(titleValue), { shouldValidate: true });
  }, [titleValue, setValue]);

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      reset({
        season_id: defaultSeasonId ?? (seasonIds[0] ?? 0),
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
        title: '',
        slug: '',
        description_short: '',
        description_long: '',
        duration: '',
        url: '',
      });
      setSelectedLanguages([]);
    }
  }, [isOpen, defaultSeasonId, seasonIds, reset]);

  // Update season_id when defaultSeasonId changes
  useEffect(() => {
    if (defaultSeasonId) setValue('season_id', defaultSeasonId);
  }, [defaultSeasonId, setValue]);

  // Fetch languages
  useEffect(() => {
    languageService.getAll().then(setAvailableLanguages).catch(console.error);
  }, []);

  // Close season dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (seasonDropdownRef.current && !seasonDropdownRef.current.contains(e.target as Node)) {
        setSeasonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'poster_image' | 'card_image'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const aspectRatio = field === 'poster_image' ? 16 / 9 : 3 / 4;
    setCropModalData({ file, field, aspectRatio });
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!cropModalData) return;
    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-image.jpg');
    setIsUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; message: string; url: string }>(
        '/upload-image',
        formData,
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

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: EpisodePayload = {
        season_id: data.season_id,
        episode_number: data.episode_number,
        title: data.title,
        slug: data.slug,
        description_short: data.description_short,
        description_long: data.description_long,
        duration: data.duration,
        languages: data.languages || '',
        url: data.url,
        trailer_url: data.trailer_url || '',
        trailer_alt: data.trailer_alt || `${data.title} trailer`,
        poster_image: data.poster_image || '',
        card_image: data.card_image || '',
        poster_alt: data.poster_alt || data.title,
        rating: data.rating,
        featured: data.featured,
        free: data.free,
      };
      await episodeService.create(payload);
      onCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create episode:', err);
      alert(err.response?.data?.message || 'Failed to create episode. Please try again.');
    }
  };

  if (!isOpen) return null;

  const inputCls = (hasError?: boolean) =>
    cn(
      'w-full bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white transition-all',
      hasError && 'border-destructive ring-destructive/20'
    );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-xl bg-card border-l border-border z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">Add New Episode</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below to publish.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* ── Season & Episode Number ─── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Info className="w-4 h-4" /> Basic Info
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Season picker */}
              <div ref={seasonDropdownRef} className="relative">
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Season ID</label>
                <button
                  type="button"
                  onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                  className="w-full flex items-center justify-between bg-muted/50 border border-border rounded-xl px-4 py-2.5 text-sm text-white hover:bg-muted/80 transition-all"
                >
                  <span>Season {selectedSeasonId || '—'}</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', seasonDropdownOpen && 'rotate-180')} />
                </button>
                {seasonDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-2xl z-30 py-1 overflow-hidden">
                    {seasonIds.length > 0 ? (
                      seasonIds.map((sid) => (
                        <button
                          key={sid}
                          type="button"
                          onClick={() => {
                            setValue('season_id', sid, { shouldValidate: true });
                            setSeasonDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-4 py-2 text-sm transition-colors',
                            selectedSeasonId === sid
                              ? 'text-primary font-semibold bg-primary/10'
                              : 'text-muted-foreground hover:text-white hover:bg-muted/50'
                          )}
                        >
                          Season {sid}
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-sm text-muted-foreground">No seasons available</p>
                    )}
                  </div>
                )}
                {errors.season_id && (
                  <p className="text-xs text-destructive mt-1">{errors.season_id.message}</p>
                )}
              </div>

              {/* Episode number */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Episode No.</label>
                <input
                  type="number"
                  min={1}
                  {...register('episode_number', { valueAsNumber: true })}
                  className={inputCls(!!errors.episode_number)}
                />
                {errors.episode_number && (
                  <p className="text-xs text-destructive mt-1">{errors.episode_number.message}</p>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Title</label>
              <input
                {...register('title')}
                placeholder="e.g. Journey Of Ashwin Episode 1"
                className={inputCls(!!errors.title)}
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Slug</label>
              <input
                {...register('slug')}
                placeholder="auto-generated from title"
                className={inputCls(!!errors.slug)}
              />
              {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>}
            </div>

            {/* Short Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Short Description</label>
              <RichTextEditor
                value={watch('description_short') || ''}
                onChange={(val) => setValue('description_short', val, { shouldValidate: true })}
                placeholder="Brief episode summary..."
              />
              {errors.description_short && (
                <p className="text-xs text-destructive mt-1">{errors.description_short.message}</p>
              )}
            </div>

            {/* Long Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Long Description</label>
              <RichTextEditor
                value={watch('description_long') || ''}
                onChange={(val) => setValue('description_long', val, { shouldValidate: true })}
                placeholder="Detailed episode description..."
              />
              {errors.description_long && (
                <p className="text-xs text-destructive mt-1">{errors.description_long.message}</p>
              )}
            </div>
          </section>

          {/* ── Media & URLs ─── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Film className="w-4 h-4" /> Media & Content
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Video URL</label>
              <input
                {...register('url')}
                placeholder="https://iframe.mediadelivery.net/embed/..."
                className={inputCls(!!errors.url)}
              />
              {errors.url && <p className="text-xs text-destructive mt-1">{errors.url.message}</p>}
            </div>

            {/* Trailer URL + Alt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Trailer URL</label>
                <input
                  {...register('trailer_url')}
                  placeholder="https://..."
                  className={inputCls(!!errors.trailer_url)}
                />
                {errors.trailer_url && (
                  <p className="text-xs text-destructive mt-1">{errors.trailer_url.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Trailer Alt</label>
                <input
                  {...register('trailer_alt')}
                  placeholder="e.g. Official Trailer"
                  className={inputCls()}
                />
              </div>
            </div>

            {/* Poster Image */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Poster Image (16:9)</label>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center group/poster">
                {posterImageUrl ? (
                  <>
                    <img src={posterImageUrl} alt="Poster" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/poster:opacity-100 transition-all flex items-center justify-center gap-3">
                      <button type="button" onClick={() => setLightboxUrl(posterImageUrl)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => document.getElementById('ep-poster-upload')?.click()} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all">
                        <Upload className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setValue('poster_image', '', { shouldValidate: true })} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full border border-red-500/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => document.getElementById('ep-poster-upload')?.click()} className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl">
                    {isUploading && cropModalData?.field === 'poster_image' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/60 mb-1" />
                    )}
                    <p className="text-xs font-semibold text-white/80">
                      {isUploading && cropModalData?.field === 'poster_image' ? 'Uploading...' : 'Upload Poster (16:9)'}
                    </p>
                  </div>
                )}
              </div>
              <input type="file" id="ep-poster-upload" onChange={(e) => handleFileSelect(e, 'poster_image')} accept="image/*" className="hidden" />
              <input type="hidden" {...register('poster_image')} />
            </div>

            {/* Card Image */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Card Image (3:4)</label>
              <div className="relative w-full max-h-40 aspect-[3/4] rounded-xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center group/card">
                {cardImageUrl ? (
                  <>
                    <img src={cardImageUrl} alt="Card" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/card:opacity-100 transition-all flex items-center justify-center gap-3">
                      <button type="button" onClick={() => setLightboxUrl(cardImageUrl)} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => document.getElementById('ep-card-upload')?.click()} className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all">
                        <Upload className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => setValue('card_image', '', { shouldValidate: true })} className="p-2.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full border border-red-500/30 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div onClick={() => document.getElementById('ep-card-upload')?.click()} className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl">
                    {isUploading && cropModalData?.field === 'card_image' ? (
                      <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/60 mb-1" />
                    )}
                    <p className="text-xs font-semibold text-white/80">
                      {isUploading && cropModalData?.field === 'card_image' ? 'Uploading...' : 'Upload Card (3:4)'}
                    </p>
                  </div>
                )}
              </div>
              <input type="file" id="ep-card-upload" onChange={(e) => handleFileSelect(e, 'card_image')} accept="image/*" className="hidden" />
              <input type="hidden" {...register('card_image')} />
            </div>

            {/* Poster Alt */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-foreground/90">Poster Alt Text</label>
              <input {...register('poster_alt')} placeholder="e.g. Episode 1 Poster" className={inputCls()} />
            </div>
          </section>

          {/* ── Properties ─── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm border-t border-border pt-4">
              <Info className="w-4 h-4" /> Properties
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Duration</label>
                <input {...register('duration')} placeholder="e.g. 45 min" className={inputCls(!!errors.duration)} />
                {errors.duration && <p className="text-xs text-destructive mt-1">{errors.duration.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-foreground/90">Rating (0–10)</label>
                <input type="number" step="0.1" min="0" max="10" {...register('rating', { valueAsNumber: true })} className={inputCls(!!errors.rating)} />
                {errors.rating && <p className="text-xs text-destructive mt-1">{errors.rating.message}</p>}
              </div>
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
                          'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border/80 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                        )}
                      >
                        <div className={cn('w-3 h-3 rounded flex items-center justify-center border transition-all', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30')}>
                          {isSelected && <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
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

            {/* Toggles */}
            <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Featured Episode</label>
                <input type="checkbox" {...register('featured')} className="w-4 h-4 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Free for All</label>
                <input type="checkbox" {...register('free')} className="w-4 h-4 rounded" />
              </div>
            </div>
          </section>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || isUploading}
            className="bg-brand-gradient text-white px-6 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Publishing...' : 'Publish Episode'}
          </button>
        </div>
      </div>

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
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-sm font-semibold">Image Preview</span>
              <button onClick={() => setLightboxUrl(null)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center bg-black/30 max-h-[70vh]">
              <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
