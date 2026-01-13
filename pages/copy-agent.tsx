"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/router';
import { Check, User, Building2, Sliders, Wallet, Eye, Rocket, Twitter, Search, Plus as PlusIcon, X, Shield, Send, Activity, TrendingUp } from 'lucide-react';
import { Header } from '@components/Header';
// Removed deployment-related components since they depend on backend services
// Using local mock components instead of backend-dependent ones
import { TopTradersSelector } from '@components/TopTradersSelector';
import { FaXTwitter } from 'react-icons/fa6';
import dynamic from 'next/dynamic';
import { STATUS } from 'react-joyride';
import type { CallBackProps, Step as JoyrideStep } from 'react-joyride';

// Simplified schema without backend dependencies
const wizardSchema = z.object({
  name: z.string().min(1, 'Agent name is required').max(100),
  description: z.string().max(500).optional(),
  venue: z.enum(['MULTI', 'OSTIUM', 'HYPERLIQUID', 'GMX', 'SPOT']),
  weights: z.array(z.number()).length(8),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED']),
  creatorWallet: z.string().min(1, 'Creator wallet is required'),
  profitReceiverAddress: z.string().min(1, 'Profit receiver address is required'),
});

type WizardFormData = z.infer<typeof wizardSchema>;

// Mock Research Institute Selector Component
function MockResearchInstituteSelector({ selectedIds, onChange }: { selectedIds: string[], onChange: (ids: string[]) => void }) {
  const mockInstitutes = [
    { id: 'inst1', name: 'Alpha Research Labs', description: 'Leading crypto research institute', x_handle: 'alpharesearch' },
    { id: 'inst2', name: 'DeFi Analytics', description: 'Specialized in DeFi protocol analysis', x_handle: 'defianalytics' },
    { id: 'inst3', name: 'Blockchain Insights', description: 'Market intelligence and trading signals', x_handle: 'blockchaininsights' },
    { id: 'inst4', name: 'Crypto Strategy Group', description: 'Professional trading strategies', x_handle: 'cryptostrategy' },
  ];

  const toggleInstitute = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {mockInstitutes.map(inst => (
        <div key={inst.id} className={`p-4 border transition-all cursor-pointer ${selectedIds.includes(inst.id) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`} onClick={() => toggleInstitute(inst.id)}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-[var(--text-primary)]">{inst.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{inst.description}</p>
              <a href={`https://x.com/${inst.x_handle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:underline mt-2 inline-flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <Twitter className="h-3 w-3" />@{inst.x_handle}
              </a>
            </div>
            {selectedIds.includes(inst.id) && <Check className="h-5 w-5 text-[var(--accent)] flex-shrink-0" />}
          </div>
        </div>
      ))}
    </div>
  );
}

// Mock Telegram Alpha User Selector Component  
function MockTelegramAlphaUserSelector({ selectedIds, onToggle }: { selectedIds: Set<string>, onToggle: (id: string) => void }) {
  const mockUsers = [
    { id: 'tg1', telegram_username: 'alpha_trader_1', first_name: 'Alpha', last_name: 'Trader', credit_price: '500' },
    { id: 'tg2', telegram_username: 'crypto_signals', first_name: 'Crypto', last_name: 'Signals', credit_price: '750' },
    { id: 'tg3', telegram_username: 'defi_whale', first_name: 'DeFi', last_name: 'Whale', credit_price: '1000' },
    { id: 'tg4', telegram_username: 'market_maven', first_name: 'Market', last_name: 'Maven', credit_price: '300' },
  ];

  return (
    <div className="space-y-3">
      {mockUsers.map(user => {
        const displayName = user.telegram_username ? `@${user.telegram_username}` : `${user.first_name} ${user.last_name}`.trim();
        const isSelected = selectedIds.has(user.id);
        return (
          <div key={user.id} className={`p-4 border transition-all cursor-pointer ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`} onClick={() => onToggle(user.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Send className="h-4 w-4 text-[var(--accent)]" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)]">{displayName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{Number(user.credit_price)} credits</p>
                </div>
              </div>
              {isSelected && <Check className="h-5 w-5 text-[var(--accent)] flex-shrink-0" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mock CT Account Selector Component
function MockCtAccountSelector({ selectedIds, onToggle, onNext, onBack }: { selectedIds: Set<string>, onToggle: (id: string) => void, onNext: () => void, onBack: () => void }) {
  const mockAccounts = [
    { id: 'ct1', xUsername: 'cryptotrader', displayName: 'Crypto Trader Pro', followersCount: 45000 },
    { id: 'ct2', xUsername: 'defi_degen', displayName: 'DeFi Degen', followersCount: 32000 },
    { id: 'ct3', xUsername: 'alpha_hunter', displayName: 'Alpha Hunter', followersCount: 78000 },
    { id: 'ct4', xUsername: 'yield_farmer', displayName: 'Yield Farmer', followersCount: 23000 },
    { id: 'ct5', xUsername: 'nft_whale', displayName: 'NFT Whale', followersCount: 56000 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl mb-2">CT ACCOUNTS</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-6">Select CT accounts your agent should mirror.</p>

      <div className="space-y-3">
        {mockAccounts.map(acc => {
          const isSelected = selectedIds.has(acc.id);
          return (
            <div key={acc.id} className={`p-4 border transition-all cursor-pointer ${isSelected ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] hover:border-[var(--accent)]/50'}`} onClick={() => onToggle(acc.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <FaXTwitter className="h-4 w-4 text-[var(--accent)]" />
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">@{acc.xUsername}</p>
                    {acc.displayName && <p className="text-xs text-[var(--text-secondary)]">{acc.displayName}</p>}
                    <p className="text-xs text-[var(--text-muted)] mt-1">{acc.followersCount.toLocaleString()} followers</p>
                  </div>
                </div>
                {isSelected && <Check className="h-5 w-5 text-[var(--accent)] flex-shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.size === 0 && (
        <p className="text-sm text-[var(--accent)]">⚠️ Select at least one CT account</p>
      )}

      <div className="flex gap-4">
        <button type="button" onClick={onBack} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
        <button type="button" onClick={onNext} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
      </div>
    </div>
  );
}

export default function CopyAgent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [runJoyride, setRunJoyride] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Track which wizard steps have completed the tour (per-step)
  const [completedTourSteps, setCompletedTourSteps] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Removed deployment modal state variables

  // Removed proof of intent since it requires wallet signing
  // Removed database import since we're not using backend services

  const [selectedCtAccounts, setSelectedCtAccounts] = useState<Set<string>>(new Set());
  const [selectedResearchInstitutes, setSelectedResearchInstitutes] = useState<string[]>([]);
  const [selectedTelegramUsers, setSelectedTelegramUsers] = useState<Set<string>>(new Set());
  const [selectedTopTraders, setSelectedTopTraders] = useState<string[]>([]);

  const Joyride = dynamic(() => import('react-joyride'), { ssr: false });

  // Detailed data for review step
  const [reviewData, setReviewData] = useState<{
    researchInstitutes: Array<{ id: string; name: string; description: string | null; x_handle: string | null }>;
    ctAccounts: Array<{ id: string; xUsername: string; displayName: string | null; followersCount: number | null }>;
    telegramUsers: Array<{ id: string; telegram_username: string | null; first_name: string | null; last_name: string | null; credit_price?: string }>;
    topTraders: Array<{ id: string; walletAddress: string; impactFactor: number; totalPnl: string; totalTrades: number }>;
  }>({
    researchInstitutes: [],
    ctAccounts: [],
    telegramUsers: [],
    topTraders: [],
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      description: '',
      venue: 'MULTI',
      weights: [50, 50, 50, 50, 50, 50, 50, 50],
      status: 'DRAFT',
      creatorWallet: '',
      profitReceiverAddress: '',
    },
  });

  const formData = watch();

  // Removed wallet auto-population since we're not using authentication

  // Joyride: ensure client-side only & load per-step completion flags
  useEffect(() => {
    setIsMounted(true);
    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('createAgentTourCompletedSteps');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const validSteps = parsed.filter(
              (n: unknown) => typeof n === 'number' && n >= 1 && n <= 9
            ) as number[];
            setCompletedTourSteps(validSteps);
          }
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Joyride: retrigger on step change if this step's tour hasn't been completed
  useEffect(() => {
    if (!isMounted) return;
    if (completedTourSteps.includes(step)) return;

    // Reset and restart joyride with a longer delay to prevent flickering
    setRunJoyride(false);
    const timer = setTimeout(() => {
      setRunJoyride(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [step, isMounted, completedTourSteps]);

  const toggleCtAccount = (accountId: string) => {
    const newSelected = new Set(selectedCtAccounts);
    if (newSelected.has(accountId)) newSelected.delete(accountId);
    else newSelected.add(accountId);
    setSelectedCtAccounts(newSelected);
  };

  // Removed proof of intent creation function

  const onSubmit = async (data: WizardFormData) => {
    const isValid = await trigger();
    if (!isValid) {
      if (errors.name) setStep(1);
      else if (errors.venue) setStep(2);
      else if (errors.creatorWallet) setStep(7);
      setError('Please fix the validation errors');
      return;
    }
    if (selectedResearchInstitutes.length === 0) {
      setError('Please select at least one research institute');
      setStep(4);
      return;
    }
    if (selectedCtAccounts.size === 0) {
      setError('Please select at least one CT account');
      setStep(5);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Simulate agent creation without backend
    try {
      // Create a mock agent ID
      const mockAgentId = `agent-${Date.now()}`;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Agent created (mock):', {
        id: mockAgentId,
        name: data.name,
        description: data.description,
        venue: data.venue,
        creatorWallet: data.creatorWallet,
        profitReceiverAddress: data.profitReceiverAddress,
        selectedResearchInstitutes,
        selectedCtAccounts: Array.from(selectedCtAccounts),
        selectedTelegramUsers: Array.from(selectedTelegramUsers),
        selectedTopTraders
      });

      setCreatedAgentId(mockAgentId);
      setShowDeployModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Removed Ostium approval modal state

  // Removed Ostium deployment function since it requires backend API

  const handleDeploy = () => {
    if (createdAgentId) {
      setShowDeployModal(false);
      // Simplified deployment - just redirect to a mock deployment page
      console.log('Deploying agent:', createdAgentId, 'with venue:', formData.venue);
      // In a real scenario without backend, you might redirect to a different page
      // or show a different success message
      router.push('/dashboard');
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) isValid = await trigger('name');
    else if (step === 2) isValid = await trigger('venue');
    else if (step === 3) {
      // Top traders is optional, so always valid
      isValid = true;
    } else if (step === 4) {
      if (selectedResearchInstitutes.length === 0) {
        setError('Please select at least one research institute');
        return;
      }
      isValid = true;
    } else if (step === 5) {
      if (selectedCtAccounts.size === 0) {
        setError('Please select at least one CT account');
        return;
      }
      isValid = true;
    } else if (step === 6) isValid = true;
    else if (step === 7) {
      const validWallet = await trigger('creatorWallet');
      const validProfit = await trigger('profitReceiverAddress');
      isValid = validWallet && validProfit;
    } else if (step === 8) isValid = true; // Skip proof of intent validation

    if (isValid && step < 9) {
      setStep(step + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const steps = [
    { number: 1, label: 'BASIC', icon: User },
    { number: 2, label: 'VENUE', icon: Building2 },
    { number: 3, label: 'TOP TRADERS', icon: TrendingUp },
    { number: 4, label: 'STRATEGY', icon: Sliders },
    { number: 5, label: 'CT', icon: FaXTwitter },
    { number: 6, label: 'TELEGRAM', icon: Send },
    { number: 7, label: 'WALLET', icon: Wallet },
    { number: 8, label: 'CONFIRM', icon: Shield },
    { number: 9, label: 'REVIEW', icon: Eye },
  ];

  const joyrideSteps: JoyrideStep[] = [
    {
      target: '[data-tour="step-1"]',
      content: 'Start by naming your agent and describing its trading style. This helps you recognize it later.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-2"]',
      content: 'Choose where your agent will route trades. Multi-venue automatically picks the best venue.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-3"]',
      content: 'Select top traders to follow. These traders will act as signal providers for your agent.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-4"]',
      content: 'Select research institutes whose signals your agent will follow with a fixed allocation.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-5"]',
      content: 'Pick CT accounts to mirror. Your agent will react when these accounts post signals.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-6"]',
      content: 'Connect Telegram alpha sources whose DM signals your agent should execute.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-7"]',
      content: 'Set the owner wallet and profit receiver for this agent.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-8"]',
      content: 'Confirm your Alpha Club configuration before proceeding to create it.',
      disableBeacon: true,
      placement: 'top',
    },
    {
      target: '[data-tour="step-9"]',
      content: 'Review every choice before creating your agent. Use Edit to jump back and adjust.',
      disableBeacon: true,
      placement: 'top',
    },
  ];

  const stepDescriptions: Record<number, string> = {
    1: 'Name your agent and optionally describe its trading style.',
    2: 'Choose where your agent will execute trades.',
    3: 'Select top traders to follow as signal providers.',
    4: 'Select research institutes whose signals will drive your agent.',
    5: 'Pick CT accounts your agent should mirror.',
    6: 'Connect Telegram alpha sources your agent will listen to.',
    7: 'Configure the wallet that owns the agent and receives profits.',
    8: 'Confirm your Alpha Club configuration.',
    9: 'Review all settings before creating your agent.',
  };

  // When user reaches the final step, refresh review data (but don't change tour visibility)
  useEffect(() => {
    if (step === 9) {
      fetchReviewData();
    }
  }, [step]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action } = data;

    // Only handle completion, ignore all other events to prevent interference
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRunJoyride(false);
      try {
        if (typeof window !== 'undefined') {
          // Mark this specific step as completed and persist
          setCompletedTourSteps((prev) => {
            if (prev.includes(step)) return prev;
            const updated = [...prev, step];
            window.localStorage.setItem(
              'createAgentTourCompletedSteps',
              JSON.stringify(updated)
            );
            return updated;
          });
        }
      } catch (e) {
        console.log("Error saving tour progress:", e);
      }
    }
  };

  const fetchReviewData = async () => {
    // Mock data for review since we removed backend API calls
    try {
      // Mock research institutes
      const mockResearchInstitutes = selectedResearchInstitutes.map(id => ({
        id,
        name: `Research Institute ${id}`,
        description: `Mock description for research institute ${id}`,
        x_handle: `institute_${id}`
      }));

      // Mock CT accounts
      const mockCtAccounts = Array.from(selectedCtAccounts).map(id => ({
        id,
        xUsername: `ct_user_${id}`,
        displayName: `CT User ${id}`,
        followersCount: Math.floor(Math.random() * 100000)
      }));

      // Mock telegram users
      const mockTelegramUsers = Array.from(selectedTelegramUsers).map(id => ({
        id,
        telegram_username: `tg_user_${id}`,
        first_name: `User`,
        last_name: id,
        credit_price: Math.floor(Math.random() * 1000).toString()
      }));

      // Mock top traders
      const mockTopTraders = selectedTopTraders.map(id => ({
        id,
        walletAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        impactFactor: Math.random() * 10,
        totalPnl: (Math.random() * 1000000).toString(),
        totalTrades: Math.floor(Math.random() * 1000)
      }));

      setReviewData({
        researchInstitutes: mockResearchInstitutes,
        ctAccounts: mockCtAccounts,
        telegramUsers: mockTelegramUsers,
        topTraders: mockTopTraders,
      });
    } catch (err) {
      console.error('Failed to fetch review data', err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] border border-[var(--border)]">
      <Header />
      {isMounted && !completedTourSteps.includes(step) && (
        <Joyride
          steps={[joyrideSteps[step - 1]]}
          run={runJoyride}
          continuous={false}
          showSkipButton={false}
          showProgress={false}
          hideBackButton
          disableOverlayClose
          disableScrolling={true}
          disableScrollParentFix={true}
          scrollToFirstStep={false}
          scrollOffset={0}
          callback={handleJoyrideCallback}
          floaterProps={{
            disableAnimation: true,
            options: {
              preventOverflow: {
                enabled: true,
                boundariesElement: 'viewport',
                padding: 20,
              },
              flip: {
                enabled: true,
              },
            },
          }}
          styles={{
            options: {
              zIndex: 10000,
              primaryColor: 'var(--accent)',
              backgroundColor: 'var(--bg-elevated)',
              textColor: 'var(--text-primary)',
              arrowColor: 'var(--bg-elevated)',
            },
            tooltip: {
              padding: 20,
              border: '1px solid var(--border)',
              boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
              borderRadius: '8px',
              maxWidth: 'min(320px, calc(100vw - 20px))',
              width: 'auto',
              minWidth: '250px',
            },
            tooltipContainer: {
              textAlign: 'left',
            },
            buttonNext: {
              backgroundColor: 'var(--accent)',
              color: 'var(--bg-deep)',
              fontWeight: 'bold',
              padding: '8px 18px',
              borderRadius: '4px',
              border: 'none',
            },
            beacon: {
              display: 'none',
            },
            overlay: {
              display: 'none',
            },
            spotlight: {
              display: 'none',
            },
          }}
        />
      )}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="data-label mb-2">ALPHA CLUB WIZARD</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">CREATE YOUR CLUB</h1>
          <p className="text-[var(--text-secondary)]">Configure your Alpha Club's trading strategy</p>
        </div>

        {/* Progress */}
        <div className="mb-12">
          <div className="relative">
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--border)]" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-[var(--accent)] transition-all duration-500"
              style={{ width: `calc(${((step - 1) / (steps.length - 1)) * 100}% - 32px)` }}
            />
            <div className="relative flex justify-between">
              {steps.map((s) => {
                const Icon = s.icon;
                const isCompleted = s.number < step;
                const isCurrent = s.number === step;
                return (
                  <div key={s.number} className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 flex items-center justify-center transition-all border ${isCompleted
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-deep)]'
                        : isCurrent
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                        }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <span className={`mt-2 text-[10px] font-bold hidden sm:block ${isCurrent ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--text-muted)]">
              STEP {step} OF {steps.length} · {steps.find((s) => s.number === step)?.label}
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {stepDescriptions[step]}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 border border-[var(--danger)] bg-[var(--danger)]/10 rounded">
            <p className="text-[var(--danger)] text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6" data-tour="step-1">
              <h2 className="font-display text-2xl mb-6">BASIC INFORMATION</h2>
              <div>
                <label className="data-label block mb-2">CLUB NAME *</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  placeholder="Alpha Momentum Club"
                />
                {errors.name && <p className="text-[var(--danger)] text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="data-label block mb-2">DESCRIPTION (OPTIONAL)</label>
                <textarea
                  {...register('description')}
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors resize-none"
                  placeholder="Describe your club's trading strategy..."
                  rows={4}
                />
              </div>
              <button type="button" onClick={nextStep} className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">
                NEXT →
              </button>
            </div>
          )}

          {/* Step 2: Venue */}
          {step === 2 && (
            <div className="space-y-6" data-tour="step-2">
              <h2 className="font-display text-2xl mb-6">TRADING VENUE</h2>
              <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-6 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <h3 className="font-bold text-lg text-[var(--text-primary)]">MULTI-VENUE (RECOMMENDED)</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Agent routes to best venue automatically</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                  <p className="flex items-center gap-2"><span className="text-[var(--accent)]">✓</span> Hyperliquid Perpetuals (220+ pairs)</p>
                  <p className="flex items-center gap-2"><span className="text-[var(--accent)]">✓</span> Ostium Synthetics (41 pairs)</p>
                  <p className="flex items-center gap-2"><span className="text-[var(--accent)]">✓</span> Intelligent routing for best liquidity</p>
                </div>
              </div>
              <input type="hidden" {...register('venue')} value="MULTI" />
              <details className="group">
                <summary className="cursor-pointer p-4 bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors">
                  <span className="text-sm font-bold text-[var(--text-primary)]">ADVANCED: SINGLE VENUE</span>
                </summary>
                <div className="mt-4 space-y-3 p-4 bg-[var(--bg-elevated)] border border-[var(--border)]">
                  {['OSTIUM', 'HYPERLIQUID', 'GMX', 'SPOT', 'MULTI'].map((venue) => {
                    const isOstium = venue === 'OSTIUM';
                    const isDisabled = !isOstium;

                    return (
                      <label
                        key={venue}
                        className={`
                        block p-4 border transition-all relative
                        ${isOstium && formData.venue === venue
                            ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_10px_rgba(0,255,136,0.1)] cursor-pointer'
                            : isOstium
                              ? 'border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-surface)] cursor-pointer'
                              : 'border-[var(--border)] bg-[var(--bg-elevated)] opacity-50 cursor-not-allowed'
                          }
                      `}
                      >
                        <input
                          type="radio"
                          {...register('venue')}
                          value={venue}
                          disabled={isDisabled}
                          className="sr-only"
                        />
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--text-primary)]">{venue}</span>
                          {isDisabled && (
                            <span className="text-xs text-[var(--text-muted)] font-medium">COMING SOON</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </details>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 3: Top Traders */}
          {step === 3 && (
            <div className="space-y-6" data-tour="step-3">
              <h2 className="font-display text-2xl mb-2">TOP TRADERS</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Select top traders to follow. These traders will act as signal providers for your agent.</p>
              <TopTradersSelector selectedIds={selectedTopTraders} onChange={setSelectedTopTraders} />
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 4: Research Institutes */}
          {step === 4 && (
            <div className="space-y-6" data-tour="step-4">
              <h2 className="font-display text-2xl mb-2">RESEARCH INSTITUTES</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Choose which institutes your agent should follow for signals.</p>
              <MockResearchInstituteSelector selectedIds={selectedResearchInstitutes} onChange={setSelectedResearchInstitutes} />
              {selectedResearchInstitutes.length === 0 && (
                <p className="text-sm text-[var(--accent)]">⚠️ Select at least one institute</p>
              )}
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 5: CT Accounts */}
          {step === 5 && (
            <div data-tour="step-5">
              <MockCtAccountSelector
                selectedIds={selectedCtAccounts}
                onToggle={toggleCtAccount}
                onNext={nextStep}
                onBack={prevStep}
              />
            </div>
          )}

          {/* Step 6: Telegram */}
          {step === 6 && (
            <div className="space-y-6" data-tour="step-6">
              <h2 className="font-display text-2xl mb-2">TELEGRAM ALPHA</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Select Telegram users whose DM signals your agent should follow.</p>
              <MockTelegramAlphaUserSelector
                selectedIds={selectedTelegramUsers}
                onToggle={(id) => {
                  const newSelected = new Set(selectedTelegramUsers);
                  if (newSelected.has(id)) newSelected.delete(id);
                  else newSelected.add(id);
                  setSelectedTelegramUsers(newSelected);
                }}
              />
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 7: Wallet */}
          {step === 7 && (
            <div className="space-y-6" data-tour="step-7">
              <h2 className="font-display text-2xl mb-6">WALLET SETUP</h2>
              <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)] mb-4">
                <p className="text-sm text-[var(--text-secondary)]">Enter the wallet addresses manually for your Alpha Club configuration.</p>
              </div>
              <div>
                <label className="data-label block mb-2">CLUB OWNER WALLET *</label>
                <input
                  type="text"
                  {...register('creatorWallet')}
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--border)] font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  placeholder="0x..."
                />
                {errors.creatorWallet && <p className="text-[var(--danger)] text-sm mt-1">{errors.creatorWallet.message}</p>}
              </div>
              <div>
                <label className="data-label block mb-2">PROFIT RECEIVER * <span className="text-[var(--text-muted)]">(20% of profits)</span></label>
                <input
                  type="text"
                  {...register('profitReceiverAddress')}
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--border)] font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  placeholder="0x..."
                />
                {errors.profitReceiverAddress && <p className="text-[var(--danger)] text-sm mt-1">{errors.profitReceiverAddress.message}</p>}
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 8: Confirmation */}
          {step === 8 && (
            <div className="space-y-6" data-tour="step-8">
              <h2 className="font-display text-2xl mb-6">CONFIRMATION</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Confirm that you want to create this Alpha Club with the selected configuration.</p>

              <div className="space-y-4">
                <div className="p-4 border border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-[var(--accent)]">READY TO CREATE</p>
                      <p className="text-sm text-[var(--text-secondary)]">Your Alpha Club configuration is complete</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold mb-2 text-[var(--text-primary)]">WHAT HAPPENS NEXT?</p>
                      <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                        <li>• Your Alpha Club will be created with the selected configuration</li>
                        <li>• All selected signal sources will be linked to your club</li>
                        <li>• You can deploy and activate your club after creation</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 9: Review */}
          {step === 9 && (
            <div className="space-y-6" data-tour="step-9">
              <h2 className="font-display text-2xl mb-2">REVIEW</h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Review your Alpha Club configuration. To change anything, jump back to a step below or use the Edit
                  controls on each card.
                </p>
                <div className="flex items-center gap-2">
                  <label className="data-label text-xs">JUMP TO STEP</label>
                  <select
                    className="px-3 py-2 bg-[var(--bg-deep)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    value=""
                    onChange={(e) => {
                      const targetStep = Number(e.target.value);
                      if (!Number.isNaN(targetStep) && targetStep >= 1 && targetStep <= 8) {
                        setStep(targetStep);
                      }
                    }}
                  >
                    <option value="">Select…</option>
                    {steps
                      .filter((s) => s.number !== 9)
                      .map((s) => (
                        <option key={s.number} value={s.number}>
                          {s.number}. {s.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">BASIC INFORMATION</p>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-bold text-[var(--text-primary)] mb-1">{formData.name || 'Untitled club'}</p>
                  {formData.description && (
                    <p className="text-sm text-[var(--text-secondary)]">{formData.description}</p>
                  )}
                </div>

                {/* Venue */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">TRADING VENUE</p>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">{formData.venue}</p>
                </div>

                {/* Top Traders */}
                {selectedTopTraders.length > 0 && (
                  <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                    <div className="flex items-center justify-between mb-2">
                      <p className="data-label">
                        TOP TRADERS ({selectedTopTraders.length} selected)
                      </p>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="text-xs text-[var(--accent)] hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    {reviewData.topTraders.length > 0 ? (
                      <div className="space-y-2 mt-3">
                        {reviewData.topTraders.map((trader) => {
                          const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
                          const formatNumber = (val: string) => {
                            const num = parseFloat(val);
                            if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
                            if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
                            return `$${num.toFixed(2)}`;
                          };
                          return (
                            <div
                              key={trader.id}
                              className="p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded flex items-start justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <Wallet className="h-4 w-4 text-[var(--accent)] mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-[var(--text-primary)] font-mono text-sm">
                                    {formatAddress(trader.walletAddress)}
                                  </p>
                                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-[var(--text-secondary)]">
                                    <span>IF: {trader.impactFactor.toFixed(2)}</span>
                                    <span>PnL: {formatNumber(trader.totalPnl)}</span>
                                    <span>Trades: {trader.totalTrades}</span>
                                  </div>
                                </div>
                              </div>
                              <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)] mt-1">
                        Top traders data loading...
                      </p>
                    )}
                  </div>
                )}

                {/* Research Institutes */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">
                      RESEARCH INSTITUTES ({selectedResearchInstitutes.length} selected)
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {reviewData.researchInstitutes.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {reviewData.researchInstitutes.map((inst) => (
                        <div
                          key={inst.id}
                          className="p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded flex items-start justify-between gap-3"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-[var(--text-primary)]">{inst.name}</p>
                            {inst.description && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                                {inst.description}
                              </p>
                            )}
                            {inst.x_handle && (
                              <a
                                href={`https://x.com/${inst.x_handle}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-[var(--accent)] hover:underline mt-1 inline-flex items-center gap-1"
                              >
                                <Twitter className="h-3 w-3" />
                                @{inst.x_handle}
                              </a>
                            )}
                          </div>
                          <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      No research institutes resolved yet. They will appear here once loaded.
                    </p>
                  )}
                </div>

                {/* CT Accounts */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">
                      CT ACCOUNTS ({selectedCtAccounts.size} selected)
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(5)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {reviewData.ctAccounts.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {reviewData.ctAccounts.map((acc) => (
                        <div
                          key={acc.id}
                          className="p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <FaXTwitter className="h-4 w-4 text-[var(--accent)]" />
                            <div className="flex-1">
                              <p className="font-semibold text-[var(--text-primary)]">@{acc.xUsername}</p>
                              {acc.displayName && (
                                <p className="text-xs text-[var(--text-secondary)]">{acc.displayName}</p>
                              )}
                              {typeof acc.followersCount === 'number' && (
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                  {acc.followersCount.toLocaleString()} followers
                                </p>
                              )}
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      No CT accounts resolved yet. They will appear here once loaded.
                    </p>
                  )}
                </div>

                {/* Telegram Users */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">
                      TELEGRAM USERS ({selectedTelegramUsers.size} selected)
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  {(() => {
                    const subtotal = reviewData.telegramUsers.reduce((sum, u) => sum + Number(u.credit_price || 0), 0);
                    const platformFee = subtotal * 0.1;
                    const totalCredits = subtotal + platformFee;

                    return (
                      <>
                        {reviewData.telegramUsers.length > 0 ? (
                          <div className="space-y-2 mt-3">
                            {reviewData.telegramUsers.map((u) => {
                              const displayName = u.telegram_username
                                ? `@${u.telegram_username}`
                                : u.first_name
                                  ? `${u.first_name} ${u.last_name || ''}`.trim()
                                  : 'Telegram User';
                              return (
                                <div
                                  key={u.id}
                                  className="p-3 bg-[var(--bg-deep)] border border-[var(--border)] rounded flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <Send className="h-4 w-4 text-[var(--accent)]" />
                                    <p className="font-semibold text-[var(--text-primary)]">{displayName}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-[var(--accent)]">
                                      {Number(u.credit_price) > 0 ? `${Number(u.credit_price).toLocaleString()} ¢` : 'FREE'}
                                    </span>
                                    <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-[var(--text-muted)] mt-1">
                            No Telegram users selected.
                          </p>
                        )}

                        {/* Cost Breakdown */}
                        <div className="mt-4 p-4 border border-[var(--accent)]/30 bg-[var(--accent)]/5 rounded-lg">
                          <p className="text-xs font-bold text-[var(--accent)] mb-3 tracking-wider uppercase">Subscription Breakdown</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Alpha Subscription Subtotal</span>
                              <span className="font-mono text-[var(--text-primary)]">{subtotal.toLocaleString()} ¢</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-[var(--text-secondary)]">Platform Fee (10%)</span>
                              <span className="font-mono text-[var(--text-primary)]">+{platformFee.toLocaleString()} ¢</span>
                            </div>
                            <div className="h-px bg-[var(--border)] my-1" />
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-sm font-bold text-[var(--text-primary)]">TOTAL CREDITS REQUIRED</span>
                              <div className="text-right">
                                <span className="text-lg font-mono font-bold text-[var(--accent)]">{totalCredits.toLocaleString()} ¢</span>
                                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter">One-time payment</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Wallet configuration */}
                <div className="p-4 border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label">WALLET CONFIGURATION</p>
                    <button
                      type="button"
                      onClick={() => setStep(7)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Club Owner Wallet</p>
                      <p className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-deep)] p-2 rounded border border-[var(--border)]">
                        {formData.creatorWallet || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] mb-1">Profit Receiver (20% of profits)</p>
                      <p className="font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-deep)] p-2 rounded border border-[var(--border)]">
                        {formData.profitReceiverAddress || 'Defaults to club owner wallet'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation summary */}
                <div className="p-4 border border-[var(--accent)] bg-[var(--accent)]/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="data-label text-[var(--accent)]">CONFIGURATION CONFIRMED</p>
                    <button
                      type="button"
                      onClick={() => setStep(8)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-start gap-2 mt-2">
                    <Check className="h-5 w-5 text-[var(--accent)] mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-[var(--text-primary)] font-semibold">Ready to Create</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        All configuration steps completed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <><Activity className="h-5 w-5 animate-pulse" />CREATING...</> : 'CREATE CLUB'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div >

      {/* Success Modal */}
      {
        showDeployModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border)] max-w-md w-full p-8 shadow-[0_0_40px_rgba(0,255,136,0.2)]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 border-2 border-[var(--accent)] bg-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                  <Check className="h-8 w-8 text-[var(--accent)]" />
                </div>
                <h2 className="font-display text-2xl mb-2 text-[var(--text-primary)]">CLUB CREATED!</h2>
                <p className="text-[var(--text-secondary)]">Your Alpha Club is ready</p>
              </div>
              <div className="space-y-4">
                <button onClick={() => router.push('/dashboard')} className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">
                  GO TO DASHBOARD
                </button>
                <button onClick={() => setShowDeployModal(false)} className="w-full py-4 border border-[var(--border)] font-bold hover:border-[var(--accent)] hover:bg-[var(--bg-elevated)] transition-colors text-[var(--text-primary)]">
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Removed deployment modals since they depend on backend services */}
    </div >
  );
}
