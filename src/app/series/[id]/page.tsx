'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Plus,
  Loader2,
  AlertCircle,
  PlayCircle,
  Layers,
  Edit,
  Trash2,
  Eye,
  Star,
  Film,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { movieService, Movie } from '@/services/movieService';
import { episodeService, Episode } from '@/services/episodeService';
import { cn, formatDate } from '@/lib/utils';
import apiClient from '@/lib/api-client';

interface Season {
  id: number;
  series_id: number;
  season_number: number;
  title?: string;
  description?: string;
  release_year?: number;
  createdAt?: string;
}

export default function SeriesDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seriesId = Number(params.id);

  const [series, setSeries] = useState<Movie | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodesBySeasonId, setEpisodesBySeasonId] = useState<Record<number, Episode[]>>({});
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<number | null>(null);

  useEffect(() => {
    if (seriesId) fetchSeriesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesId]);

  const fetchSeriesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch the series (movie) details
      const seriesData = await movieService.getById(seriesId);
      setSeries(seriesData);

      // Fetch seasons for this series
      const seasonsRes = await apiClient.get<{ status: boolean; data: Season[] }>(`/seasons?series_id=${seriesId}`);
      const fetchedSeasons = seasonsRes.data?.data || [];
      setSeasons(fetchedSeasons);

      // Auto-expand first season
      if (fetchedSeasons.length > 0) {
        const firstId = fetchedSeasons[0].id;
        setExpandedSeasons(new Set([firstId]));
        await fetchEpisodesForSeason(firstId);
      }
    } catch (err: any) {
      console.error('Failed to load series data:', err);
      setError('Could not load series information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEpisodesForSeason = async (seasonId: number) => {
    try {
      const eps = await episodeService.getAll(seasonId);
      setEpisodesBySeasonId(prev => ({ ...prev, [seasonId]: eps }));
    } catch (err) {
      console.error(`Failed to fetch episodes for season ${seasonId}:`, err);
      setEpisodesBySeasonId(prev => ({ ...prev, [seasonId]: [] }));
    }
  };

  const toggleSeason = async (seasonId: number) => {
    const next = new Set(expandedSeasons);
    if (next.has(seasonId)) {
      next.delete(seasonId);
    } else {
      next.add(seasonId);
      if (!episodesBySeasonId[seasonId]) {
        await fetchEpisodesForSeason(seasonId);
      }
    }
    setExpandedSeasons(next);
  };

  const handleDeleteEpisode = async (episodeId: number, seasonId: number) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    try {
      setDeletingEpisodeId(episodeId);
      await episodeService.delete(episodeId);
      setEpisodesBySeasonId(prev => ({
        ...prev,
        [seasonId]: (prev[seasonId] || []).filter(e => e.id !== episodeId),
      }));
    } catch (err) {
      console.error('Failed to delete episode:', err);
      alert('Failed to delete episode.');
    } finally {
      setDeletingEpisodeId(null);
    }
  };

  const totalEpisodes = Object.values(episodesBySeasonId).reduce((acc, eps) => acc + eps.length, 0);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-card rounded-2xl border border-dashed border-border">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-muted-foreground">Loading web series...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/series" className="p-2 border border-border rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Series Detail</h1>
        </div>
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/series" className="p-2 border border-border rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{series?.movie_name || series?.title || 'Web Series'}</h1>
            <p className="text-sm text-muted-foreground">
              {seasons.length} Season{seasons.length !== 1 ? 's' : ''} • {totalEpisodes} Episode{totalEpisodes !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/series/${seriesId}/seasons/new`}
            className="border border-border px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-muted transition-colors text-sm"
          >
            <Layers className="w-4 h-4" />
            Add Season
          </Link>
          <Link
            href={`/series/${seriesId}/episodes/new`}
            className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Episode
          </Link>
        </div>
      </div>

      {/* Series Hero Banner */}
      {series && (
        <div className="relative rounded-2xl overflow-hidden border border-border bg-card">
          <div className="absolute inset-0">
            {series.media?.image?.url && (
              <img src={series.media.image.url} alt={series.movie_name} className="w-full h-full object-cover opacity-20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/80 to-transparent" />
          </div>
          <div className="relative flex items-start gap-6 p-6">
            <div className="w-28 h-40 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50 shadow-lg">
              {series.media?.image?.url ? (
                <img src={series.media.image.url} alt={series.movie_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground opacity-30" />
                </div>
              )}
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  WEB SERIES
                </span>
                {series.isFeatured && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> FEATURED
                  </span>
                )}
                {series.isFree ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">FREE</span>
                ) : (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">PREMIUM</span>
                )}
              </div>
              <h2 className="text-xl font-bold">{series.movie_name || series.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2">{series.shortDescription || series.movie_desc}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {series.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <strong className="text-foreground">{series.rating}</strong>/10
                  </span>
                )}
                {series.languages && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {series.languages}
                  </span>
                )}
                {series.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {series.duration}
                  </span>
                )}
                {(series.releaseYear || series.release_date) && (
                  <span>{series.releaseYear || series.release_date?.split('-')[0]}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seasons & Episodes */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          Seasons & Episodes
        </h2>

        {seasons.length === 0 ? (
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl">
            <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No seasons yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">Add the first season to get started.</p>
            <Link
              href={`/series/${seriesId}/seasons/new`}
              className="inline-flex items-center gap-2 mt-6 bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Add First Season
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {seasons.map((season) => {
              const isExpanded = expandedSeasons.has(season.id);
              const episodes = episodesBySeasonId[season.id];

              return (
                <div key={season.id} className="bg-card border border-border rounded-2xl overflow-hidden transition-all duration-200">
                  {/* Season Header */}
                  <button
                    onClick={() => toggleSeason(season.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                        S{season.season_number}
                      </div>
                      <div>
                        <p className="font-semibold">{season.title || `Season ${season.season_number}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {episodes !== undefined
                            ? `${episodes.length} episode${episodes.length !== 1 ? 's' : ''}`
                            : 'Click to load episodes'}
                          {season.release_year ? ` • ${season.release_year}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                        onClick={(e) => e.stopPropagation()}
                        className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors border border-primary/20"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Episode
                      </Link>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Episodes List */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {episodes === undefined ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                      ) : episodes.length === 0 ? (
                        <div className="text-center py-12">
                          <Film className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                          <p className="text-sm text-muted-foreground">No episodes in this season yet.</p>
                          <Link
                            href={`/series/${seriesId}/seasons/${season.id}/episodes/new`}
                            className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary hover:underline"
                          >
                            <Plus className="w-4 h-4" /> Add first episode
                          </Link>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {episodes.map((ep) => (
                            <div
                              key={ep.id}
                              className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group"
                            >
                              {/* Episode thumbnail */}
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50 relative">
                                {ep.media?.poster_image?.url ? (
                                  <img src={ep.media.poster_image.url} alt={ep.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <PlayCircle className="w-4 h-4 text-muted-foreground opacity-50" />
                                  </div>
                                )}
                              </div>

                              {/* Episode number badge */}
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                                {ep.episode_number}
                              </div>

                              {/* Episode info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{ep.title}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                  {ep.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> {ep.duration}
                                    </span>
                                  )}
                                  {ep.languages && (
                                    <span className="flex items-center gap-1">
                                      <Globe className="w-3 h-3" /> {ep.languages}
                                    </span>
                                  )}
                                  {ep.viewCount !== undefined && (
                                    <span className="flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> {ep.viewCount.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Rating */}
                              {ep.rating !== undefined && (
                                <div className="hidden sm:flex items-center gap-1 text-sm">
                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  <span className="font-medium">{ep.rating}</span>
                                </div>
                              )}

                              {/* Badges */}
                              <div className="hidden md:flex items-center gap-2">
                                {ep.isFeatured ? (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Featured</span>
                                ) : null}
                                {ep.isFree ? (
                                  <span className="flex items-center gap-0.5 text-xs text-emerald-400">
                                    <CheckCircle className="w-3.5 h-3.5" /> Free
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                    <XCircle className="w-3.5 h-3.5" /> Premium
                                  </span>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => router.push(`/series/${seriesId}/episodes/${ep.id}/edit`)}
                                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                  title="Edit episode"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteEpisode(ep.id, season.id)}
                                  disabled={deletingEpisodeId === ep.id}
                                  className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors disabled:opacity-50"
                                  title="Delete episode"
                                >
                                  {deletingEpisodeId === ep.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
