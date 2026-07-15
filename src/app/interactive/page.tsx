'use client';

import React, { useEffect, useState } from 'react';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Edit, 
  Play, 
  Save, 
  Clock, 
  ChevronRight, 
  X, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Film, 
  ArrowRight,
  Sparkles,
  Upload,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { sceneService, Scene, Choice } from '@/services/sceneService';
import { interactiveMovieService, InteractiveMovie } from '@/services/interactiveMovieService';
import { languageService, Language } from '@/services/languageService';
import { currencyService, Currency } from '@/services/currencyService';
import ImageCropperModal from '@/components/ui/ImageCropperModal';
import apiClient from '@/lib/api-client';

export default function InteractiveEditorPage() {
  const [movies, setMovies] = useState<InteractiveMovie[]>([]);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [manualMovieId, setManualMovieId] = useState<string>('');
  const [useManualId, setUseManualId] = useState(false);
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Scene Modal state
  const [isSceneModalOpen, setIsSceneModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [sceneName, setSceneName] = useState('');
  const [sceneUrl, setSceneUrl] = useState('');
  const [showChoicesOn, setShowChoicesOn] = useState('00:00:00');
  const [isEnding, setIsEnding] = useState(false);
  const [endText, setEndText] = useState('');

  // Scene Preview Modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewScene, setPreviewScene] = useState<Scene | null>(null);
  
  // Choice Modal state
  const [isChoiceModalOpen, setIsChoiceModalOpen] = useState(false);
  const [editingChoice, setEditingChoice] = useState<Choice | null>(null);
  const [currentChoiceSceneId, setCurrentChoiceSceneId] = useState<number | null>(null);
  const [choiceText, setChoiceText] = useState('');
  const [choiceTargetSceneId, setChoiceTargetSceneId] = useState<string>('');
  const [choiceColor, setChoiceColor] = useState('#0000FF');
  const [isQuickCreatingScene, setIsQuickCreatingScene] = useState(false);
  const [quickSceneTitle, setQuickSceneTitle] = useState('');
  const [quickSceneUrl, setQuickSceneUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Movie Modal state
  const [isMovieModalOpen, setIsMovieModalOpen] = useState(false);
  const [editingMovieObj, setEditingMovieObj] = useState<InteractiveMovie | null>(null);
  const [movieTitle, setMovieTitle] = useState('');
  const [movieDescription, setMovieDescription] = useState('');
  const [movieBanner, setMovieBanner] = useState('');
  const [movieCard, setMovieCard] = useState('');
  const [movieTrailer, setMovieTrailer] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [movieIsFree, setMovieIsFree] = useState<boolean>(true);
  const [moviePrice, setMoviePrice] = useState<string>('0.00');
  const [movieCurrency, setMovieCurrency] = useState<string>('INR');
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>([]);

  // Image Upload / Cropping state for Movie Modal
  const [isMovieUploading, setIsMovieUploading] = useState(false);
  const [movieCropModalData, setMovieCropModalData] = useState<{
    file: File;
    field: 'banner_image' | 'card_image';
    aspectRatio: number;
  } | null>(null);
  const [movieLightboxUrl, setMovieLightboxUrl] = useState<string | null>(null);

  // Custom Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalTitle, setDeleteModalTitle] = useState('');
  const [deleteModalMessage, setDeleteModalMessage] = useState('');
  const [onDeleteConfirm, setOnDeleteConfirm] = useState<(() => void) | null>(null);

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteModalTitle(title);
    setDeleteModalMessage(message);
    setOnDeleteConfirm(() => onConfirm);
    setIsDeleteModalOpen(true);
  };

  useEffect(() => {
    fetchMovies();
    // Fetch languages & currencies
    languageService.getAll().then(setAvailableLanguages).catch(console.error);
    currencyService.getAll().then(setAvailableCurrencies).catch(console.error);
  }, []);

  const fetchMovies = async () => {
    try {
      setIsLoadingMovies(true);
      setError(null);
      const data = await interactiveMovieService.getAll();
      setMovies(data || []);
      if (data && data.length > 0) {
        const id = data[0].interactive_movie_id || (data[0] as any).id;
        setSelectedMovieId(Number(id));
      }
    } catch (err: any) {
      console.error('Failed to fetch interactive movies:', err);
      // Don't set global error yet so user can use manual ID
      setUseManualId(true);
    } finally {
      setIsLoadingMovies(false);
    }
  };

  const loadScenes = async (movieId: number) => {
    if (!movieId) return;
    try {
      setIsLoadingScenes(true);
      setError(null);
      const data = await sceneService.getByMovieId(movieId);
      setScenes(data || []);
    } catch (err: any) {
      console.error('Failed to load scenes:', err);
      setError('Could not load scenes for this movie. Please try again.');
      setScenes([]);
    } finally {
      setIsLoadingScenes(false);
    }
  };

  useEffect(() => {
    const activeId = useManualId ? Number(manualMovieId) : selectedMovieId;
    if (activeId && !isNaN(activeId)) {
      loadScenes(activeId);
    } else {
      setScenes([]);
    }
  }, [selectedMovieId, manualMovieId, useManualId]);

  const handleMovieSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'manual') {
      setUseManualId(true);
    } else {
      setUseManualId(false);
      setSelectedMovieId(Number(val));
    }
  };

  // --- MOVIE CRUD ACTIONS ---
  const handleOpenAddMovie = () => {
    setEditingMovieObj(null);
    setMovieTitle('');
    setMovieDescription('');
    setMovieBanner('');
    setMovieCard('');
    setMovieTrailer('');
    setSelectedLanguages([]);
    setMovieIsFree(true);
    setMoviePrice('0.00');
    setMovieCurrency('INR');
    setIsMovieModalOpen(true);
  };

  const handleOpenEditMovie = () => {
    const movie = movies.find(m => m.interactive_movie_id === selectedMovieId);
    if (!movie) return;
    setEditingMovieObj(movie);
    setMovieTitle(movie.title || '');
    setMovieDescription(movie.description || '');
    setMovieBanner(movie.banner_image || '');
    setMovieCard(movie.card_image || '');
    setMovieTrailer(movie.trailer_video_url || '');
    setSelectedLanguages(movie.languages ? movie.languages.split(',').map(l => l.trim()).filter(Boolean) : []);
    setMovieIsFree(movie.is_free !== 0);
    setMoviePrice(movie.price !== undefined ? movie.price.toString() : '0.00');
    setMovieCurrency(movie.currency || 'INR');
    setIsMovieModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movieTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: movieTitle.trim(),
        description: movieDescription.trim(),
        banner_image: movieBanner.trim() || undefined,
        card_image: movieCard.trim() || undefined,
        trailer_video_url: movieTrailer.trim() || undefined,
        languages: selectedLanguages.join(', '),
        is_free: movieIsFree ? 1 : 0,
        price: movieIsFree ? 0 : Number(moviePrice) || 0,
        currency: movieCurrency,
      };

      if (editingMovieObj) {
        const updated = await interactiveMovieService.update(editingMovieObj.interactive_movie_id, payload);
        setMovies(prev => prev.map(m => m.interactive_movie_id === editingMovieObj.interactive_movie_id ? updated : m));
      } else {
        const created = await interactiveMovieService.create(payload);
        setMovies(prev => [...prev, created]);
        setSelectedMovieId(created.interactive_movie_id);
        setUseManualId(false);
      }
      setIsMovieModalOpen(false);
    } catch (err) {
      console.error('Failed to save movie:', err);
      alert('Error saving movie. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!selectedMovieId) return;
    const movie = movies.find(m => m.interactive_movie_id === selectedMovieId);
    if (!movie) return;

    confirmDelete(
      'Delete Interactive Movie',
      `Are you sure you want to delete the movie "${movie.title}"? This will permanently delete all of its scenes and branching choices!`,
      async () => {
        try {
          await interactiveMovieService.delete(selectedMovieId);
          const remainingMovies = movies.filter(m => m.interactive_movie_id !== selectedMovieId);
          setMovies(remainingMovies);
          if (remainingMovies.length > 0) {
            setSelectedMovieId(remainingMovies[0].interactive_movie_id);
          } else {
            setSelectedMovieId(null);
            setUseManualId(true);
          }
        } catch (err) {
          console.error('Failed to delete movie:', err);
          alert('Could not delete movie.');
        }
      }
    );
  };

  const handleMovieFileSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'banner_image' | 'card_image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setMovieCropModalData({
      file,
      field,
      aspectRatio: field === 'banner_image' ? 16 / 9 : 3 / 4
    });
  };

  const handleMovieCropComplete = async (croppedBlob: Blob) => {
    if (!movieCropModalData) return;
    const formData = new FormData();
    formData.append('file', croppedBlob, 'cropped-image.jpg');
    setIsMovieUploading(true);
    try {
      const res = await apiClient.post<{ status: boolean; message: string; url: string }>(
        '/upload-image',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000
        }
      );
      if (res.data.status && res.data.url) {
        if (movieCropModalData.field === 'banner_image') {
          setMovieBanner(res.data.url);
        } else {
          setMovieCard(res.data.url);
        }
        setMovieCropModalData(null);
      } else {
        alert(res.data.message || 'Upload failed.');
      }
    } catch (err: any) {
      console.error('Movie image upload error:', err);
      alert(err.response?.data?.message || 'Upload failed.');
    } finally {
      setIsMovieUploading(false);
    }
  };

  function MovieImageUploader({ 
    field, 
    id, 
    label, 
    aspect 
  }: {
    field: 'banner_image' | 'card_image'; 
    id: string; 
    label: string; 
    aspect: '16:9' | '3:4';
  }) {
    const url = field === 'banner_image' ? movieBanner : movieCard;
    const setUrl = field === 'banner_image' ? setMovieBanner : setMovieCard;

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">{label}</label>
        <div className={cn(
          'relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 flex flex-col items-center justify-center transition-all group',
          aspect === '16:9' ? 'w-full aspect-video' : 'aspect-[3/4] w-full max-w-[180px] mx-auto'
        )}>
          {url ? (
            <>
              <img src={url} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setMovieLightboxUrl(url)} 
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => document.getElementById(id)?.click()} 
                  className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/20 transition-all hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={() => setUrl('')} 
                  className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full border border-red-500/30 transition-all hover:scale-105"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div 
              onClick={() => document.getElementById(id)?.click()} 
              className="cursor-pointer absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl hover:bg-muted/20 transition-all w-full h-full p-4"
            >
              {isMovieUploading && movieCropModalData?.field === field ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/60 mb-2 group-hover:text-primary transition-colors" />
              )}
              <p className="text-xs font-semibold text-white/90 text-center">
                {isMovieUploading && movieCropModalData?.field === field ? 'Uploading...' : `Upload ${label}`}
              </p>
            </div>
          )}
        </div>
        <input 
          type="file" 
          id={id} 
          onChange={(e) => handleMovieFileSelect(e, field)} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    );
  }

  // --- SCENE CRUD ACTIONS ---
  const handleOpenAddScene = () => {
    setEditingScene(null);
    setSceneName('');
    setSceneUrl('');
    setShowChoicesOn('00:00:00');
    setIsEnding(false);
    setEndText('');
    setIsSceneModalOpen(true);
  };

  const handleOpenEditScene = (scene: Scene) => {
    setEditingScene(scene);
    setSceneName(scene.scene_text);
    setSceneUrl(scene.poster_url);
    setShowChoicesOn(scene.show_choices_on || (scene as any).show_on || '00:00:00');
    setIsEnding(Boolean(scene.is_ending));
    setEndText(scene.end_text || '');
    setIsSceneModalOpen(true);
  };

  const handleSaveScene = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeMovieId = useManualId ? Number(manualMovieId) : selectedMovieId;
    if (!activeMovieId || isNaN(activeMovieId)) {
      alert('Please select or input a valid Movie ID first.');
      return;
    }
    if (!sceneName.trim() || !sceneUrl.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingScene) {
        // Update Scene
        await sceneService.updateScene(editingScene.scene_id, {
          scene_name: sceneName.trim(),
          scene_url: sceneUrl.trim(),
          show_choices_on: showChoicesOn.trim(),
          is_ending: isEnding,
          end_text: isEnding ? endText.trim() : ''
        });
      } else {
        // Create Scene
        await sceneService.createScene({
          movie_id: activeMovieId,
          scene_name: sceneName.trim(),
          scene_url: sceneUrl.trim(),
          show_choices_on: showChoicesOn.trim(),
          is_ending: isEnding,
          end_text: isEnding ? endText.trim() : ''
        });
      }
      loadScenes(activeMovieId);
      setIsSceneModalOpen(false);
    } catch (err) {
      console.error('Failed to save scene:', err);
      alert('Error saving scene. Verify your backend endpoint and payload format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScene = async (sceneId: number) => {
    const activeMovieId = useManualId ? Number(manualMovieId) : selectedMovieId;
    confirmDelete(
      'Delete Decision Scene',
      'Are you sure you want to delete this scene? Deleting a scene will automatically delete all decisions branching out from it.',
      async () => {
        try {
          await sceneService.deleteScene(sceneId);
          if (activeMovieId) loadScenes(activeMovieId);
        } catch (err) {
          console.error('Failed to delete scene:', err);
          alert('Could not delete scene. Please try again.');
        }
      }
    );
  };

  // --- CHOICE CRUD ACTIONS ---
  const handleOpenAddChoice = (sceneId: number) => {
    setEditingChoice(null);
    setCurrentChoiceSceneId(sceneId);
    setChoiceText('');
    setChoiceTargetSceneId('');
    setChoiceColor('#0000FF');
    setIsQuickCreatingScene(false);
    setQuickSceneTitle('');
    setQuickSceneUrl('');
    setIsChoiceModalOpen(true);
  };

  const handleOpenEditChoice = (choice: Choice, sceneId: number) => {
    setEditingChoice(choice);
    setCurrentChoiceSceneId(sceneId);
    setChoiceText(choice.choice_text || choice.button_text || '');
    setChoiceTargetSceneId(
      choice.next_scene_id
        ? choice.next_scene_id.toString()
        : choice.target_scene
          ? choice.target_scene.toString()
          : ''
    );
    setChoiceColor(choice.button_color || '#0000FF');
    setIsQuickCreatingScene(false);
    setQuickSceneTitle('');
    setQuickSceneUrl('');
    setIsChoiceModalOpen(true);
  };

  const handleSaveChoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choiceText.trim() || !currentChoiceSceneId) return;
    const activeMovieId = useManualId ? Number(manualMovieId) : selectedMovieId;
    if (!activeMovieId) {
      alert('Please select or input a valid Movie ID first.');
      return;
    }

    setIsSubmitting(true);
    try {
      let targetSceneVal = choiceTargetSceneId ? Number(choiceTargetSceneId) : null;

      if (isQuickCreatingScene) {
        if (!quickSceneTitle.trim() || !quickSceneUrl.trim()) {
          alert('Please provide both a scene title and video URL for the new scene.');
          setIsSubmitting(false);
          return;
        }
        const newScene = await sceneService.createScene({
          movie_id: activeMovieId,
          scene_name: quickSceneTitle.trim(),
          scene_url: quickSceneUrl.trim()
        });
        if (newScene && newScene.scene_id) {
          targetSceneVal = newScene.scene_id;
        } else {
          throw new Error('Failed to retrieve ID of the quick-created scene.');
        }
      }

      if (editingChoice) {
        // Update Choice
        await sceneService.updateChoice({
          choice_id: editingChoice.choice_id,
          button_text: choiceText.trim(),
          target_scene: targetSceneVal,
          button_color: choiceColor.trim()
        });
      } else {
        // Create Choice
        await sceneService.createChoice({
          scene_id: currentChoiceSceneId,
          button_text: choiceText.trim(),
          target_scene: targetSceneVal,
          button_color: choiceColor.trim()
        });
      }
      
      if (activeMovieId) loadScenes(activeMovieId);
      setIsChoiceModalOpen(false);
    } catch (err) {
      console.error('Failed to save choice:', err);
      alert('Error saving choice. Ensure inputs are valid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteChoice = async (choiceId: number) => {
    const activeMovieId = useManualId ? Number(manualMovieId) : selectedMovieId;
    confirmDelete(
      'Delete Decision Choice',
      'Are you sure you want to delete this decision choice?',
      async () => {
        try {
          await sceneService.deleteChoice(choiceId);
          if (activeMovieId) loadScenes(activeMovieId);
        } catch (err) {
          console.error('Failed to delete choice:', err);
          alert('Could not delete choice.');
        }
      }
    );
  };

  const activeMovieId = useManualId ? Number(manualMovieId) : selectedMovieId;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-inner">
            <GitBranch className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-brand-gradient bg-clip-text text-transparent">Interactive Video Timeline Editor</h1>
            <p className="text-muted-foreground mt-1 text-sm">Configure scenes and branching choices for your interactive movie flow.</p>
          </div>
        </div>
        
        {/* Movie Selector controls */}
        <div className="flex items-center gap-3 bg-card border border-border/80 p-3 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Select Interactive Movie</span>
            {useManualId ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Enter Movie ID"
                  value={manualMovieId}
                  onChange={(e) => setManualMovieId(e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm w-36 outline-none focus:ring-2 ring-primary/20 text-white"
                />
                <button 
                  onClick={() => setUseManualId(false)}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  List Movies
                </button>
              </div>
            ) : (
              <select
                onChange={handleMovieSelectChange}
                value={selectedMovieId || ''}
                className="bg-background border border-border rounded-xl px-3 py-1.5 text-sm outline-none text-white font-medium cursor-pointer"
              >
                {isLoadingMovies ? (
                  <option>Loading movie titles...</option>
                ) : movies.length > 0 ? (
                  <>
                    {movies.map(m => (
                      <option key={m.interactive_movie_id} value={m.interactive_movie_id}>
                        {m.title || (m as any).movie_name || `Movie #${m.interactive_movie_id}`}
                      </option>
                    ))}
                    <option value="manual">Type Movie ID manually...</option>
                  </>
                ) : (
                  <option value="manual">No interactive movies. Type manually...</option>
                )}
              </select>
            )}
          </div>
          <button 
            onClick={() => activeMovieId && loadScenes(activeMovieId)} 
            disabled={isLoadingScenes}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
            title="Refresh Scenes"
          >
            <RefreshCw className={cn("w-4 h-4", isLoadingScenes && "animate-spin text-primary")} />
          </button>

          <div className="h-6 w-px bg-border/60" />
          
          <button 
            onClick={handleOpenAddMovie}
            className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-white rounded-xl transition-all active:scale-95"
            title="Create New Interactive Movie"
          >
            <Plus className="w-4 h-4" />
          </button>

          {!useManualId && selectedMovieId && (
            <>
              <button 
                onClick={handleOpenEditMovie}
                className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-white rounded-xl transition-all active:scale-95"
                title="Edit Movie Details"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDeleteMovie}
                className="p-2 border border-border hover:bg-muted text-muted-foreground hover:text-destructive rounded-xl transition-all active:scale-95"
                title="Delete Movie"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Active Workspace */}
        {!activeMovieId ? (
          <div className="text-center py-20 bg-card/30 border-2 border-dashed border-border rounded-3xl">
            <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">Select a Movie to Start Editing</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
              Please choose a movie from the selector above, or insert a manual movie ID to edit branching timelines.
            </p>
          </div>
        ) : isLoadingScenes ? (
          <div className="flex flex-col items-center justify-center py-24 bg-card/20 rounded-3xl border border-border/50">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">Loading video branching timeline...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header controls for workspace */}
            <div className="flex items-center justify-between bg-muted/20 px-5 py-4 border border-border/40 rounded-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 flex-wrap">
                  Editing: <strong className="text-white">{movies.find(m => m.interactive_movie_id === activeMovieId)?.title || `Movie #${activeMovieId}`}</strong>
                  {(() => {
                    const activeMovie = movies.find(m => m.interactive_movie_id === activeMovieId);
                    if (!activeMovie) return null;
                    const isFree = activeMovie.is_free !== 0;
                    return (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border",
                        isFree 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                        {isFree ? "Free" : `Paid (${activeMovie.currency || 'INR'} ${activeMovie.price || 0})`}
                      </span>
                    );
                  })()}
                </span>
              </div>
              <button 
                onClick={handleOpenAddScene}
                className="bg-brand-gradient text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Decision Scene
              </button>
            </div>

            {/* Scenes Timeline */}
            <div className="space-y-6 relative">
              {scenes.length > 0 ? (
                scenes.map((scene, index) => (
                  <div key={scene.scene_id} className="relative group">
                    {/* Visual branch linker line */}
                    {index !== scenes.length - 1 && (
                      <div className="absolute left-8 top-full h-8 w-0.5 bg-border/50 -z-10 group-hover:bg-primary/20 transition-colors" />
                    )}

                    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-md hover:border-primary/50 transition-colors">
                      {/* Scene Header */}
                      <div className="p-4 bg-muted/40 border-b border-border/40 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-1 bg-primary/25 border border-primary/45 text-primary text-xs font-bold rounded-lg shadow-sm">
                            SCENE ID: #{scene.scene_id}
                          </div>
                          <h3 className="font-bold text-base text-white">{scene.scene_text}</h3>
                        </div>
                        
                        {/* Scene Controls */}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenEditScene(scene)}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
                            title="Edit Scene Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteScene(scene.scene_id)}
                            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                            title="Delete Scene"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scene Content Body */}
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left column - video url/poster placeholder */}
                        <div className="lg:col-span-1 bg-background/50 border border-border/60 rounded-xl p-4 flex flex-col justify-between">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Video Asset URL</span>
                            <p className="text-xs text-zinc-400 break-all font-mono bg-muted/30 px-2 py-1.5 rounded-lg border border-border/20 mb-3">
                              {scene.poster_url}
                            </p>
                            {scene.poster_url && (
                              <button
                                onClick={() => {
                                  setPreviewScene(scene);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl border border-primary/20 hover:border-primary/40 transition-all active:scale-95 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Preview Scene Video
                              </button>
                            )}
                          </div>
                          
                           <div className="mt-4 pt-4 border-t border-border/30 flex flex-col gap-2 text-xs text-muted-foreground">
                             <div className="flex items-center justify-between">
                               <span className="flex items-center gap-1">
                                 <Clock className="w-3.5 h-3.5 text-primary" />
                                 Trigger at: <strong className="text-white font-mono">{scene.show_choices_on || (scene as any).show_on || '00:00:00'}</strong>
                               </span>
                               <span>{scene.choices.length} Branches</span>
                             </div>
                             {scene.is_ending && (
                               <div className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-wide text-center">
                                 Flow Ending Scene
                               </div>
                             )}
                           </div>
                        </div>

                        {/* Right columns - Branches/Choices CRUD */}
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Branch Choices</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {scene.choices.map((choice) => (
                              <div 
                                key={choice.choice_id} 
                                className="p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/50 space-y-3 relative group/choice transition-all shadow-sm"
                                style={choice.button_color ? { borderLeft: `3px solid ${choice.button_color}` } : undefined}
                              >
                                <div className="flex justify-between items-start">
                                  <span className="text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1.5">
                                    Path choice
                                    {choice.button_color && (
                                      <span 
                                        className="w-2 h-2 rounded-full border border-white/20 shadow-inner" 
                                        style={{ backgroundColor: choice.button_color }}
                                        title={`Color: ${choice.button_color}`}
                                      />
                                    )}
                                  </span>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/choice:opacity-100 transition-opacity">
                                    <button 
                                      onClick={() => handleOpenEditChoice(choice, scene.scene_id)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded transition-colors"
                                      title="Edit Choice"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteChoice(choice.choice_id)}
                                      className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive rounded transition-colors"
                                      title="Delete Choice"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                    <label>Button Text</label>
                                    {choice.button_color && (
                                      <span className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                                        {choice.button_color}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-semibold text-sm">{choice.choice_text || choice.button_text}</div>
                                </div>

                                <div className="space-y-1 pt-1.5 border-t border-border/20 flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Leads to:</span>
                                  <span className="flex items-center gap-1 text-primary font-semibold">
                                    {(choice.next_scene_id || choice.target_scene) ? (
                                      <>
                                        Scene #{choice.next_scene_id || choice.target_scene}
                                        <ArrowRight className="w-3 h-3" />
                                      </>
                                    ) : (
                                      <span className="text-muted-foreground italic text-[11px]">End of Flow</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {/* Add Path Button */}
                            <button 
                              onClick={() => handleOpenAddChoice(scene.scene_id)}
                              className="border-2 border-dashed border-border/80 hover:border-primary/50 hover:text-primary rounded-xl flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-all p-6 active:scale-[0.98] min-h-[110px]"
                            >
                              <Plus className="w-5 h-5 text-muted-foreground" />
                              <span className="text-xs font-semibold">Add decision path</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
                  <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-semibold">No scenes defined yet</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto mt-2 text-sm">
                    Click "Add Decision Scene" below to build the interactive sequence.
                  </p>
                </div>
              )}

              {/* Bottom Scene add button */}
              <button 
                onClick={handleOpenAddScene}
                className="w-full py-5 border-2 border-dashed border-border hover:border-primary/50 rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all active:scale-[0.99]"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold text-sm">Add New Scene</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- SCENE MODAL --- */}
      {isSceneModalOpen && (
        <>
          <div 
            onClick={() => setIsSceneModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {editingScene ? `Edit Scene: #${editingScene.scene_id}` : 'Create Decision Scene'}
              </h3>
              <button 
                onClick={() => setIsSceneModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScene} className="space-y-5 mt-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scene Title / Text Description</label>
                <input 
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  placeholder="e.g. Choose whether to approach or hide"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Video URL / Poster Path</label>
                <input 
                  type="text"
                  value={sceneUrl}
                  onChange={(e) => setSceneUrl(e.target.value)}
                  placeholder="e.g. https://domain.com/videos/scene_01.mp4"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Show Choices On</label>
                  <input 
                    type="text"
                    value={showChoicesOn}
                    onChange={(e) => setShowChoicesOn(e.target.value)}
                    placeholder="e.g. 00:01:00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col justify-end pb-3">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={isEnding}
                      onChange={(e) => setIsEnding(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-0 w-4 h-4 bg-background cursor-pointer"
                    />
                    <span className="font-semibold text-sm text-white/90">
                      Is ending scene?
                    </span>
                  </label>
                </div>
              </div>

              {isEnding && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/90">Ending Message / Text</label>
                  <input 
                    type="text"
                    value={endText}
                    onChange={(e) => setEndText(e.target.value)}
                    placeholder="e.g. The End, Game Over, You Survived!"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsSceneModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Scene'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- CHOICE MODAL --- */}
      {isChoiceModalOpen && (
        <>
          <div 
            onClick={() => setIsChoiceModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                {editingChoice ? `Edit Path Choice: #${editingChoice.choice_id}` : 'Create Path Choice'}
              </h3>
              <button 
                onClick={() => setIsChoiceModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChoice} className="space-y-5 mt-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Button text label</label>
                <input 
                  type="text"
                  value={choiceText}
                  onChange={(e) => setChoiceText(e.target.value)}
                  placeholder="e.g. Turn Left"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Button color theme</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="text"
                      value={choiceColor}
                      onChange={(e) => setChoiceColor(e.target.value)}
                      placeholder="#0000FF"
                      className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase">HEX</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl border border-border overflow-hidden relative flex-shrink-0 cursor-pointer shadow-inner">
                    <input 
                      type="color"
                      value={choiceColor}
                      onChange={(e) => setChoiceColor(e.target.value)}
                      className="absolute inset-[-4px] w-[calc(100%+8px)] h-[calc(100%+8px)] cursor-pointer border-0 p-0"
                    />
                  </div>
                </div>
              </div>

              {!isQuickCreatingScene && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination target scene</label>
                  <select
                    value={choiceTargetSceneId}
                    onChange={(e) => setChoiceTargetSceneId(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white cursor-pointer"
                  >
                    <option value="">-- Select Destination (End Flow) --</option>
                    {scenes
                      .filter(s => s.scene_id !== currentChoiceSceneId)
                      .map(s => (
                        <option key={s.scene_id} value={s.scene_id}>
                          Scene #{s.scene_id}: {s.scene_text}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={isQuickCreatingScene}
                    onChange={(e) => setIsQuickCreatingScene(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-4 h-4 bg-background cursor-pointer"
                  />
                  <span className="font-medium text-xs text-muted-foreground hover:text-white transition-colors">
                    Create new scene as destination
                  </span>
                </label>

                {isQuickCreatingScene && (
                  <div className="p-4 bg-muted/20 border border-border/60 rounded-2xl space-y-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">New Scene Title</label>
                      <input 
                        type="text"
                        value={quickSceneTitle}
                        onChange={(e) => setQuickSceneTitle(e.target.value)}
                        placeholder="e.g. Branch 2 - Approach the door"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 ring-primary/20 text-white"
                        required={isQuickCreatingScene}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Video URL / Poster Path</label>
                      <input 
                        type="text"
                        value={quickSceneUrl}
                        onChange={(e) => setQuickSceneUrl(e.target.value)}
                        placeholder="e.g. https://domain.com/videos/scene_02.mp4"
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 ring-primary/20 text-white font-mono"
                        required={isQuickCreatingScene}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsChoiceModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Choice'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- MOVIE MODAL --- */}
      {isMovieModalOpen && (
        <>
          <div 
            onClick={() => setIsMovieModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Film className="w-5 h-5 text-primary" />
                {editingMovieObj ? `Edit Interactive Movie Details` : 'Create Interactive Movie'}
              </h3>
              <button 
                onClick={() => setIsMovieModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovie} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
              {/* Left Column - Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Movie Title</label>
                  <input 
                    type="text"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="e.g. Journey Of Ashwin"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea 
                    value={movieDescription}
                    onChange={(e) => setMovieDescription(e.target.value)}
                    placeholder="Interactive story description..."
                    rows={5}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Trailer Video URL</label>
                  <input 
                    type="text"
                    value={movieTrailer}
                    onChange={(e) => setMovieTrailer(e.target.value)}
                    placeholder="e.g. https://domain.com/trailers/trailer.mp4"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Languages</label>
                  {availableLanguages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableLanguages.map((lang) => {
                        const isSelected = selectedLanguages.includes(lang.name);
                        return (
                          <button
                            key={lang.id}
                            type="button"
                            onClick={() => {
                              const updated = isSelected
                                ? selectedLanguages.filter((l) => l !== lang.name)
                                : [...selectedLanguages, lang.name];
                              setSelectedLanguages(updated);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer",
                              isSelected
                                ? "bg-primary/20 border-primary text-primary"
                                : "bg-background border-border text-muted-foreground hover:text-white"
                            )}
                          >
                            {lang.name}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input 
                      type="text"
                      value={selectedLanguages.join(', ')}
                      onChange={(e) => setSelectedLanguages(e.target.value.split(',').map(s => s.trim()))}
                      placeholder="e.g. Tamil, Hindi, English"
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    />
                  )}
                </div>

                {/* Interactive Payment Configuration */}
                <div className="border-t border-border/40 pt-4 space-y-4">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Payment Configuration</span>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input 
                        type="radio"
                        name="movie_is_free"
                        checked={movieIsFree}
                        onChange={() => setMovieIsFree(true)}
                        className="rounded-full border-border text-primary focus:ring-0 w-4 h-4 bg-background cursor-pointer"
                      />
                      <span className="font-semibold text-xs text-white">Free to Watch</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                      <input 
                        type="radio"
                        name="movie_is_free"
                        checked={!movieIsFree}
                        onChange={() => setMovieIsFree(false)}
                        className="rounded-full border-border text-primary focus:ring-0 w-4 h-4 bg-background cursor-pointer"
                      />
                      <span className="font-semibold text-xs text-white">Paid / Premium</span>
                    </label>
                  </div>

                  {!movieIsFree && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Price</label>
                        <input 
                          type="number"
                          step="0.01"
                          value={moviePrice}
                          onChange={(e) => setMoviePrice(e.target.value)}
                          placeholder="e.g. 99.00"
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 ring-primary/20 text-white font-mono"
                          required={!movieIsFree}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                        <select 
                          value={movieCurrency}
                          onChange={(e) => setMovieCurrency(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 ring-primary/20 text-white cursor-pointer h-[34px]"
                          required={!movieIsFree}
                        >
                          {availableCurrencies.length > 0 ? (
                            availableCurrencies.map((curr) => (
                              <option key={curr.id} value={curr.code} className="bg-card text-white">
                                {curr.code} ({curr.symbol || curr.name})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="INR" className="bg-card text-white">INR (₹)</option>
                              <option value="USD" className="bg-card text-white">USD ($)</option>
                              <option value="EUR" className="bg-card text-white">EUR (€)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Images */}
              <div className="space-y-4">
                <MovieImageUploader 
                  field="banner_image" 
                  id="movie-banner-upload" 
                  label="Banner Image (16:9)" 
                  aspect="16:9" 
                />

                <MovieImageUploader 
                  field="card_image" 
                  id="movie-card-upload" 
                  label="Card Image (3:4)" 
                  aspect="3:4" 
                />
              </div>

              {/* Footer Actions */}
              <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-6 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsMovieModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- SCENE PREVIEW MODAL --- */}
      {isPreviewModalOpen && previewScene && (
        <>
          <div 
            onClick={() => {
              setIsPreviewModalOpen(false);
              setPreviewScene(null);
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Play className="w-5 h-5 text-primary fill-current" />
                Preview Scene: {previewScene.scene_text}
              </h3>
              <button 
                onClick={() => {
                  setIsPreviewModalOpen(false);
                  setPreviewScene(null);
                }}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center justify-center bg-black/40 rounded-2xl p-2 overflow-hidden aspect-video border border-border/30">
              {(() => {
                const url = previewScene.poster_url;
                const ytMatch = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                const isYouTube = ytMatch && ytMatch[2].length === 11;
                
                if (isYouTube) {
                  return (
                    <iframe
                      src={`https://www.youtube.com/embed/${ytMatch[2]}?autoplay=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full rounded-xl shadow-lg border-0"
                    />
                  );
                }
                
                return (
                  <video 
                    src={url} 
                    controls 
                    autoPlay
                    className="w-full h-full rounded-xl object-contain shadow-lg"
                  />
                );
              })()}
            </div>
            
            <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
              <span>Scene ID: #{previewScene.scene_id}</span>
              <span className="font-mono break-all max-w-[70%]">{previewScene.poster_url}</span>
            </div>
          </div>
        </>
      )}

      {/* Movie Image Cropper Modal */}
      {movieCropModalData && (
        <ImageCropperModal
          imageFile={movieCropModalData.file}
          aspectRatio={movieCropModalData.aspectRatio}
          onClose={() => setMovieCropModalData(null)}
          onCropComplete={handleMovieCropComplete}
        />
      )}

      {/* Movie Image Lightbox Preview Modal */}
      {movieLightboxUrl && (
        <>
          <div 
            onClick={() => setMovieLightboxUrl(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] transition-opacity flex items-center justify-center p-4 animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-xl max-h-[85vh] w-full rounded-2xl overflow-hidden border border-border/50 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Image Preview</span>
                <button 
                  type="button"
                  onClick={() => setMovieLightboxUrl(null)}
                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 flex items-center justify-center bg-black/40 overflow-hidden max-h-[70vh]">
                <img 
                  src={movieLightboxUrl} 
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

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <>
          <div 
            onClick={() => setIsDeleteModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-destructive/20 rounded-3xl p-6 shadow-2xl z-[70] animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="p-2 bg-destructive/10 text-destructive rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">{deleteModalTitle}</h3>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {deleteModalMessage}
            </p>

            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-border/50">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteConfirm) onDeleteConfirm();
                  setIsDeleteModalOpen(false);
                }}
                className="bg-destructive hover:bg-destructive/90 text-white px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-destructive/20 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

