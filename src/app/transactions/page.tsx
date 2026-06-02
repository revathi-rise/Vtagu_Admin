'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { transactionService, Transaction } from '@/services/transactionService';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  X, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  AlertCircle,
  Info,
  RefreshCw,
  Receipt,
  User,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Form states - Add Transaction
  const [txnIdInput, setTxnIdInput] = useState('');
  const [userIdInput, setUserIdInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [statusInput, setStatusInput] = useState('C');

  // Form states - Edit Transaction
  const [editStatusInput, setEditStatusInput] = useState('C');

  // Shared Confirmation Modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await transactionService.getAll();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError('Failed to load transactions.');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void
  ) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setOnConfirmAction(() => onConfirm);
    setIsConfirmModalOpen(true);
  };

  // --- ACTIONS HANDLERS ---
  const handleOpenAddModal = () => {
    setTxnIdInput('');
    setUserIdInput('');
    setAmountInput('');
    setStatusInput('C');
    setIsAddModalOpen(true);
  };

  const handleSaveAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txnIdInput.trim() || !userIdInput || !amountInput) return;

    setIsSubmitting(true);
    try {
      const payload = {
        txn_id: txnIdInput.trim(),
        user_id: Number(userIdInput),
        amount: Number(amountInput),
        status: statusInput,
      };

      const created = await transactionService.create(payload);
      setTransactions(prev => [created, ...prev]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create transaction:', err);
      alert('Error creating transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (txn: Transaction) => {
    setEditingTransaction(txn);
    setEditStatusInput(txn.status);
    setIsEditModalOpen(true);
  };

  const handleSaveEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setIsSubmitting(true);
    try {
      const payload = {
        status: editStatusInput,
      };

      const updated = await transactionService.update(editingTransaction.id, payload);
      setTransactions(prev => prev.map(t => t.id === editingTransaction.id ? updated : t));
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update transaction:', err);
      alert('Error updating transaction: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = (txn: Transaction) => {
    triggerConfirm(
      'Delete Transaction',
      `Are you sure you want to permanently delete the transaction "${txn.txn_id}"? This action cannot be undone!`,
      async () => {
        try {
          await transactionService.delete(txn.id);
          setTransactions(prev => prev.filter(t => t.id !== txn.id));
        } catch (err: any) {
          console.error('Failed to delete transaction:', err);
          alert('Failed to delete transaction.');
        }
      }
    );
  };

  const columns: ColumnDef<Transaction>[] = [
    { 
      accessorKey: 'id', 
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-primary">TXN-{row.original.id}</span>
    },
    { 
      accessorKey: 'txn_id', 
      header: 'Transaction ID',
      cell: ({ row }) => <span className="font-mono text-xs font-medium text-white">{row.original.txn_id}</span>
    },
    { 
      accessorKey: 'user_id', 
      header: 'User ID',
      cell: ({ row }) => <span className="text-muted-foreground">User #{row.original.user_id}</span>
    },
    { 
      accessorKey: 'amount', 
      header: 'Amount', 
      cell: ({ row }) => {
        const amt = Number(row.original.amount || 0);
        return (
          <span className="font-semibold text-sm font-mono text-white">
            {formatCurrency(amt)}
          </span>
        );
      }
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isSuccess = status === 'C' || String(status).toLowerCase() === 'completed' || String(status).toLowerCase() === 'success';
        const isPending = status === 'P' || String(status).toLowerCase() === 'pending';
        const isFailed = status === 'F' || String(status).toLowerCase() === 'failed';
        
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isSuccess ? "bg-green-500/10 text-green-500 border border-green-500/20" :
            isPending ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
            "bg-red-500/10 text-red-500 border border-red-500/20"
          )}>
            {isSuccess ? 'Completed' : isPending ? 'Pending' : isFailed ? 'Failed' : status}
          </span>
        );
      }
    },
    { 
      accessorKey: 'created_at', 
      header: 'Date Created', 
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.created_at)}</span> 
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenEditModal(row.original)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
            title="Edit Transaction Status"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDeleteTransaction(row.original)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
            title="Delete Transaction"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Transactions Manager</h1>
          <p className="text-muted-foreground mt-1">View, search, and manually manage user payments and order details.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleOpenAddModal}
            className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Transaction
          </button>
          <button 
            onClick={fetchTransactions}
            className="p-2.5 hover:bg-muted rounded-xl border border-border/80 transition-colors text-white"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* DATA TABLE CONTAINER */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-muted-foreground">Loading transaction logs...</p>
        </div>
      ) : (
        <DataTable columns={columns} data={transactions} searchPlaceholder="Search transactions..." />
      )}

      {/* --- ADD TRANSACTION MODAL --- */}
      {isAddModalOpen && (
        <>
          <div 
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Create Manual Transaction
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddTransaction} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Transaction ID (txn_id)</label>
                <input 
                  type="text"
                  value={txnIdInput}
                  onChange={(e) => setTxnIdInput(e.target.value)}
                  placeholder="e.g. manual_txn_778899"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    User ID
                  </label>
                  <input 
                    type="number"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="e.g. 503"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Amount
                  </label>
                  <input 
                    type="number"
                    step="0.01"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 99.00"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Status</label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                >
                  <option value="C" className="bg-card">Completed / Success (C)</option>
                  <option value="P" className="bg-card">Pending (P)</option>
                  <option value="F" className="bg-card">Failed (F)</option>
                </select>
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
                  {isSubmitting ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- EDIT TRANSACTION STATUS MODAL --- */}
      {isEditModalOpen && editingTransaction && (
        <>
          <div 
            onClick={() => setIsEditModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Update Transaction: TXN-{editingTransaction.id}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTransaction} className="space-y-4 mt-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-semibold">Transaction ID:</p>
                <p className="text-sm font-mono font-medium text-white">{editingTransaction.txn_id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">User:</p>
                  <p className="text-sm font-medium text-white">User #{editingTransaction.user_id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Amount:</p>
                  <p className="text-sm font-mono font-medium text-white">{formatCurrency(Number(editingTransaction.amount))}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Transaction Status</label>
                <select
                  value={editStatusInput}
                  onChange={(e) => setEditStatusInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                >
                  <option value="C" className="bg-card">Completed / Success (C)</option>
                  <option value="P" className="bg-card">Pending (P)</option>
                  <option value="F" className="bg-card">Failed (F)</option>
                </select>
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

      {/* --- CONFIRMATION MODAL --- */}
      {isConfirmModalOpen && (
        <>
          <div 
            onClick={() => setIsConfirmModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-[60] animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center gap-3 mb-3 text-destructive">
              <Info className="w-6 h-6" />
              <h3 className="text-lg font-bold">{confirmModalTitle}</h3>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {confirmModalMessage}
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-muted transition-colors text-white"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  if (onConfirmAction) onConfirmAction();
                  setIsConfirmModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl font-semibold bg-destructive hover:bg-destructive/90 text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[400px] bg-card border border-border rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <TransactionsContent />
    </Suspense>
  );
}
