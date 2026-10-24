'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Award, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  Film, 
  Globe, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Info, 
  X,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { certificateService, Certificate, CertificatePayload } from '@/services/certificateService';
import { cn, formatDate } from '@/lib/utils';

// Standard Indian CBFC Presets for quick autofill
const CBFC_PRESETS = [
  { code: 'U', name: 'Unrestricted Public Exhibition', system: 'CBFC', country: 'India', maturity: 'All Ages', color: '#10B981', desc: 'Suitable for viewers of all ages. Contains no objectionable material.' },
  { code: 'UA 7+', name: 'Parental Guidance - 7 Years and Above', system: 'CBFC', country: 'India', maturity: '7+', color: '#06B6D4', desc: 'Unrestricted public exhibition with parental caution for children under 7.' },
  { code: 'UA 13+', name: 'Parental Guidance - 13 Years and Above', system: 'CBFC', country: 'India', maturity: '13+', color: '#F59E0B', desc: 'Parental guidance advised for children under 13. May contain moderate stylized themes.' },
  { code: 'UA 16+', name: 'Parental Guidance - 16 Years and Above', system: 'CBFC', country: 'India', maturity: '16+', color: '#F97316', desc: 'Caution for viewers under 16. May contain mature themes and intense scenes.' },
  { code: 'A', name: 'Restricted to Adults (18+)', system: 'CBFC', country: 'India', maturity: '18+', color: '#EF4444', desc: 'Strictly restricted to adult audiences (18 years and above).' },
  { code: 'S', name: 'Specialized Audiences Only', system: 'CBFC', country: 'India', maturity: 'Specialized', color: '#8B5CF6', desc: 'Restricted to specialized professions or classes of people.' }
];

const COLOR_PRESETS = [
  { name: 'Emerald', value: '#10B981' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Indigo', value: '#6366F1' },
];

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Dynamic filter options
  const [filterSystems, setFilterSystems] = useState<string[]>(['CBFC', 'MPA', 'BBFC']);
  const [filterCountries, setFilterCountries] = useState<string[]>(['India', 'United States', 'United Kingdom']);

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [system, setSystem] = useState('CBFC');
  const [country, setCountry] = useState('India');
  const [maturityLevel, setMaturityLevel] = useState('All Ages');
  const [description, setDescription] = useState('');
  const [badgeColor, setBadgeColor] = useState('#10B981');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Safe Delete Dialog State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<Certificate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Fetch Certificates on filter change
  useEffect(() => {
    fetchCertificates();
  }, [searchTerm, selectedSystem, selectedStatus, selectedCountry, currentPage, pageSize]);

  // Load distinct filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const filters = await certificateService.getFilters();
        if (filters.systems && filters.systems.length > 0) setFilterSystems(filters.systems);
        if (filters.countries && filters.countries.length > 0) setFilterCountries(filters.countries);
      } catch (err) {
        console.error('Failed to load certificate filters:', err);
      }
    };
    loadFilters();
  }, []);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const res = await certificateService.getAll({
        search: searchTerm,
        system: selectedSystem,
        status: selectedStatus,
        country: selectedCountry,
        page: currentPage,
        limit: pageSize,
      });
      setCertificates(res.items || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to fetch certificates:', err);
      setCertificates([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Metrics for Dashboard Cards
  const stats = useMemo(() => {
    const total = totalCount;
    const cbfcCount = certificates.filter(c => c.certification_system === 'CBFC').length;
    const otherCount = certificates.filter(c => c.certification_system !== 'CBFC').length;
    const totalMovies = certificates.reduce((sum, c) => sum + (c.movie_count || 0), 0);
    return { total, cbfcCount, otherCount, totalMovies };
  }, [certificates, totalCount]);

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingCert(null);
    setCode('');
    setName('');
    setSystem('CBFC');
    setCountry('India');
    setMaturityLevel('All Ages');
    setDescription('');
    setBadgeColor('#10B981');
    setStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cert: Certificate) => {
    setEditingCert(cert);
    setCode(cert.code);
    setName(cert.name);
    setSystem(cert.certification_system);
    setCountry(cert.country);
    setMaturityLevel(cert.maturity_level || 'All Ages');
    setDescription(cert.description || '');
    setBadgeColor(cert.badge_color || '#10B981');
    setStatus(cert.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof CBFC_PRESETS[0]) => {
    setCode(preset.code);
    setName(preset.name);
    setSystem(preset.system);
    setCountry(preset.country);
    setMaturityLevel(preset.maturity);
    setBadgeColor(preset.color);
    setDescription(preset.desc);
  };

  const handleSaveCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Certificate code is required.');
      return;
    }
    if (!name.trim()) {
      setFormError('Certificate name is required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    const payload: CertificatePayload = {
      code: code.trim(),
      name: name.trim(),
      certification_system: system.trim() || 'CBFC',
      country: country.trim() || 'India',
      description: description.trim() || undefined,
      maturity_level: maturityLevel.trim() || undefined,
      badge_color: badgeColor,
      status,
    };

    try {
      if (editingCert) {
        await certificateService.update(editingCert.id, payload);
      } else {
        await certificateService.create(payload);
      }
      setIsModalOpen(false);
      fetchCertificates();
    } catch (err: any) {
      console.error('Failed to save certificate:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to save certificate.';
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Status Toggle
  const handleToggleStatus = async (cert: Certificate) => {
    try {
      await certificateService.toggleStatus(cert.id);
      setCertificates(prev =>
        prev.map(c => (c.id === cert.id ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' } : c))
      );
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
      alert('Could not update status. Please try again.');
    }
  };

  // Safe Delete Handlers
  const handleOpenDeleteModal = (cert: Certificate) => {
    setCertToDelete(cert);
    setDeleteErrorMessage(null);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!certToDelete) return;

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await certificateService.delete(certToDelete.id);
      setDeleteModalOpen(false);
      setCertToDelete(null);
      fetchCertificates();
    } catch (err: any) {
      console.error('Failed to delete certificate:', err);
      const resData = err.response?.data;
      const message = resData?.message || err.message || 'Cannot delete certificate.';
      setDeleteErrorMessage(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeactivateInstead = async () => {
    if (!certToDelete) return;
    try {
      await certificateService.update(certToDelete.id, { status: 'inactive' });
      setDeleteModalOpen(false);
      setCertToDelete(null);
      fetchCertificates();
    } catch (err) {
      console.error('Failed to deactivate certificate:', err);
      alert('Could not deactivate certificate.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
              <Award className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">CBFC & Film Certification</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Manage Indian CBFC categories (U, UA 7+, UA 13+, UA 16+, A, S), international ratings, viewer advisories, and certified titles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRefreshing(true);
              fetchCertificates();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-border bg-card/50 hover:bg-muted text-muted-foreground hover:text-white transition-all duration-200"
            title="Refresh List"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin text-primary")} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-brand-gradient text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Certificate
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Certificates</span>
          <div className="text-2xl font-black text-white">{totalCount}</div>
          <span className="text-[11px] text-muted-foreground/80">Active in catalogue</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">CBFC (India)</span>
          <div className="text-2xl font-black text-emerald-400">
            {certificates.filter(c => c.certification_system === 'CBFC' && c.status === 'active').length}
          </div>
          <span className="text-[11px] text-emerald-400/80">Official Indian ratings</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Global / Others</span>
          <div className="text-2xl font-black text-cyan-400">
            {certificates.filter(c => c.certification_system !== 'CBFC').length}
          </div>
          <span className="text-[11px] text-cyan-400/80">MPA, BBFC & regional</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Movies Certified</span>
          <div className="text-2xl font-black text-amber-400">{stats.totalMovies}</div>
          <span className="text-[11px] text-amber-400/80">Titles linked</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-card/70 border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search certificate code, title, country, description..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-muted/40 border border-border rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 ring-primary/20 text-white placeholder:text-muted-foreground/60 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* System Filter */}
          <select
            value={selectedSystem}
            onChange={(e) => {
              setSelectedSystem(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:ring-2 ring-primary/20"
          >
            <option value="all">All Systems</option>
            {filterSystems.map(sys => (
              <option key={sys} value={sys}>{sys}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:ring-2 ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs font-medium text-white outline-none focus:ring-2 ring-primary/20"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Loading film certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No certificates found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {searchTerm || selectedSystem !== 'all' || selectedStatus !== 'all'
                  ? 'No ratings matched your current search or filters. Try clearing filters.'
                  : 'Start by creating your first CBFC or official platform film certificate.'}
              </p>
            </div>
            {(searchTerm || selectedSystem !== 'all' || selectedStatus !== 'all') ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSystem('all');
                  setSelectedStatus('all');
                  setSelectedCountry('all');
                }}
                className="px-4 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-white rounded-xl transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add CBFC Certificate
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b border-border/80 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-4 px-5">Certificate Code</th>
                  <th className="py-4 px-5">Full Name & Maturity</th>
                  <th className="py-4 px-5">System & Country</th>
                  <th className="py-4 px-5">Advisory & Guidelines</th>
                  <th className="py-4 px-5 text-center">Movies</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5">Created</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-muted/20 transition-colors group">
                    {/* Badge / Code */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-3 py-1 rounded-lg text-xs font-black tracking-wide border shadow-sm"
                          style={{
                            backgroundColor: `${cert.badge_color || '#10B981'}1A`,
                            borderColor: `${cert.badge_color || '#10B981'}55`,
                            color: cert.badge_color || '#10B981',
                          }}
                        >
                          {cert.code}
                        </span>
                        {cert.certification_system === 'CBFC' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            CBFC
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name & Maturity Level */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-white leading-snug">{cert.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 bg-muted/60 rounded text-[10px] text-white/70 font-medium">
                          Age: {cert.maturity_level || 'General'}
                        </span>
                      </div>
                    </td>

                    {/* System & Country */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{cert.certification_system}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="w-3 h-3 text-muted-foreground/60" />
                        {cert.country}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-5 max-w-xs">
                      <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed" title={cert.description || 'No description provided.'}>
                        {cert.description || <span className="italic text-muted-foreground/50">No description provided</span>}
                      </p>
                    </td>

                    {/* Movies Count */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border",
                        (cert.movie_count || 0) > 0 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-muted/40 text-muted-foreground border-border/40"
                      )}>
                        <Film className="w-3 h-3" />
                        {cert.movie_count || 0}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-5 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(cert)}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer",
                          cert.status === 'active'
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted"
                        )}
                        title="Click to toggle active/inactive status"
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", cert.status === 'active' ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground")} />
                        {cert.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-5 text-xs text-muted-foreground whitespace-nowrap">
                      {cert.created_at ? formatDate(cert.created_at) : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(cert)}
                          className="p-2 rounded-lg bg-muted/40 hover:bg-muted text-muted-foreground hover:text-white transition-colors"
                          title="Edit Certificate"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(cert)}
                          className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive hover:text-white text-destructive transition-colors"
                          title="Delete Certificate"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!isLoading && certificates.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/70 bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-white">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-white">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
              <span className="font-semibold text-white">{totalCount}</span> certificates
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT CERTIFICATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {editingCert ? `Edit Certificate: ${editingCert.code}` : 'Add New Film Certificate'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure official certification ratings, CBFC classifications, and age advisories.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-muted-foreground hover:text-white rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCertificate} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-sm flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Quick CBFC Presets */}
              {!editingCert && (
                <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" /> Indian CBFC Quick Presets
                    </span>
                    <span className="text-[11px] text-muted-foreground">Click to autofill official details</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CBFC_PRESETS.map((preset) => (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => handleApplyPreset(preset)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95",
                          code === preset.code
                            ? "bg-primary/20 border-primary text-primary"
                            : "bg-muted/60 border-border/70 text-muted-foreground hover:text-white"
                        )}
                      >
                        {preset.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Certificate Code */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                    Certificate Code <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UA 13+, U, A, PG-13"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none focus:ring-2 ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Unique badge code (e.g. U, UA 7+, UA 13+, UA 16+, A, S)</p>
                </div>

                {/* Certificate Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                    Official Certificate Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Parental Guidance - 13 Years and Above"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Full statutory or board title</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Certification System */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                    System / Board <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CBFC, MPA, BBFC"
                    value={system}
                    onChange={(e) => setSystem(e.target.value.toUpperCase())}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 ring-primary/20"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                    Country <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. India, United States"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 ring-primary/20"
                  />
                </div>

                {/* Maturity Level */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                    Age / Maturity Guide
                  </label>
                  <select
                    value={maturityLevel}
                    onChange={(e) => setMaturityLevel(e.target.value)}
                    className="w-full bg-muted/40 border border-border rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:ring-2 ring-primary/20"
                  >
                    <option value="All Ages">All Ages</option>
                    <option value="7+">7+ (Children 7 and above)</option>
                    <option value="12+">12+ (12 Years and above)</option>
                    <option value="13+">13+ (Teens 13 and above)</option>
                    <option value="16+">16+ (16 Years and above)</option>
                    <option value="18+">18+ (Adults Only)</option>
                    <option value="Specialized">Specialized Audience</option>
                  </select>
                </div>
              </div>

              {/* Description / Content Guidelines */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-foreground/90">
                  Advisory Guidelines & Content Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain age guidelines, themes, language, violence, or parental guidance advice..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-muted/40 border border-border rounded-xl p-3 text-sm text-white outline-none focus:ring-2 ring-primary/20 resize-none leading-relaxed"
                />
              </div>

              {/* Badge Color & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-xs font-semibold mb-2 text-foreground/90">Badge Accent Color</label>
                  <div className="flex items-center gap-2">
                    {COLOR_PRESETS.map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => setBadgeColor(col.value)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-transform",
                          badgeColor === col.value ? "scale-110 border-white ring-2 ring-primary" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: col.value }}
                        title={col.name}
                      />
                    ))}
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 ml-2"
                      title="Custom color"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-2 text-foreground/90">Active Availability</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStatus('active')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        status === 'active'
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : "bg-muted/40 border-border text-muted-foreground"
                      )}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Active (Visible in Movie forms)
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('inactive')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                        status === 'inactive'
                          ? "bg-destructive/10 border-destructive text-destructive"
                          : "bg-muted/40 border-border text-muted-foreground"
                      )}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Inactive
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 bg-brand-gradient text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCert ? 'Save Changes' : 'Create Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && certToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">
                Delete Certificate: {certToDelete.code}?
              </h3>
              <p className="text-sm text-muted-foreground">
                {(certToDelete.movie_count || 0) > 0 ? (
                  <span className="text-amber-400 font-medium">
                    This certificate is currently assigned to {certToDelete.movie_count} movie(s).
                  </span>
                ) : (
                  `Are you sure you want to permanently delete "${certToDelete.name}"? This action cannot be undone.`
                )}
              </p>
            </div>

            {deleteErrorMessage && (
              <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs leading-relaxed">
                {deleteErrorMessage}
              </div>
            )}

            {(certToDelete.movie_count || 0) > 0 ? (
              <div className="space-y-3">
                <div className="p-3 bg-muted/40 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-white block mb-1">Referential Integrity Protection:</strong>
                  Deleting a certificate linked to active movies would cause missing rating badges on movie streaming cards and detail pages. We recommend deactivating it instead.
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleDeactivateInstead}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-xl text-sm transition-colors"
                  >
                    Deactivate Instead (Hide from new movies)
                  </button>
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    className="w-full py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:text-white hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 bg-destructive hover:bg-destructive/90 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Permanently
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
