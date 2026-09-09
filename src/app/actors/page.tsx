'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Loader2, Users2, Edit, Trash2, X, Save, Calendar, Globe, User } from 'lucide-react';
import { actorService, Actor } from '@/services/actorService';
import { DataTable } from '@/components/ui/DataTable';

export default function ActorsPage() {
  const [actors, setActors] = useState<Actor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<Actor | null>(null);
  const [formName, setFormName] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formImage, setFormImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchActors();
  }, []);

  const fetchActors = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await actorService.getAll();
      setActors(data || []);
    } catch (err) {
      console.error('Failed to fetch actors:', err);
      setError('Could not load actors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingActor(null);
    setFormName('');
    setFormCountry('');
    setFormDob('');
    setFormBio('');
    setFormImage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (actor: Actor) => {
    setEditingActor(actor);
    setFormName(actor.name || '');
    setFormCountry(actor.country || '');
    setFormDob(actor.dob || '');
    setFormBio(actor.bio || '');
    setFormImage(actor.image || actor.actor_image || '');
    setIsModalOpen(true);
  };

  const handleDeleteActor = async (actor: Actor) => {
    const actorId = actor.actor_id || actor.id;
    if (!actorId) return;
    if (!window.confirm(`Are you sure you want to delete ${actor.name}?`)) return;

    try {
      await actorService.delete(actorId);
      setActors(prev => prev.filter(a => (a.actor_id || a.id) !== actorId));
    } catch (err) {
      console.error('Failed to delete actor:', err);
      alert('Failed to delete actor. Please try again.');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Actor> = {
        name: formName.trim(),
        country: formCountry.trim() || undefined,
        dob: formDob.trim() || undefined,
        bio: formBio.trim() || undefined,
        image: formImage.trim() || undefined,
      };

      const targetId = editingActor ? (editingActor.actor_id || editingActor.id) : undefined;

      if (editingActor && targetId) {
        const updated = await actorService.update(targetId, payload);
        setActors(prev => prev.map(a => ((a.actor_id || a.id) === targetId ? { ...a, ...updated, ...payload } : a)));
      } else {
        const created = await actorService.create(payload);
        setActors(prev => [created || { ...payload, actor_id: Date.now() }, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save actor:', err);
      alert('Failed to save actor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Actor Name',
      cell: ({ row }: any) => {
        const actor = row.original as Actor;
        const imageUrl = actor.image || actor.actor_image;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={actor.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white">{actor.name}</p>
              {actor.bio && <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{actor.bio}</p>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'country',
      header: 'Country',
      cell: ({ row }: any) => {
        const country = row.original.country;
        return country ? (
          <span className="inline-flex items-center gap-1 text-sm text-foreground/90">
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            {country}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      accessorKey: 'dob',
      header: 'Date of Birth',
      cell: ({ row }: any) => {
        const dob = row.original.dob;
        return dob ? (
          <span className="inline-flex items-center gap-1 text-sm text-foreground/90">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {dob}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: any) => {
        const actor = row.original as Actor;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenEditModal(actor)}
              className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
              title="Edit Actor"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteActor(actor)}
              className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
              title="Delete Actor"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Actors</h1>
          <p className="text-muted-foreground mt-1">Manage movie & series actors and cast members.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-5 h-5" />
          Add Actor
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <DataTable columns={columns} data={actors} searchPlaceholder="Search actors by name or country..." />
      )}

      {/* Add / Edit Actor Modal */}
      {isModalOpen && (
        <>
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <h3 className="text-xl font-bold text-white">
                {editingActor ? `Edit Actor: ${editingActor.name}` : 'Add New Actor'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Actor Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Hanshika Motwani"
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Country</label>
                  <input
                    type="text"
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    value={formDob}
                    onChange={(e) => setFormDob(e.target.value)}
                    className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Image URL</label>
                <input
                  type="url"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Bio / Description</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  placeholder="Brief biography..."
                  rows={3}
                  className="w-full bg-background/50 border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
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
                  {isSubmitting ? 'Saving...' : 'Save Actor'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
