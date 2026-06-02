'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/DataTable';
import { planService, Plan } from '@/services/planService';
import { subscriptionService, Subscription } from '@/services/subscriptionService';
import { currencyService, Currency } from '@/services/currencyService';
import { formatDate, formatCurrency } from '@/lib/utils';
import { 
  Shield, 
  Check, 
  X, 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  RefreshCw,
  CreditCard,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper component/function to avoid import issues if cn is missing but used in my replacement
import { Receipt } from 'lucide-react';

function SubscriptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') === 'users' ? 'users' : 'plans';

  // --- PLANS STATE ---
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  // Plans Modals state
  const [isPlanAddModalOpen, setIsPlanAddModalOpen] = useState(false);
  const [isPlanEditModalOpen, setIsPlanEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form states - Add Plan
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('1 Month');
  const [planDescription, setPlanDescription] = useState('');
  const [planCurrencyInput, setPlanCurrencyInput] = useState('USD');
  const [planCurrSearchQuery, setPlanCurrSearchQuery] = useState('');
  const [isPlanCurrDropdownOpen, setIsPlanCurrDropdownOpen] = useState(false);

  // Form states - Edit Plan
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('');
  const [editPlanDuration, setEditPlanDuration] = useState('');
  const [editPlanDescription, setEditPlanDescription] = useState('');
  const [editPlanCurrencyInput, setEditPlanCurrencyInput] = useState('USD');
  const [editPlanCurrSearchQuery, setEditPlanCurrSearchQuery] = useState('');
  const [isEditPlanCurrDropdownOpen, setIsEditPlanCurrDropdownOpen] = useState(false);

  // --- USER SUBSCRIPTIONS STATE ---
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);
  const [subsError, setSubsError] = useState<string | null>(null);

  // User Subs Modals state
  const [isSubAddModalOpen, setIsSubAddModalOpen] = useState(false);
  const [isSubEditModalOpen, setIsSubEditModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  // Form states - Add Subscription
  const [userIdInput, setUserIdInput] = useState('');
  const [planIdInput, setPlanIdInput] = useState('');
  const [paymentMethodInput, setPaymentMethodInput] = useState('Razorpay');
  const [paymentDetailsInput, setPaymentDetailsInput] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [priceAmountInput, setPriceAmountInput] = useState('');
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [currencyInput, setCurrencyInput] = useState('INR');

  // Form states - Edit Subscription
  const [subStatusInput, setSubStatusInput] = useState('1');
  const [subPaymentStatusInput, setSubPaymentStatusInput] = useState('2');
  const [subTxnIdInput, setSubTxnIdInput] = useState('');
  const [subCurrencyInput, setSubCurrencyInput] = useState('INR');
  const [subPaidAmountInput, setSubPaidAmountInput] = useState('');

  // Currencies database lists and modal dropdown search states
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currSearchQuery, setCurrSearchQuery] = useState('');
  const [isCurrDropdownOpen, setIsCurrDropdownOpen] = useState(false);
  const [editCurrSearchQuery, setEditCurrSearchQuery] = useState('');
  const [isEditCurrDropdownOpen, setIsEditCurrDropdownOpen] = useState(false);

  // --- SHARED CONFIRMATION STATE ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState('');
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void) | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<'info' | 'danger'>('info');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const data = await currencyService.getAll();
      setCurrencies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch currencies list:', err);
    }
  };

  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      setPlansError(null);
      const data = await planService.getAll();
      setPlans(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
      setPlansError('Failed to fetch subscription plans.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setIsLoadingSubs(true);
      setSubsError(null);
      const data = await subscriptionService.getAll();
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch subscriptions:', err);
      setSubsError('Failed to load transactions.');
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const triggerConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'info' | 'danger' = 'info'
  ) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setOnConfirmAction(() => onConfirm);
    setConfirmActionType(type);
    setIsConfirmModalOpen(true);
  };

  // --- PLANS ACTION HANDLERS ---
  const handleOpenPlanAddModal = () => {
    setPlanName('');
    setPlanPrice('');
    setPlanDuration('1 Month');
    setPlanDescription('');
    setPlanCurrencyInput('USD');
    setPlanCurrSearchQuery('USD');
    setIsPlanAddModalOpen(true);
  };

  const handleSaveAddPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim() || !planPrice.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Plan> = {
        plan_name: planName.trim(),
        plan_price: Number(planPrice),
        plan_duration: planDuration,
        plan_description: planDescription.trim(),
        currency: planCurrencyInput || 'USD',
        status: 1, // Active by default
      };

      const created = await planService.create(payload);
      setPlans(prev => [...prev, created]);
      setIsPlanAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create plan:', err);
      alert('Error creating plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPlanEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setEditPlanName(plan.plan_name);
    setEditPlanPrice(plan.plan_price.toString());
    setEditPlanDuration(plan.plan_duration);
    setEditPlanDescription(plan.plan_description || '');
    setEditPlanCurrencyInput(plan.currency || 'USD');
    setEditPlanCurrSearchQuery(plan.currency || 'USD');
    setIsPlanEditModalOpen(true);
  };

  const handleSaveEditPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editPlanName.trim() || !editPlanPrice.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Plan> = {
        plan_name: editPlanName.trim(),
        plan_price: Number(editPlanPrice),
        plan_duration: editPlanDuration,
        plan_description: editPlanDescription.trim(),
        currency: editPlanCurrencyInput || 'USD',
      };

      const updated = await planService.update(editingPlan.id, payload);
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? updated : p));
      setIsPlanEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update plan:', err);
      alert('Error updating plan: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePlanStatus = (plan: Plan) => {
    const isCurrentlyActive = plan.status === 1 || plan.status === 'active';
    const newStatus = isCurrentlyActive ? 0 : 1;
    const actionText = isCurrentlyActive ? 'Disable' : 'Enable';

    triggerConfirm(
      `${actionText} Subscription Plan`,
      `Are you sure you want to ${actionText.toLowerCase()} the plan "${plan.plan_name}"? New users will ${isCurrentlyActive ? 'no longer' : 'now'} be able to subscribe to it.`,
      async () => {
        try {
          const updated = await planService.update(plan.id, { status: newStatus });
          setPlans(prev => prev.map(p => p.id === plan.id ? updated : p));
        } catch (err: any) {
          console.error(`Failed to ${actionText.toLowerCase()} plan:`, err);
          alert(`Failed to ${actionText.toLowerCase()} plan.`);
        }
      },
      isCurrentlyActive ? 'danger' : 'info'
    );
  };

  const handleDeletePlan = (plan: Plan) => {
    triggerConfirm(
      'Delete Subscription Plan',
      `Are you sure you want to permanently delete the plan "${plan.plan_name}"? This action cannot be undone!`,
      async () => {
        try {
          await planService.delete(plan.id);
          setPlans(prev => prev.filter(p => p.id !== plan.id));
        } catch (err: any) {
          console.error('Failed to delete plan:', err);
          alert('Failed to delete plan.');
        }
      },
      'danger'
    );
  };

  // --- USER SUBSCRIPTIONS ACTION HANDLERS ---
  const handleOpenSubAddModal = () => {
    setUserIdInput('');
    setPlanIdInput(plans[0]?.id?.toString() || '');
    setPaymentMethodInput('Razorpay');
    setPaymentDetailsInput('');
    setPriceAmountInput('');
    setPaidAmountInput('');
    setCurrencyInput('INR');
    setCurrSearchQuery('');
    
    // Default dates: today and one month from today
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);
    
    setDateFromInput(today.toISOString().split('T')[0]);
    setDateToInput(oneMonthLater.toISOString().split('T')[0]);
    setIsSubAddModalOpen(true);
  };

  const handleSaveAddSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput || !planIdInput || !dateFromInput || !dateToInput) return;

    setIsSubmitting(true);
    try {
      const fromEpoch = Math.floor(new Date(dateFromInput).getTime() / 1000);
      const toEpoch = Math.floor(new Date(dateToInput).getTime() / 1000);

      const payload = {
        userId: Number(userIdInput),
        planId: Number(planIdInput),
        payment_method: paymentMethodInput,
        payment_details: paymentDetailsInput || undefined,
        timestamp_from: fromEpoch,
        timestamp_to: toEpoch,
        price_amount: priceAmountInput ? Number(priceAmountInput) : undefined,
        paid_amount: paidAmountInput ? Number(paidAmountInput) : undefined,
        currency: currencyInput || undefined,
      };

      const created = await subscriptionService.create(payload);
      setSubscriptions(prev => [created, ...prev]);
      setIsSubAddModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create subscription:', err);
      alert('Failed to create subscription: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSubEditModal = (sub: Subscription) => {
    setEditingSubscription(sub);
    setSubStatusInput(sub.status.toString());
    setSubPaymentStatusInput(sub.payment_status.toString());
    setSubTxnIdInput(sub.txnId || '');
    setSubCurrencyInput(sub.currency || 'INR');
    setEditCurrSearchQuery(sub.currency || 'INR');
    setSubPaidAmountInput(sub.paid_amount !== undefined ? sub.paid_amount.toString() : '');
    setIsSubEditModalOpen(true);
  };

  const handleSaveEditSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubscription) return;

    setIsSubmitting(true);
    try {
      const payload = {
        status: Number(subStatusInput),
        payment_status: Number(subPaymentStatusInput),
        txnId: subTxnIdInput || undefined,
        currency: subCurrencyInput || undefined,
        paid_amount: subPaidAmountInput ? Number(subPaidAmountInput) : undefined,
      };

      const updated = await subscriptionService.update(editingSubscription.subscriptionId, payload);
      setSubscriptions(prev => prev.map(s => s.subscriptionId === editingSubscription.subscriptionId ? updated : s));
      setIsSubEditModalOpen(false);
    } catch (err: any) {
      console.error('Failed to update subscription:', err);
      alert('Failed to update subscription: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = (sub: Subscription) => {
    triggerConfirm(
      'Cancel User Subscription',
      `Are you sure you want to cancel the subscription (SUB-${sub.subscriptionId}) for User #${sub.userId}? This will set its status to Cancelled.`,
      async () => {
        try {
          await subscriptionService.cancel(sub.subscriptionId);
          setSubscriptions(prev => prev.map(s => 
            s.subscriptionId === sub.subscriptionId ? { ...s, status: 0 } : s
          ));
        } catch (err: any) {
          console.error('Failed to cancel subscription:', err);
          alert('Could not cancel subscription.');
        }
      },
      'danger'
    );
  };

  const formatEpochDate = (epoch: string | number | undefined | null) => {
    if (!epoch) return 'N/A';
    const num = Number(epoch);
    if (isNaN(num)) return formatDate(String(epoch));
    const ms = num < 10000000000 ? num * 1000 : num;
    return formatDate(new Date(ms));
  };

  const userSubColumns: ColumnDef<Subscription>[] = [
    { 
      accessorKey: 'subscriptionId', 
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs font-semibold text-primary">SUB-{row.original.subscriptionId}</span>
    },
    { 
      accessorKey: 'userId', 
      header: 'User ID',
      cell: ({ row }) => <span className="text-muted-foreground">User #{row.original.userId}</span>
    },
    {
      accessorKey: 'planId',
      header: 'Plan',
      cell: ({ row }) => {
        const plan = plans.find(p => p.id === row.original.planId);
        return (
          <div>
            <span className="font-semibold text-sm">{plan?.plan_name || `Plan #${row.original.planId}`}</span>
            {plan?.plan_duration && <span className="text-xs text-muted-foreground block">{plan.plan_duration}</span>}
          </div>
        );
      }
    },
    { 
      accessorKey: 'price_amount', 
      header: 'Amount', 
      cell: ({ row }) => {
        const amt = row.original.paid_amount !== undefined ? row.original.paid_amount : row.original.price_amount;
        const cur = row.original.currency || 'USD';
        return (
          <span className="font-semibold text-sm font-mono text-white">
            {cur === 'INR' ? `₹${amt || 0}` : formatCurrency(amt || 0)}
          </span>
        );
      }
    },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const isActive = status === 1 || String(status).toLowerCase() === 'active';
        const isCancelled = status === 0 || String(status).toLowerCase() === 'cancelled';
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" :
            isCancelled ? "bg-red-500/10 text-red-500 border border-red-500/20" :
            "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
          )}>
            {isActive ? 'Active' : isCancelled ? 'Cancelled' : 'Expired'}
          </span>
        );
      }
    },
    {
      accessorKey: 'payment_status',
      header: 'Payment',
      cell: ({ row }) => {
        const payStatus = row.original.payment_status;
        const isSuccess = payStatus === 2 || String(payStatus).toLowerCase() === 'success';
        const isPending = payStatus === 1 || String(payStatus).toLowerCase() === 'pending';
        return (
          <span className={cn(
            "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase",
            isSuccess ? "bg-green-500/10 text-green-400 border border-green-500/10" :
            isPending ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/10" :
            "bg-red-500/10 text-red-400 border border-red-500/10"
          )}>
            {isSuccess ? 'Paid' : isPending ? 'Pending' : 'Failed'}
          </span>
        );
      }
    },
    { 
      accessorKey: 'payment_method', 
      header: 'Method',
      cell: ({ row }) => (
        <div>
          <span className="capitalize text-sm">{row.original.payment_method || 'N/A'}</span>
          {row.original.txnId && <span className="text-[10px] text-muted-foreground block font-mono leading-none mt-0.5">{row.original.txnId}</span>}
        </div>
      )
    },
    { 
      accessorKey: 'timestamp_from', 
      header: 'Valid From', 
      cell: ({ row }) => <span className="text-xs">{formatEpochDate(row.original.timestamp_from)}</span> 
    },
    { 
      accessorKey: 'timestamp_to', 
      header: 'Valid Until', 
      cell: ({ row }) => <span className="text-xs">{formatEpochDate(row.original.timestamp_to)}</span> 
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const isActive = row.original.status === 1 || String(row.original.status).toLowerCase() === 'active';
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleOpenSubEditModal(row.original)}
              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              title="Edit Subscription"
            >
              <Edit className="w-4 h-4" />
            </button>
            {isActive && (
              <button 
                onClick={() => handleCancelSubscription(row.original)}
                className="p-1.5 hover:bg-muted text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                title="Cancel Subscription"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions Manager</h1>
          <p className="text-muted-foreground mt-1">Manage billing tiers, pricing, and active user packages.</p>
        </div>
        <div className="flex items-center gap-3">
          {activeTab === 'plans' ? (
            <button 
              onClick={handleOpenPlanAddModal}
              className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Create New Plan
            </button>
          ) : (
            <button 
              onClick={handleOpenSubAddModal}
              className="bg-brand-gradient text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Subscription
            </button>
          )}
          <button 
            onClick={activeTab === 'plans' ? fetchPlans : fetchSubscriptions}
            className="p-2.5 hover:bg-muted rounded-xl border border-border/80 transition-colors text-white"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-5 h-5", (isLoadingPlans || isLoadingSubs) && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* TABS CONTAINER */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => router.push('/subscriptions?tab=plans')}
          className={cn(
            "px-6 py-3 text-sm font-semibold border-b-2 transition-all",
            activeTab === 'plans' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Billing Plans
        </button>
        <button
          onClick={() => router.push('/subscriptions?tab=users')}
          className={cn(
            "px-6 py-3 text-sm font-semibold border-b-2 transition-all",
            activeTab === 'users' 
              ? "border-primary text-primary" 
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          User Subscriptions
        </button>
      </div>

      {/* BILLING PLANS TAB */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {plansError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{plansError}</p>
            </div>
          )}

          {isLoadingPlans ? (
            <div className="flex justify-center py-20 bg-card rounded-3xl border border-border/60">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm font-medium">Loading subscription plans...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.length > 0 ? (
                plans.map((plan) => {
                  const isActive = plan.status === 1 || plan.status === 'active';
                  const planCurrency = currencies.find(c => c.code.toUpperCase() === (plan.currency || 'USD').toUpperCase());
                  const symbol = planCurrency?.symbol || plan.currency || '$';
                  return (
                    <div key={plan.id} className="relative group">
                      <div className={cn(
                        "absolute -inset-0.5 bg-brand-gradient rounded-2xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm",
                        !isActive && "opacity-0 group-hover:opacity-0"
                      )} />
                      <div className="relative bg-card border border-border rounded-2xl p-8 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-8">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                              <Shield className="w-6 h-6" />
                            </div>
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wider uppercase border",
                              isActive 
                                ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                : "bg-red-500/10 text-red-500 border-red-500/20"
                            )}>
                              {isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
        
                          <div className="space-y-2 mb-8">
                            <h3 className="text-2xl font-bold tracking-tight text-white">{plan.plan_name}</h3>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-extrabold text-white">{symbol}{plan.plan_price}</span>
                              <span className="text-muted-foreground text-sm font-medium">/ {plan.plan_duration}</span>
                            </div>
                          </div>
        
                          <div className="space-y-4 mb-8">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {plan.plan_description || 'No description provided.'}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span>Standard Quality Streams</span>
                            </div>
                          </div>
                        </div>
      
                        <div className="pt-6 border-t border-border/60 flex items-center justify-between gap-3">
                          <button 
                            onClick={() => handleOpenPlanEditModal(plan)}
                            className="flex-1 py-2 px-4 rounded-xl text-sm font-semibold border border-border hover:bg-muted hover:text-white transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleTogglePlanStatus(plan)}
                            className={cn(
                              "flex-1 py-2 px-4 rounded-xl text-sm font-semibold border transition-colors flex items-center justify-center gap-1.5",
                              isActive 
                                ? "border-red-500/20 text-red-400 hover:bg-red-500/10" 
                                : "border-green-500/20 text-green-400 hover:bg-green-500/10"
                            )}
                          >
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button 
                            onClick={() => handleDeletePlan(plan)}
                            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/40 hover:border-destructive/20 transition-all active:scale-95"
                            title="Delete Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-16 bg-muted/20 rounded-3xl border border-dashed border-border/85">
                  <Info className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No subscription plans found.</p>
                  <button 
                    onClick={handleOpenPlanAddModal} 
                    className="text-primary hover:underline font-semibold mt-2 text-sm"
                  >
                    Create a new plan now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* USER SUBSCRIPTIONS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {subsError && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{subsError}</p>
            </div>
          )}

          {isLoadingSubs ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl border border-dashed border-border">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-muted-foreground">Loading transaction history...</p>
            </div>
          ) : (
            <DataTable columns={userSubColumns} data={subscriptions} searchPlaceholder="Search by ID or User..." />
          )}
        </div>
      )}

      {/* --- ADD PLAN MODAL --- */}
      {isPlanAddModalOpen && (
        <>
          <div 
            onClick={() => setIsPlanAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Create New Plan
              </h3>
              <button 
                onClick={() => setIsPlanAddModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddPlan} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Plan Name</label>
                <input 
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Starter Plan"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={planPrice}
                    onChange={(e) => setPlanPrice(e.target.value)}
                    placeholder="e.g. 29"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={planCurrSearchQuery}
                      onChange={(e) => {
                        setPlanCurrSearchQuery(e.target.value);
                        setIsPlanCurrDropdownOpen(true);
                      }}
                      onFocus={() => setIsPlanCurrDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsPlanCurrDropdownOpen(false), 200)}
                      placeholder={planCurrencyInput || "e.g. USD"}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white font-semibold font-mono"
                    />
                  </div>
                  {isPlanCurrDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-[70] p-1 divide-y divide-border/30">
                      {currencies.filter(c => 
                        c.name.toLowerCase().includes(planCurrSearchQuery.toLowerCase()) ||
                        c.code.toLowerCase().includes(planCurrSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        currencies.filter(c => 
                          c.name.toLowerCase().includes(planCurrSearchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(planCurrSearchQuery.toLowerCase())
                        ).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setPlanCurrencyInput(c.code);
                              setPlanCurrSearchQuery(c.code);
                              setIsPlanCurrDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors flex items-center justify-between text-white"
                          >
                            <span className="font-semibold">{c.code} ({c.symbol})</span>
                            <span className="text-[10px] text-muted-foreground">{c.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duration
                  </label>
                  <select
                    value={planDuration}
                    onChange={(e) => setPlanDuration(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white h-[38px]"
                  >
                    <option value="1 Month" className="bg-card">1 Month</option>
                    <option value="3 Months" className="bg-card">3 Months</option>
                    <option value="6 Months" className="bg-card">6 Months</option>
                    <option value="1 Year" className="bg-card">1 Year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea 
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Summarize plan features..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsPlanAddModalOpen(false)}
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
                  {isSubmitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- EDIT PLAN MODAL --- */}
      {isPlanEditModalOpen && editingPlan && (
        <>
          <div 
            onClick={() => setIsPlanEditModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Plan: {editingPlan.plan_name}
              </h3>
              <button 
                onClick={() => setIsPlanEditModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPlan} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Plan Name</label>
                <input 
                  type="text"
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  placeholder="e.g. Starter Plan"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={editPlanPrice}
                    onChange={(e) => setEditPlanPrice(e.target.value)}
                    placeholder="e.g. 29"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={editPlanCurrSearchQuery}
                      onChange={(e) => {
                        setEditPlanCurrSearchQuery(e.target.value);
                        setIsEditPlanCurrDropdownOpen(true);
                      }}
                      onFocus={() => setIsEditPlanCurrDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsEditPlanCurrDropdownOpen(false), 200)}
                      placeholder={editPlanCurrencyInput || "e.g. USD"}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white font-semibold font-mono"
                    />
                  </div>
                  {isEditPlanCurrDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-[70] p-1 divide-y divide-border/30">
                      {currencies.filter(c => 
                        c.name.toLowerCase().includes(editPlanCurrSearchQuery.toLowerCase()) ||
                        c.code.toLowerCase().includes(editPlanCurrSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        currencies.filter(c => 
                          c.name.toLowerCase().includes(editPlanCurrSearchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(editPlanCurrSearchQuery.toLowerCase())
                        ).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setEditPlanCurrencyInput(c.code);
                              setEditPlanCurrSearchQuery(c.code);
                              setIsEditPlanCurrDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors flex items-center justify-between text-white"
                          >
                            <span className="font-semibold">{c.code} ({c.symbol})</span>
                            <span className="text-[10px] text-muted-foreground">{c.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duration
                  </label>
                  <select
                    value={editPlanDuration}
                    onChange={(e) => setEditPlanDuration(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white h-[38px]"
                  >
                    <option value="1 Month" className="bg-card">1 Month</option>
                    <option value="3 Months" className="bg-card">3 Months</option>
                    <option value="6 Months" className="bg-card">6 Months</option>
                    <option value="1 Year" className="bg-card">1 Year</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                <textarea 
                  value={editPlanDescription}
                  onChange={(e) => setEditPlanDescription(e.target.value)}
                  placeholder="Summarize plan features..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsPlanEditModalOpen(false)}
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

      {/* --- USER SUB ADD MODAL --- */}
      {isSubAddModalOpen && (
        <>
          <div 
            onClick={() => setIsSubAddModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Create User Subscription
              </h3>
              <button 
                onClick={() => setIsSubAddModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddSubscription} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  User ID
                </label>
                <input 
                  type="number"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  Select Plan
                </label>
                <select
                  value={planIdInput}
                  onChange={(e) => setPlanIdInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  required
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id} className="bg-card text-white">
                      {plan.plan_name} (${plan.plan_price}) - {plan.plan_duration}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    Payment Method
                  </label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  >
                    <option value="Razorpay" className="bg-card">Razorpay</option>
                    <option value="Stripe" className="bg-card">Stripe</option>
                    <option value="PayPal" className="bg-card">PayPal</option>
                    <option value="Manual" className="bg-card">Manual</option>
                    <option value="N/A" className="bg-card">N/A</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" />
                    Txn ID / Details
                  </label>
                  <input 
                    type="text"
                    value={paymentDetailsInput}
                    onChange={(e) => setPaymentDetailsInput(e.target.value)}
                    placeholder="e.g. txn_12345"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Valid From
                  </label>
                  <input 
                    type="date"
                    value={dateFromInput}
                    onChange={(e) => setDateFromInput(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Valid Until
                  </label>
                  <input 
                    type="date"
                    value={dateToInput}
                    onChange={(e) => setDateToInput(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5 relative">
                  <label className="text-[11px] font-semibold text-muted-foreground">Currency</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={currSearchQuery}
                      onChange={(e) => {
                        setCurrSearchQuery(e.target.value);
                        setIsCurrDropdownOpen(true);
                      }}
                      onFocus={() => setIsCurrDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsCurrDropdownOpen(false), 200)}
                      placeholder={currencyInput || "e.g. INR"}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white font-semibold font-mono"
                    />
                  </div>
                  {isCurrDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-[70] p-1 divide-y divide-border/30">
                      {currencies.filter(c => 
                        c.name.toLowerCase().includes(currSearchQuery.toLowerCase()) ||
                        c.code.toLowerCase().includes(currSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        currencies.filter(c => 
                          c.name.toLowerCase().includes(currSearchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(currSearchQuery.toLowerCase())
                        ).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCurrencyInput(c.code);
                              setCurrSearchQuery(c.code);
                              setIsCurrDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors flex items-center justify-between text-white"
                          >
                            <span className="font-semibold">{c.code} ({c.symbol})</span>
                            <span className="text-[10px] text-muted-foreground">{c.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Override Price</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={priceAmountInput}
                    onChange={(e) => setPriceAmountInput(e.target.value)}
                    placeholder="Plan Price"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground">Override Paid</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    placeholder="Amt Paid"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsSubAddModalOpen(false)}
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
                  {isSubmitting ? 'Creating...' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* --- USER SUB EDIT MODAL --- */}
      {isSubEditModalOpen && editingSubscription && (
        <>
          <div 
            onClick={() => setIsSubEditModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-50 animate-in zoom-in-95 duration-200 text-white">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-primary" />
                Edit Subscription: SUB-{editingSubscription.subscriptionId}
              </h3>
              <button 
                onClick={() => setIsSubEditModalOpen(false)}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSubscription} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Subscription Status</label>
                <select
                  value={subStatusInput}
                  onChange={(e) => setSubStatusInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                >
                  <option value="1" className="bg-card">Active (1)</option>
                  <option value="0" className="bg-card">Cancelled (0)</option>
                  <option value="2" className="bg-card">Expired (2)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Payment Status</label>
                <select
                  value={subPaymentStatusInput}
                  onChange={(e) => setSubPaymentStatusInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                >
                  <option value="1" className="bg-card">Pending (1)</option>
                  <option value="2" className="bg-card">Success / Paid (2)</option>
                  <option value="3" className="bg-card">Failed (3)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Transaction ID (txnId)</label>
                <input 
                  type="text"
                  value={subTxnIdInput}
                  onChange={(e) => setSubTxnIdInput(e.target.value)}
                  placeholder="e.g. txn_0987654321"
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-xs font-semibold text-muted-foreground">Currency</label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={editCurrSearchQuery}
                      onChange={(e) => {
                        setEditCurrSearchQuery(e.target.value);
                        setIsEditCurrDropdownOpen(true);
                      }}
                      onFocus={() => setIsEditCurrDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsEditCurrDropdownOpen(false), 200)}
                      placeholder={subCurrencyInput || "e.g. INR"}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white font-semibold font-mono"
                    />
                  </div>
                  {isEditCurrDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-card border border-border rounded-xl shadow-2xl z-[70] p-1 divide-y divide-border/30">
                      {currencies.filter(c => 
                        c.name.toLowerCase().includes(editCurrSearchQuery.toLowerCase()) ||
                        c.code.toLowerCase().includes(editCurrSearchQuery.toLowerCase())
                      ).length > 0 ? (
                        currencies.filter(c => 
                          c.name.toLowerCase().includes(editCurrSearchQuery.toLowerCase()) ||
                          c.code.toLowerCase().includes(editCurrSearchQuery.toLowerCase())
                        ).map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSubCurrencyInput(c.code);
                              setEditCurrSearchQuery(c.code);
                              setIsEditCurrDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors flex items-center justify-between text-white"
                          >
                            <span className="font-semibold">{c.code} ({c.symbol})</span>
                            <span className="text-[10px] text-muted-foreground">{c.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-xs text-muted-foreground text-center">No results found</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Paid Amount</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={subPaidAmountInput}
                    onChange={(e) => setSubPaidAmountInput(e.target.value)}
                    placeholder="e.g. 14.99"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ring-primary/20 transition-all text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                <button
                  type="button"
                  onClick={() => setIsSubEditModalOpen(false)}
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
            <div className={cn(
              "flex items-center gap-3 mb-3",
              confirmActionType === 'danger' ? "text-destructive" : "text-primary"
            )}>
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
                className={cn(
                  "px-5 py-2.5 rounded-xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]",
                  confirmActionType === 'danger' 
                    ? "bg-destructive hover:bg-destructive/90 text-white" 
                    : "bg-brand-gradient text-white shadow-lg shadow-primary/20"
                )}
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

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[400px] bg-card border border-border rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SubscriptionsContent />
    </Suspense>
  );
}
