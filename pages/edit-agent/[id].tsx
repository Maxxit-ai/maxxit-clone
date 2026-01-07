import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Check, User, Sliders, Activity, Eye, Settings as SettingsIcon, TrendingUp, Wallet } from 'lucide-react';
import { Header } from '@components/Header';
import { ResearchInstituteSelector } from '@components/ResearchInstituteSelector';
import { TelegramAlphaUserSelector } from '@components/TelegramAlphaUserSelector';
import { CtAccountSelector } from '@components/CtAccountSelector';
import { TopTradersSelector } from '@components/TopTradersSelector';
import { FaXTwitter } from 'react-icons/fa6';
import { Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import simulationDataJson from '../../json/simulation-data.json';
import { UNIVERSAL_WALLET_ADDRESS } from '../../json/addresses';
import type { Agent } from '@shared/schema';

export default function EditAgent() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  // Frontend-only simulation auth
  const authenticated = true;
  const simulatedUserWallet = UNIVERSAL_WALLET_ADDRESS;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    status: 'DRAFT',
  });

  const [selectedResearchInstitutes, setSelectedResearchInstitutes] = useState<string[]>([]);
  const [selectedCtAccounts, setSelectedCtAccounts] = useState<Set<string>>(new Set());
  const [selectedTelegramUsers, setSelectedTelegramUsers] = useState<Set<string>>(new Set());
  const [selectedTopTraders, setSelectedTopTraders] = useState<string[]>([]);

  const [reviewData, setReviewData] = useState<{
    researchInstitutes: Array<{ id: string; name: string; description: string | null; x_handle: string | null }>;
    ctAccounts: Array<{ id: string; xUsername: string; displayName: string | null; followersCount: number | null }>;
    telegramUsers: Array<{ id: string; telegram_username: string | null; first_name: string | null; last_name: string | null }>;
    topTraders: Array<{ id: string; walletAddress: string; impactFactor: number; totalPnl: string; totalTrades: number }>;
  }>({
    researchInstitutes: [],
    ctAccounts: [],
    telegramUsers: [],
    topTraders: [],
  });

  useEffect(() => {
    if (id && authenticated) {
      loadAgentData();
    }
  }, [id, authenticated]);

  useEffect(() => {
    if (step === 6) {
      fetchReviewData();
    }
  }, [step]);

  const loadAgentData = async () => {
    if (!id || typeof id !== 'string') return;

    setLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { editAgent, topTraders } = simulationDataJson as any;
      const agents: any[] = editAgent?.agents || [];
      const researchInstitutes: any[] = editAgent?.researchInstitutes || [];
      const ctAccounts: any[] = editAgent?.ctAccounts || [];
      const telegramUsers: any[] = editAgent?.telegramUsers || [];

      const agentData = agents.find((a) => a.id === id);
      if (!agentData) {
        throw new Error('Agent not found in simulation data');
      }

      setAgent(agentData);
      setFormData({
        name: agentData.name,
        status: agentData.status || 'DRAFT',
      });

      setSelectedResearchInstitutes(agentData.researchInstitutes || []);
      setSelectedCtAccounts(new Set(agentData.ctAccounts || []));
      setSelectedTelegramUsers(new Set(agentData.telegramUsers || []));

      // Preload review data based on selections
      const selectedInstitutes =
        researchInstitutes.filter((inst) =>
          (agentData.researchInstitutes || []).includes(inst.id)
        ) || [];
      const selectedCtAccountsData =
        ctAccounts.filter((acc) => (agentData.ctAccounts || []).includes(acc.id)) || [];
      const selectedTelegramData =
        telegramUsers.filter((u) => (agentData.telegramUsers || []).includes(u.id)) || [];

      setReviewData({
        researchInstitutes: selectedInstitutes,
        ctAccounts: selectedCtAccountsData,
        telegramUsers: selectedTelegramData,
        topTraders: [],
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load agent data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || typeof id !== 'string') return;

    setSaving(true);
    setError(null);

    try {
      // Simulate save delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update local state to reflect saved data
      setAgent((prev) =>
        prev
          ? { ...prev, name: formData.name, status: formData.status as Agent['status'] }
          : prev
      );

      // Refresh review data based on current selections
      fetchReviewData(true);

      toast({
        title: "Agent Updated (simulated)",
        description: "Changes saved locally for this session.",
      });

      router.push('/creator');
    } catch (err: any) {
      setError(err.message || 'Failed to update agent (simulation)');
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update agent",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCtAccount = (accountId: string) => {
    const newSelected = new Set(selectedCtAccounts);
    if (newSelected.has(accountId)) newSelected.delete(accountId);
    else newSelected.add(accountId);
    setSelectedCtAccounts(newSelected);
  };

  const nextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter an agent name');
      return;
    }
    if (step === 2 && selectedResearchInstitutes.length === 0) {
      setError('Please select at least one research institute');
      return;
    }
    if (step === 3 && selectedCtAccounts.size === 0) {
      setError('Please select at least one CT account');
      return;
    }

    if (step < 5) {
      setStep(step + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const fetchReviewData = async (skipDelay = false) => {
    try {
      if (!skipDelay) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const { editAgent, topTraders } = simulationDataJson as any;
      const researchInstitutes: any[] = editAgent?.researchInstitutes || [];
      const ctAccounts: any[] = editAgent?.ctAccounts || [];
      const telegramUsers: any[] = editAgent?.telegramUsers || [];

      const selectedInstitutes =
        researchInstitutes.filter((inst) =>
          selectedResearchInstitutes.includes(inst.id)
        ) || [];

      const selectedCtAccountsData =
        ctAccounts.filter((acc) => selectedCtAccounts.has(acc.id)) || [];

      const selectedTelegramData =
        telegramUsers.filter((u) => selectedTelegramUsers.has(u.id)) || [];

      const selectedTopTradersData =
        (topTraders || []).filter((trader: any) =>
          selectedTopTraders.includes(trader.id)
        ) || [];

      setReviewData({
        researchInstitutes: selectedInstitutes,
        ctAccounts: selectedCtAccountsData,
        telegramUsers: selectedTelegramData,
        topTraders: selectedTopTradersData,
      });
    } catch (err) {
      console.error('Failed to load review data (simulation)', err);
    }
  };

  const steps = [
    { number: 1, label: 'BASIC', icon: User },
    { number: 2, label: 'TOP TRADERS', icon: TrendingUp },
    { number: 3, label: 'RESEARCH', icon: Sliders },
    { number: 4, label: 'CT', icon: FaXTwitter },
    { number: 5, label: 'TELEGRAM', icon: Send },
    { number: 6, label: 'REVIEW', icon: Eye },
  ];

  const stepDescriptions: Record<number, string> = {
    1: 'Update your agent name and visibility settings.',
    2: 'Manage top traders to copy trade from.',
    3: 'Manage research institutes your agent follows.',
    4: 'Manage CT accounts your agent mirrors.',
    5: 'Manage Telegram alpha users your agent follows.',
    6: 'Review all settings before saving changes.',
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="font-display text-3xl mb-4">Authentication Required</h1>
          <p className="text-[var(--text-secondary)] mb-6">Please connect your wallet to edit agents.</p>
          <button
            onClick={() => { }}
            className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <Activity className="h-12 w-12 animate-pulse text-[var(--accent)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading agent data...</p>
        </div>
      </div>
    );
  }

  if (error && !agent) {
    return (
      <div className="min-h-screen bg-[var(--bg-deep)]">
        <Header />
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="mb-6 p-4 border border-[var(--danger)] bg-[var(--danger)]/10 rounded inline-block">
            <p className="text-[var(--danger)] text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => router.push('/creator')}
            className="px-6 py-3 border border-[var(--border)] font-bold hover:border-[var(--accent)] transition-colors"
          >
            BACK TO CREATOR
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="data-label mb-2">AGENT EDITOR</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">EDIT AGENT</h1>
          <p className="text-[var(--text-secondary)]">Modify your agent configuration</p>
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

        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-6">BASIC INFORMATION</h2>
              <div>
                <label className="data-label block mb-2">AGENT NAME *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 transition-colors"
                  placeholder="Alpha Momentum Trader"
                />
              </div>

              {/* Status Toggle */}
              <div>
                <label className="data-label block mb-2">VISIBILITY</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'PUBLIC' })}
                    className={`flex-1 px-4 py-3 border text-sm font-bold transition-all ${formData.status === 'PUBLIC'
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 shadow-lg'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    PUBLIC
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: 'PRIVATE' })}
                    className={`flex-1 px-4 py-3 border text-sm font-bold transition-all ${formData.status === 'PRIVATE'
                      ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 shadow-lg'
                      : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                      }`}
                  >
                    PRIVATE
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.push('/creator')}
                  className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                >
                  NEXT →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Top Traders */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-2">TOP TRADERS</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Select top traders to copy trade from. Their wallet addresses will be used as signal providers.</p>
              <TopTradersSelector selectedIds={selectedTopTraders} onChange={setSelectedTopTraders} />
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 3: Research Institutes */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-2">RESEARCH INSTITUTES</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Choose which institutes your agent should follow for signals.</p>
              <ResearchInstituteSelector selectedIds={selectedResearchInstitutes} onChange={setSelectedResearchInstitutes} />
              {selectedResearchInstitutes.length === 0 && (
                <p className="text-sm text-[var(--accent)]">⚠️ Select at least one institute</p>
              )}
              <div className="flex gap-4">
                <button type="button" onClick={prevStep} className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors">BACK</button>
                <button type="button" onClick={nextStep} className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors">NEXT →</button>
              </div>
            </div>
          )}

          {/* Step 4: CT Accounts */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-2">CT ACCOUNTS</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Select CT accounts your agent should mirror.</p>
              <CtAccountSelector
                selectedIds={selectedCtAccounts}
                onToggle={toggleCtAccount}
                onNext={nextStep}
                onBack={prevStep}
              />
              {selectedCtAccounts.size === 0 && (
                <p className="text-sm text-[var(--accent)]">⚠️ Select at least one CT account</p>
              )}
            </div>
          )}

          {/* Step 5: Telegram */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-2">TELEGRAM ALPHA</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Select Telegram users whose DM signals your agent should follow.</p>
              <TelegramAlphaUserSelector
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

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="font-display text-2xl mb-2">REVIEW CHANGES</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-6">Review your changes before saving.</p>

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
                  <p className="font-bold text-[var(--text-primary)] mb-1">{formData.name}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Status: <span className="font-semibold">{formData.status}</span></p>
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
                        onClick={() => setStep(2)}
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
                      <p className="text-sm text-[var(--text-muted)] mt-1">Loading...</p>
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
                      onClick={() => setStep(3)}
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
                            {inst.x_handle && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1">@{inst.x_handle}</p>
                            )}
                          </div>
                          <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mt-1">Loading...</p>
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
                      onClick={() => setStep(4)}
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
                            </div>
                          </div>
                          <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mt-1">Loading...</p>
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
                      onClick={() => setStep(5)}
                      className="text-xs text-[var(--accent)] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
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
                            <Check className="h-4 w-4 text-[var(--accent)] flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  ) : selectedTelegramUsers.size > 0 ? (
                    <p className="text-sm text-[var(--text-muted)] mt-1">Loading...</p>
                  ) : (
                    <p className="text-sm text-[var(--text-muted)] mt-1">No telegram users selected</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={saving}
                  className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  BACK
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Activity className="h-5 w-5 animate-pulse" />
                      SAVING...
                    </>
                  ) : (
                    'SAVE CHANGES'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

