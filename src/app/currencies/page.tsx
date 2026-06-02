'use client';

import React, { useEffect, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { currencyService, Currency } from '@/services/currencyService';
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
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);

  // Form states - Add Currency
  const [currencyName, setCurrencyName] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [paypalSupported, setPaypalSupported] = useState(false);
  const [stripeSupported, setStripeSupported] = useState(true);

  // Form states - Edit Currency
  const [editCurrencyName, setEditCurrencyName] = useState('');
  const [editCurrencyCode, setEditCurrencyCode] = useState('');
  const [editCurrencySymbol, setEditCurrencySymbol] = useState('');
  const [editPaypalSupported, setEditPaypalSupported] = useState(false);
  const [editStripeSupported, setEditStripeSupported] = useState(true);

  // Custom Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalTitle, setDeleteModalTitle] = useState('');
  const [deleteModalMessage, setDeleteModalMessage] = useState('');
  const [onDeleteConfirm, setOnDeleteConfirm] = useState<(() => void) | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await currencyService.getAll();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch currencies:', err);
      setError('Failed to load currencies.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (title: string, message: string, onConfirm: () => void) => {
    setDeleteModalTitle(title);
    setDeleteModalMessage(message);
    setOnDeleteConfirm(() => onConfirm);
    setIsDeleteModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setCurrencyName('');
    setCurrencyCode('');
    setCurrencySymbol('');
    setPaypalSupported(false);
    setStripeSupported(true);
    setIsAddModalOpen(true);
  };

  const handleSaveAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currencyName.trim() || !currencyCode.trim() || !currencySymbol.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: currencyName.trim(),
        code: currencyCode.trim().toUpperCase(),
        symbol: currencySymbol.trim(),
        paypal_supported: paypalSupported,
        stripe_supported: stripeSupported,
      };

      const created = await currencyService.create(payload);
      setCurrencies(prev => [...prev, created]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create currency:', err);
      alert('Failed to create currency: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (curr: Currency) => {
    setEditingCurrency(curr);
    setEditCurrencyName(curr.name);
    setEditCurrencyCode(curr.code);
    setEditCurrencySymbol(curr.symbol);
    setEditPaypalSupported(curr.paypal_supported);
    setEditStripeSupported(curr.stripe_supported);
    setIsEditModalOpen(true);
  };

  const handleSaveEditCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCurrency) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: editCurrencyName.trim(),
        code: editCurrencyCode.trim().toUpperCase(),
        symbol: editCurrencySymbol.trim(),
        paypal_supported: editPaypalSupported,
        stripe_supported: editStripeSupported,
      };

      const updated = await currencyService.update(editingCurrency.id, payload);
      setCurrencies(prev => prev.map(c => c.id === editingCurrency.id ? updated : c));
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update currency:', err);
      alert('Failed to update currency: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCurrency = (curr: Currency) => {
    confirmDelete(
      'Delete Currency',
      `Are you sure you want to permanently delete the currency "${curr.name}" (${curr.code})? This will affect any subscription plans using this currency.`,
      async () => {
        try {
          await currencyService.delete(curr.id);
          setCurrencies(prev => prev.filter(c => c.id !== curr.id));
        } catch (err: any) {
          console.error('Failed to delete currency:', err);
          alert('Could not delete currency.');
        }
      }
    );
  };

  const columns: ColumnDef<Currency>[] = [
    { 
      accessorKey: 'id', 
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
    },
    { 
      accessorKey: 'name', 
      header: 'Name',
      cell: ({ row }) => <span className="font-semibold text-white">{row.original.name}</span>
    },
    { 
      accessorKey: 'code', 
      header: 'Code',
      cell: ({ row }) => <span className="font-mono bg-muted/60 text-primary font-bold px-2 py-0.5 rounded text-xs">{row.original.code}</span>
    },
    { 
      accessorKey: 'symbol', 
      header: 'Symbol',
      cell: ({ row }) => <span className="font-semibold text-white/80">{row.original.symbol}</span>
    },
    { 
      accessorKey: 'paypal_supported', 
      header: 'PayPal Support',
      cell: ({ row }) => {
        const supported = row.original.paypal_supported;
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
            supported 
              ? "bg-green-500/10 text-green-500 border-green-500/15" 
              : "bg-red-500/10 text-red-500 border-red-500/15"
          )}>
            {supported ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {supported ? 'Supported' : 'No'}
          </span>
        );
      }
    },
    { 
      accessorKey: 'stripe_supported', 
      header: 'Stripe Support',
      cell: ({ row }) => {
        const supported = row.original.stripe_supported;
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
            supported 
              ? "bg-green-500/10 text-green-500 border-green-500/15" 
              : "bg-red-500/10 text-red-500 border-red-500/15"
          )}>
            {supported ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {supported ? 'Supported' : 'No'}
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
            title="Edit Currency"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteCurrency(row.original)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Delete Currency"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currencies</h1>
          <p className="text-muted-foreground">Manage payment gateway support and exchange codes.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddModal}
            className="bg-brand-gradient text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Currency
          </button>
          <button 
            onClick={fetchCurrencies}
            className="p-2 hover:bg-muted rounded-xl border border-border/80 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading currencies list...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={currencies} searchPlaceholder="Search by Name or Code..." />
      )}

      {/* --- ADD MODAL --- */}
      {isAddModalOpen && (
        <>
          <div 
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                Add New Currency
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddCurrency} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Currency Name</label>
                <input 
                  type="text"
                  value={currencyName}
                  onChange={(e) => setCurrencyName(e.target.value)}
                  placeholder="e.g. Indian Rupee"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ISO Code</label>
                  <input 
                    type="text"
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    placeholder="e.g. INR"
                    maxLength={5}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Symbol</label>
                  <input 
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    placeholder="e.g. ₹"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">PayPal Support</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={paypalSupported} 
                      onChange={(e) => setPaypalSupported(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Stripe Support</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={stripeSupported} 
                      onChange={(e) => setStripeSupported(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

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
                  disabled={isSubmitting}
                  className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Creating...' : 'Create Currency'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- EDIT MODAL --- */}
      {isEditModalOpen && editingCurrency && (
        <>
          <div 
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Currency: {editingCurrency.name}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCurrency} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Currency Name</label>
                <input 
                  type="text"
                  value={editCurrencyName}
                  onChange={(e) => setEditCurrencyName(e.target.value)}
                  placeholder="e.g. Indian Rupee"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">ISO Code</label>
                  <input 
                    type="text"
                    value={editCurrencyCode}
                    onChange={(e) => setEditCurrencyCode(e.target.value)}
                    placeholder="e.g. INR"
                    maxLength={5}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Symbol</label>
                  <input 
                    type="text"
                    value={editCurrencySymbol}
                    onChange={(e) => setEditCurrencySymbol(e.target.value)}
                    placeholder="e.g. ₹"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">PayPal Support</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editPaypalSupported} 
                      onChange={(e) => setEditPaypalSupported(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Stripe Support</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editStripeSupported} 
                      onChange={(e) => setEditStripeSupported(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-background peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

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
                  disabled={isSubmitting}
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

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-[60] animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center gap-3 text-destructive mb-3">
              <Info className="w-6 h-6" />
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
    </div>
  );
}
