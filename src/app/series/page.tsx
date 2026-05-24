'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Loader2,
  AlertCircle,
  Film,
  Star,
  Eye,
  Clock,
  Globe,
  Edit,
  Trash2,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Tv,
  Layers,
  Search,
  X,
} from 'lucide-react';
import { episodeService, Episode } from '@/services/episodeService';
import { cn, formatDate } from '@/lib/utils';
import Link from 'next/link';

/* ─── Helper: group episodes by season_id ─────────────────────────────────── */
function groupBySeasonId(episodes: Episode[]): Record<number, Episode[]> {
  return episodes.reduce<Record<number, Episode[]>>((acc, ep) => {
    if (!acc[ep.season_id]) acc[ep.season_id] = [];
    acc[ep.season_id].push(ep);
    return acc;
  }, {});
}

export default function SeriesPage() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await episodeService.getAll();
      setEpisodes(data || []);

      // Auto-expand the first season group
      if (data && data.length > 0) {
        const firstSeasonId = data[0].season_id;
        setExpandedSeasons(new Set([firstSeasonId]));
      }
    } catch (err: any) {
      console.error('Failed to fetch episodes:', err);
      setError('Could not load episodes. Please check your connection and try again.');
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this episode?')) return;
    try {
      setDeletingId(id);
      await episodeService.delete(id);
      setEpisodes(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete episode:', err);
      alert('Failed to delete episode.');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSeason = (seasonId: number) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(seasonId)) next.delete(seasonId);
      else next.add(seasonId);
      return next;
    });
  };

  // Filter episodes by search query
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return episodes;
    return episodes.filter(
      ep =>
        ep.title.toLowerCase().includes(q) ||
        ep.shortDescription?.toLowerCase().includes(q) ||
        ep.languages?.toLowerCase().includes(q)
    );
  }, [episodes, search]);

  const grouped = useMemo(() => groupBySeasonId(filtered), [filtered]);
  const seasonIds = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => a - b);

  const totalViews = episodes.reduce((acc, ep) => acc + (ep.viewCount ?? 0), 0);
  const featuredCount = episodes.filter(ep => ep.isFeatured).length;

  /* ── Summary cards ─────────────────────────────────────────────────────── */
  const summaryCards = [
    {
      label: 'Total Episodes',
      value: episodes.length,
      icon: PlayCircle,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Seasons',
      value: Object.keys(groupBySeasonId(episodes)).length,
      icon: Layers,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Featured',
      value: featuredCount,
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Web Series</h1>
          <p className="text-muted-foreground">
            Manage seasons, episodes, and episodic content.
          </p>
        </div>
        <Link
          href="/episodes/new"
          className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Episode
        </Link>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-card rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading web series...</p>
          </div>
        </div>
      ) : episodes.length === 0 ? (
        /* ── Empty state ──────────────────────────────────────────────────── */
        <div className="text-center py-24 bg-card border border-dashed border-border rounded-3xl">
          <Film className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold">No episodes found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm">
            No episodes have been added yet. Create your first episode to get started.
          </p>
          <Link
            href="/episodes/new"
            className="inline-flex items-center gap-2 mt-6 bg-brand-gradient text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add First Episode
          </Link>
        </div>
      ) : (
        <>
          {/* ── Summary cards ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryCards.map(card => (
              <div key={card.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                <div className={cn('p-2.5 rounded-xl', card.bg)}>
                  <card.icon className={cn('w-5 h-5', card.color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Search ─────────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search episodes by title, language..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 text-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
              </button>
            )}
          </div>

          {/* ── Seasons accordion ─────────────────────────────────────────── */}
          {seasonIds.length === 0 ? (
            <div className="text-center py-12 bg-card border border-dashed border-border rounded-2xl">
              <p className="text-muted-foreground text-sm">No results match your search.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {seasonIds.map(seasonId => {
                const seasonEpisodes = grouped[seasonId].sort(
                  (a, b) => a.episode_number - b.episode_number
                );
                const isExpanded = expandedSeasons.has(seasonId);
                const seasonViews = seasonEpisodes.reduce(
                  (acc, ep) => acc + (ep.viewCount ?? 0),
                  0
                );

                return (
                  <div
                    key={seasonId}
                    className="bg-card border border-border rounded-2xl overflow-hidden"
                  >
                    {/* Season header */}
                    <button
                      onClick={() => toggleSeason(seasonId)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 flex-shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold">Season {seasonId}</p>
                          <p className="text-xs text-muted-foreground">
                            {seasonEpisodes.length} episode{seasonEpisodes.length !== 1 ? 's' : ''}
                            {' '}&bull;{' '}
                            <Eye className="inline w-3 h-3 mx-0.5" />
                            {seasonViews.toLocaleString()} views
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/episodes/new?season_id=${seasonId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-primary/10 text-primary rounded-lg border border-primary/20 hover:bg-primary/20 transition-colors"
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

                    {/* Episode rows */}
                    {isExpanded && (
                      <div className="border-t border-border divide-y divide-border">
                        {seasonEpisodes.map(ep => (
                          <div
                            key={ep.id}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors group"
                          >
                            {/* Thumbnail */}
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                              {ep.media?.poster_image?.url ? (
                                <img
                                  src={ep.media.poster_image.url}
                                  alt={ep.media.poster_image.alt || ep.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PlayCircle className="w-4 h-4 text-muted-foreground opacity-50" />
                                </div>
                              )}
                            </div>

                            {/* Ep # badge */}
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                              {ep.episode_number}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">{ep.title}</p>
                              <div className="flex items-center flex-wrap gap-3 text-xs text-muted-foreground mt-0.5">
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
                              <div className="hidden sm:flex items-center gap-1 text-sm flex-shrink-0">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="font-semibold">{ep.rating}</span>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                              {ep.isFeatured && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                                  Featured
                                </span>
                              )}
                              {ep.isFree ? (
                                <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" /> Free
                                </span>
                              ) : (
                                <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                  <XCircle className="w-3.5 h-3.5" /> Premium
                                </span>
                              )}
                            </div>

                            {/* Created date */}
                            <p className="hidden lg:block text-xs text-muted-foreground flex-shrink-0">
                              {formatDate(ep.createdAt)}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <Link
                                href={`/episodes/${ep.id}`}
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-primary rounded-lg transition-colors"
                                title="Edit episode"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDelete(ep.id)}
                                disabled={deletingId === ep.id}
                                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors disabled:opacity-50"
                                title="Delete episode"
                              >
                                {deletingId === ep.id ? (
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
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
