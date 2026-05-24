'use client';

import React, { useEffect, useState } from 'react';
import { Globe, Loader2, Film, X, Calendar, Clock, Eye, EyeOff, Plus, Edit, Trash2, Save } from 'lucide-react';
import { languageService, Language } from '@/services/languageService';
import { Movie } from '@/services/movieService';
import { cn } from '@/lib/utils';

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail drawer state for movies
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(false);

  // Modal state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formIsVisible, setFormIsVisible] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await languageService.getAll(true); // Fetch all including hidden
      setLanguages(data || []);
    } catch (err: any) {
      console.error('Failed to fetch languages:', err);
      setError('Could not load languages. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLanguage = async (lang: Language) => {
    setSelectedLanguage(lang);
    setIsLoadingMovies(true);
    setMovies([]);
    try {
      const response = await languageService.getMoviesByLanguage(lang.slug);
      setMovies(response.movies || []);
    } catch (err) {
      console.error(`Failed to fetch movies for language ${lang.slug}:`, err);
      setMovies([]);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLanguage(null);
    setFormName('');
    setFormCode('');
    setFormIsVisible(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (lang: Language, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the movie drawer
    setEditingLanguage(lang);
    setFormName(lang.name);
    setFormCode(lang.code);
    setFormIsVisible(lang.is_visible);
    setIsModalOpen(true);
  };

  const handleDeleteLanguage = async (lang: Language, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the movie drawer
    if (!window.confirm(`Are you sure you want to delete ${lang.name}?`)) return;

    try {
      await languageService.delete(lang.id);
      setLanguages(prev => prev.filter(l => l.id !== lang.id));
      if (selectedLanguage?.id === lang.id) {
        setSelectedLanguage(null);
      }
    } catch (err) {
      console.error('Failed to delete language:', err);
      alert('Failed to delete language. Please try again.');
    }
  };

  const handleToggleVisibility = async (lang: Language, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the movie drawer
    try {
      const updated = await languageService.update(lang.id, { is_visible: !lang.is_visible });
      setLanguages(prev => prev.map(l => l.id === lang.id ? updated : l));
      if (selectedLanguage?.id === lang.id) {
        setSelectedLanguage(prev => prev ? { ...prev, is_visible: updated.is_visible } : null);
      }
    } catch (err) {
      console.error('Failed to update language visibility:', err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingLanguage) {
        // Update action
        const updated = await languageService.update(editingLanguage.id, {
          name: formName.trim(),
          code: formCode.trim(),
          is_visible: formIsVisible
        });
        setLanguages(prev => prev.map(l => l.id === editingLanguage.id ? updated : l));
      } else {
        // Create action
        const created = await languageService.create({
          name: formName.trim(),
          code: formCode.trim(),
          is_visible: formIsVisible
        });
        setLanguages(prev => [...prev, created]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save language:', err);
      alert('Failed to save language. Please verify the code/name are valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 relative min-h-[calc(100vh-80px)]">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Languages</h1>
          <p className="text-muted-foreground mt-1">Manage content languages, visibility, and discover associated movies.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Language
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      {/* Grid of Languages */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {languages.length > 0 ? (
            languages.map((lang) => (
              <div 
                key={lang.slug} 
                onClick={() => handleSelectLanguage(lang)}
                className={cn(
                  "bg-card border border-border rounded-2xl p-6 hover:border-primary/50 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5 group relative",
                  !lang.is_visible && "opacity-75 hover:opacity-100"
                )}
              >
                {/* Visual Visibility Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded tracking-wide uppercase",
                    lang.is_visible ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400 border border-zinc-700/50"
                  )}>
                    {lang.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <h3 className="font-bold text-xl mt-4 text-white group-hover:text-primary transition-colors flex items-center gap-2">
                  {lang.name}
                  <span className="text-xs font-normal text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md">
                    {lang.code}
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Slug: {lang.slug}</p>
                
                {/* Actions bottom row */}
                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleVisibility(lang, e)}
                      className={cn(
                        "p-2 rounded-lg border border-border hover:bg-muted transition-colors",
                        lang.is_visible ? "text-emerald-500 hover:text-emerald-400" : "text-muted-foreground hover:text-white"
                      )}
                      title={lang.is_visible ? "Hide Language" : "Show Language"}
                    >
                      {lang.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={(e) => handleOpenEditModal(lang, e)}
                      className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Edit Details"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteLanguage(lang, e)}
                      className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Language"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    View Movies →
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-muted/20 border border-dashed border-border rounded-3xl">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold text-white">No languages found</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Click "Add Language" to set up your first content language.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Slide Drawer for Movies */}
      {selectedLanguage && (
        <>
          <div 
            onClick={() => setSelectedLanguage(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          />

          <div className="fixed top-0 right-0 h-screen w-full max-w-md bg-card/95 border-l border-border/80 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLanguage.name} Movies</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Showing all titles matching language "{selectedLanguage.name}"</p>
              </div>
              <button 
                onClick={() => setSelectedLanguage(null)}
                className="p-2 hover:bg-muted text-muted-foreground hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingMovies ? (
                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Fetching titles...</p>
                </div>
              ) : movies.length > 0 ? (
                movies.map((movie) => (
                  <div 
                    key={movie.id} 
                    className="flex gap-4 p-3 bg-muted/30 border border-border/50 rounded-xl hover:border-primary/30 transition-colors"
                  >
                    <div className="w-16 h-24 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={movie.media?.image?.url || 'https://via.placeholder.com/150'} 
                        alt={movie.movie_name || movie.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                      <div>
                        <h4 className="font-semibold text-sm text-white truncate">{movie.movie_name || movie.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1 font-medium">
                            <Calendar className="w-3 h-3" />
                            {movie.release_date ? movie.release_date.split('-')[0] : (movie.releaseYear || 'N/A')}
                          </span>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            {movie.duration || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">
                          Rating: {movie.rating || 'N/A'}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                          <Eye className="w-3.5 h-3.5" />
                          {movie.viewCount || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-muted/10 border border-dashed border-border rounded-2xl">
                  <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                  <h4 className="font-semibold text-white">No movies found</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try updating or creating a movie in the Movie section with this language tag.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add / Edit Dialog Modal */}
      {isModalOpen && (
        <>
          <div 
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-xl font-bold text-white">
                {editingLanguage ? `Edit Language: ${editingLanguage.name}` : 'Add New Language'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5 mt-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language Name</label>
                <input 
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tamil"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Language Code</label>
                <input 
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. ta"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium">Visible to Users</label>
                <button
                  type="button"
                  onClick={() => setFormIsVisible(!formIsVisible)}
                  className={cn(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    formIsVisible ? "bg-primary" : "bg-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      formIsVisible ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Language'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
