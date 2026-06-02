'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { posterService, Poster } from '@/services/posterService';
import { languageService, Language } from '@/services/languageService';
import { genreService, Genre } from '@/services/genreService';
import { movieService, Movie } from '@/services/movieService';
import { interactiveMovieService, InteractiveMovie } from '@/services/interactiveMovieService';
import apiClient from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Save, 
  Check, 
  Info,
  Image as ImageIcon,
  Upload,
  Eye,
  Play,
  ExternalLink,
  Film,
  Globe,
  Tag,
  MonitorPlay,
  Layers
} from 'lucide-react';

export default function PostersPage() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [filterPageType, setFilterPageType] = useState<string>('');
  const [filterLanguage, setFilterLanguage] = useState<string>('');

  // Dropdown options
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
  const [availableMovies, setAvailableMovies] = useState<Movie[]>([]);
  const [availableInteractiveMovies, setAvailableInteractiveMovies] = useState<InteractiveMovie[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);

  // Form states - Add/Edit common
  const [posterTitle, setPosterTitle] = useState('');
  const [description, setDescription] = useState('');
  const [path, setPath] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [link, setLink] = useState('');
  const [pageType, setPageType] = useState<'home' | 'movies' | 'series' | 'interactive' | 'language'>('home');
  const [referenceType, setReferenceType] = useState<'movie' | 'series' | 'interactive' | 'none'>('none');
  const [referenceId, setReferenceId] = useState<number | undefined>(undefined);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [status, setStatus] = useState<'A' | 'I'>('A');

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Custom Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalTitle, setDeleteModalTitle] = useState('');
  const [deleteModalMessage, setDeleteModalMessage] = useState('');
  const [onDeleteConfirm, setOnDeleteConfirm] = useState<(() => void) | null>(null);

  useEffect(() => {
    fetchPosters();
    fetchDependencies();
  }, [filterPageType, filterLanguage]);

  const fetchPosters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: { page_type?: string; language?: string } = {};
      if (filterPageType) filters.page_type = filterPageType;
      if (filterLanguage) filters.language = filterLanguage;

      const data = await posterService.getAll(filters);
      setPosters(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch posters:', err);
      setError('Failed to load posters list.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      // Fetch languages
      const langs = await languageService.getAll();
      setAvailableLanguages(langs || []);

      // Fetch genres
      const genrs = await genreService.getAll();
      setAvailableGenres(genrs || []);

      // Fetch movies & web series
      const mvs = await movieService.getAll();
      setAvailableMovies(mvs || []);

      // Fetch interactive movies
      const imvs = await interactiveMovieService.getAll();
      setAvailableInteractiveMovies(imvs || []);
    } catch (err) {
      console.error('Failed to fetch dependencies:', err);
    }
  };

  const resolveImagePath = (imgPath: string) => {
    if (!imgPath) return '';
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const host = apiBase.replace(/\/api$/, '');
    return `${host}/${imgPath.startsWith('/') ? imgPath.slice(1) : imgPath}`;
  };

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteModalTitle(title);
    setDeleteModalMessage(message);
    setOnDeleteConfirm(() => onConfirm);
    setIsDeleteModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setPosterTitle('');
    setDescription('');
    setPath('');
    setTrailerUrl('');
    setLink('');
    setPageType('home');
    setReferenceType('none');
    setReferenceId(undefined);
    setSelectedLanguages([]);
    setSelectedGenres([]);
    setStatus('A');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (poster: Poster) => {
    setEditingPoster(poster);
    setPosterTitle(poster.poster_title || '');
    setDescription(poster.description || '');
    setPath(poster.path || '');
    setTrailerUrl(poster.trailer_url || '');
    setLink(poster.link || '');
    setPageType(poster.page_type || 'home');
    setReferenceType(poster.reference_type || 'none');
    setReferenceId(poster.reference_id);
    
    // Parse comma separated strings to arrays
    const langs = poster.languages ? poster.languages.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedLanguages(langs);
    
    const genrs = poster.genres_list ? poster.genres_list.split(',').map(s => s.trim()).filter(Boolean) : [];
    setSelectedGenres(genrs);

    setStatus(poster.status === 'A' ? 'A' : 'I');
    setIsEditModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; message: string; url: string }>(
        '/upload-image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      );
      if (res.data.status && res.data.url) {
        setPath(res.data.url);
      } else {
        alert(res.data.message || 'Image upload failed.');
      }
    } catch (err: any) {
      console.error('Image upload error:', err);
      alert(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleSaveAddPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterTitle.trim() || !path.trim()) {
      alert('Title and Poster Image Path are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Poster> = {
        poster_title: posterTitle.trim(),
        description: description.trim(),
        path: path.trim(),
        languages: selectedLanguages.join(', '),
        genres_list: selectedGenres.join(', '),
        page_type: pageType,
        status: status,
      };

      if (trailerUrl.trim()) payload.trailer_url = trailerUrl.trim();
      if (link.trim()) payload.link = link.trim();
      if (referenceType !== 'none') {
        payload.reference_type = referenceType;
        if (referenceId) payload.reference_id = referenceId;
      } else {
        payload.reference_type = 'none';
        payload.reference_id = undefined;
      }

      const created = await posterService.create(payload);
      setPosters(prev => [created, ...prev]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create poster:', err);
      alert('Failed to create poster: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditPoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPoster) return;
    if (!posterTitle.trim() || !path.trim()) {
      alert('Title and Poster Image Path are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Poster> = {
        poster_title: posterTitle.trim(),
        description: description.trim(),
        path: path.trim(),
        languages: selectedLanguages.join(', '),
        genres_list: selectedGenres.join(', '),
        page_type: pageType,
        status: status,
        trailer_url: trailerUrl.trim() || undefined,
        link: link.trim() || undefined,
        reference_type: referenceType,
        reference_id: referenceType !== 'none' ? referenceId : undefined,
      };

      const updated = await posterService.update(editingPoster.poster_id, payload);
      setPosters(prev => prev.map(p => p.poster_id === editingPoster.poster_id ? updated : p));
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update poster:', err);
      alert('Failed to update poster: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePoster = (poster: Poster) => {
    confirmDelete(
      'Delete Banner Poster',
      `Are you sure you want to permanently delete the banner poster "${poster.poster_title}"? This action cannot be undone.`,
      async () => {
        try {
          await posterService.delete(poster.poster_id);
          setPosters(prev => prev.filter(p => p.poster_id !== poster.poster_id));
        } catch (err: any) {
          console.error('Failed to delete poster:', err);
          alert('Could not delete banner poster.');
        }
      }
    );
  };

  const handleLanguageToggle = (langName: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langName) 
        ? prev.filter(l => l !== langName) 
        : [...prev, langName]
    );
  };

  const handleGenreToggle = (genreName: string) => {
    setSelectedGenres(prev => 
      prev.includes(genreName) 
        ? prev.filter(g => g !== genreName) 
        : [...prev, genreName]
    );
  };

  const columns: ColumnDef<Poster>[] = [
    {
      accessorKey: 'path',
      header: 'Banner',
      cell: ({ row }) => {
        const resolvedUrl = resolveImagePath(row.original.path);
        return (
          <div className="w-28 h-16 bg-muted rounded-xl overflow-hidden relative border border-border/50 group cursor-pointer" onClick={() => resolvedUrl && setLightboxUrl(resolvedUrl)}>
            {row.original.path ? (
              <>
                <img 
                  src={resolvedUrl} 
                  alt={row.original.poster_title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                No Image
              </div>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: 'poster_title',
      header: 'Poster Details',
      cell: ({ row }) => (
        <div className="max-w-[280px]">
          <div className="font-semibold text-white truncate" title={row.original.poster_title}>
            {row.original.poster_title}
          </div>
          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5" title={row.original.description}>
            {row.original.description || 'No description'}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'page_type',
      header: 'Page / Type',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1">
          <span className="capitalize text-xs font-semibold text-primary bg-primary/10 border border-primary/15 px-2 py-0.5 rounded-md w-fit">
            {row.original.page_type}
          </span>
          {row.original.reference_type && row.original.reference_type !== 'none' && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              Ref: <span className="font-mono text-white/80">{row.original.reference_type} ({row.original.reference_id})</span>
            </span>
          )}
        </div>
      )
    },
    {
      accessorKey: 'languages',
      header: 'Languages / Genres',
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 max-w-[200px]">
          {row.original.languages ? (
            <div className="flex items-center gap-1 text-xs text-white/85 truncate" title={row.original.languages}>
              <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {row.original.languages}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No languages</span>
          )}
          {row.original.genres_list ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate" title={row.original.genres_list}>
              <Tag className="w-3 h-3 text-muted-foreground shrink-0" />
              {row.original.genres_list}
            </div>
          ) : null}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const active = row.original.status === 'A';
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
            active 
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15" 
              : "bg-muted text-muted-foreground border-border"
          )}>
            {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenEditModal(row.original)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
            title="Edit Banner"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeletePoster(row.original)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Delete Banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Helper to render dynamic reference selector
  const renderReferenceSelector = () => {
    if (referenceType === 'none') return null;

    if (referenceType === 'movie' || referenceType === 'series') {
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select Reference Movie/Series</label>
          <select
            value={referenceId || ''}
            onChange={(e) => setReferenceId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
            required
          >
            <option value="">-- Select Movie/Series --</option>
            {availableMovies.map((mv) => (
              <option key={mv.id} value={mv.id}>
                [{mv.id}] {mv.movie_name || mv.title}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (referenceType === 'interactive') {
      return (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Select Interactive Movie</label>
          <select
            value={referenceId || ''}
            onChange={(e) => setReferenceId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
            required
          >
            <option value="">-- Select Interactive Movie --</option>
            {availableInteractiveMovies.map((imv) => (
              <option key={imv.interactive_movie_id} value={imv.interactive_movie_id}>
                [{imv.interactive_movie_id}] {imv.title}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 text-white">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banner Posters</h1>
          <p className="text-muted-foreground">Manage promo banners, slider posters, and promotional content pages.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddModal}
            className="bg-brand-gradient text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Banner
          </button>
          <button 
            onClick={fetchPosters}
            className="p-2 hover:bg-muted rounded-xl border border-border/80 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-4 bg-card border border-border p-4 rounded-2xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MonitorPlay className="w-4 h-4" />
          <span>Page Type:</span>
          <select 
            value={filterPageType}
            onChange={(e) => setFilterPageType(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-1 ring-primary/20"
          >
            <option value="">All Pages</option>
            <option value="home">Home</option>
            <option value="movies">Movies</option>
            <option value="series">Web Series</option>
            <option value="interactive">Interactive</option>
            <option value="language">Language</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>Language:</span>
          <select 
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="bg-background border border-border rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-1 ring-primary/20"
          >
            <option value="">All Languages</option>
            {availableLanguages.map(lang => (
              <option key={lang.slug} value={lang.name}>{lang.name}</option>
            ))}
          </select>
        </div>

        {(filterPageType || filterLanguage) && (
          <button 
            onClick={() => { setFilterPageType(''); setFilterLanguage(''); }}
            className="text-xs text-primary hover:underline flex items-center gap-1 ml-auto"
          >
            <X className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* DATA TABLE */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading banner posters list...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={posters} searchPlaceholder="Search by title, description..." />
      )}

      {/* --- ADD MODAL --- */}
      {isAddModalOpen && (
        <>
          <div 
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Add New Banner Poster
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddPoster} className="space-y-4 mt-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Poster Title</label>
                <input 
                  type="text"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                  placeholder="e.g. Journey to Everwyn"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the banner content..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                />
              </div>

              {/* Layout Types & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Page Placement</label>
                  <select
                    value={pageType}
                    onChange={(e) => setPageType(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="home">Home</option>
                    <option value="movies">Movies</option>
                    <option value="series">Web Series</option>
                    <option value="interactive">Interactive</option>
                    <option value="language">Language</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="A">Active (A)</option>
                    <option value="I">Inactive (I)</option>
                  </select>
                </div>
              </div>

              {/* Banner Path / File Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Poster Image Path / URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="https://... or choose file to upload"
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      id="add-file-upload" 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => document.getElementById('add-file-upload')?.click()}
                      className="h-full bg-muted border border-border hover:bg-muted/80 text-white px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Trailer URL & Link */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Trailer URL (Optional)</label>
                  <input 
                    type="text"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://vtaguprime.b-cdn.net/trailers/..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Action Link / Path (Optional)</label>
                  <input 
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. /interactive/2"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              {/* Reference Linking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Reference Type</label>
                  <select
                    value={referenceType}
                    onChange={(e) => {
                      setReferenceType(e.target.value as any);
                      setReferenceId(undefined);
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="none">None</option>
                    <option value="movie">Movie</option>
                    <option value="series">Web Series</option>
                    <option value="interactive">Interactive Content</option>
                  </select>
                </div>

                {renderReferenceSelector()}
              </div>

              {/* Languages Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Languages</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-background border border-border/80 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                  {availableLanguages.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.name);
                    return (
                      <button
                        key={lang.slug}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.name)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 text-left',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/55'
                        )}
                      >
                        <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent')}>
                          {isSelected && <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                        </div>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Genres</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-background border border-border/80 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.genre_name);
                    return (
                      <button
                        key={genre.genre_id}
                        type="button"
                        onClick={() => handleGenreToggle(genre.genre_name)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 text-left',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/55'
                        )}
                      >
                        <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent')}>
                          {isSelected && <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                        </div>
                        <span className="truncate">{genre.genre_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Creating...' : 'Create Poster'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingPoster && (
        <>
          <div 
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Poster: {editingPoster.poster_title}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPoster} className="space-y-4 mt-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Poster Title</label>
                <input 
                  type="text"
                  value={posterTitle}
                  onChange={(e) => setPosterTitle(e.target.value)}
                  placeholder="e.g. Journey to Everwyn"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the banner content..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                />
              </div>

              {/* Layout Types & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Page Placement</label>
                  <select
                    value={pageType}
                    onChange={(e) => setPageType(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="home">Home</option>
                    <option value="movies">Movies</option>
                    <option value="series">Web Series</option>
                    <option value="interactive">Interactive</option>
                    <option value="language">Language</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="A">Active (A)</option>
                    <option value="I">Inactive (I)</option>
                  </select>
                </div>
              </div>

              {/* Banner Path / File Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground block">Poster Image Path / URL</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder="https://... or choose file to upload"
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                  <div className="relative">
                    <input 
                      type="file" 
                      id="edit-file-upload" 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => document.getElementById('edit-file-upload')?.click()}
                      className="h-full bg-muted border border-border hover:bg-muted/80 text-white px-4 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Trailer URL & Link */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Trailer URL (Optional)</label>
                  <input 
                    type="text"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    placeholder="https://vtaguprime.b-cdn.net/trailers/..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Action Link / Path (Optional)</label>
                  <input 
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g. /interactive/2"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              {/* Reference Linking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Reference Type</label>
                  <select
                    value={referenceType}
                    onChange={(e) => {
                      setReferenceType(e.target.value as any);
                      setReferenceId(undefined);
                    }}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
                  >
                    <option value="none">None</option>
                    <option value="movie">Movie</option>
                    <option value="series">Web Series</option>
                    <option value="interactive">Interactive Content</option>
                  </select>
                </div>

                {renderReferenceSelector()}
              </div>

              {/* Languages Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Languages</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-background border border-border/80 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                  {availableLanguages.map((lang) => {
                    const isSelected = selectedLanguages.includes(lang.name);
                    return (
                      <button
                        key={lang.slug}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.name)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 text-left',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/55'
                        )}
                      >
                        <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent')}>
                          {isSelected && <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                        </div>
                        <span className="truncate">{lang.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Genres Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">Genres</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-background border border-border/80 p-3 rounded-xl max-h-[140px] overflow-y-auto">
                  {availableGenres.map((genre) => {
                    const isSelected = selectedGenres.includes(genre.genre_name);
                    return (
                      <button
                        key={genre.genre_id}
                        type="button"
                        onClick={() => handleGenreToggle(genre.genre_name)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 text-left',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/55'
                        )}
                      >
                        <div className={cn('w-3.5 h-3.5 rounded flex items-center justify-center border transition-all shrink-0', isSelected ? 'border-primary bg-primary text-white' : 'border-muted-foreground/30 bg-transparent')}>
                          {isSelected && <svg className="w-2 h-2 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                        </div>
                        <span className="truncate">{genre.genre_name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <>
          <div 
            onClick={() => setIsDeleteModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-[60] animate-in zoom-in-95 duration-200 text-white font-sans">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <Info className="w-6 h-6 animate-pulse" />
              <h3 className="text-lg font-bold">{deleteModalTitle}</h3>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {deleteModalMessage}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  if (onDeleteConfirm) onDeleteConfirm();
                  setIsDeleteModalOpen(false);
                }}
                className="bg-destructive hover:bg-destructive/90 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* LIGHTBOX FOR PREVIEWS */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div onClick={(e) => e.stopPropagation()} className="relative max-w-4xl w-full rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Poster Image Preview</span>
              <button type="button" onClick={() => setLightboxUrl(null)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 max-h-[80vh]">
              <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
