/**
 * Ostium Connection Flow - Brutalist Design (Frontend Simulation Only)
 */

import { useState, useEffect, useRef } from 'react';
import { X, Wallet, CheckCircle, AlertCircle, Zap, Activity, ExternalLink } from 'lucide-react';
import { TradingPreferencesForm, TradingPreferences } from './TradingPreferencesModal';
import { UNIVERSAL_WALLET_ADDRESS, UNIVERSAL_OSTIUM_AGENT_ADDRESS } from '../json/addresses';
import simulationDataJson from '../json/simulation-data.json';

interface OstiumConnectProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function OstiumConnect({
  agentId,
  agentName,
  onClose,
  onSuccess,
}: OstiumConnectProps) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deploymentId, setDeploymentId] = useState<string>('');
  const [step, setStep] = useState<'connect' | 'preferences' | 'agent' | 'oneclick' | 'complete'>('connect');
  const [joiningAgent, setJoiningAgent] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [delegateApproved, setDelegateApproved] = useState(false);
  const [usdcApproved, setUsdcApproved] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [agentAddress] = useState(UNIVERSAL_OSTIUM_AGENT_ADDRESS);
  const [currentAction, setCurrentAction] = useState<string>('');

  // Trading preferences stored locally until all approvals complete
  const [tradingPreferences, setTradingPreferences] = useState<TradingPreferences | null>(null);
  const tradingPreferencesRef = useRef<TradingPreferences | null>(null); // ensures latest prefs are used in async flows
  const [firstDeploymentPreferences, setFirstDeploymentPreferences] = useState<TradingPreferences | null>(null);
  const [loadingFirstDeploymentPreferences, setLoadingFirstDeploymentPreferences] = useState(false);

  // Component initialization state
  const [hasInitialized, setHasInitialized] = useState(false);

  // Payment & Cost State (frontend-only simulation)
  const [agentData, setAgentData] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isCreator, setIsCreator] = useState(false); // Track if current user is the club creator

  useEffect(() => {
    // Load agent data and credit balance from simulation data
    loadAgentData();
    loadCreditBalance();
  }, []);

  useEffect(() => {
    // If component mounts, go to preferences step first
    if (step === 'connect' && !hasInitialized) {
      setHasInitialized(true);
      // Load agent data and credit balance
      loadAgentData();
      loadCreditBalance();
      // Load first deployment preferences if they exist
      setLoadingFirstDeploymentPreferences(true);
      loadFirstDeploymentPreferences().then((prefs) => {
        if (prefs) {
          setFirstDeploymentPreferences(prefs);
          console.log('[OstiumConnect] Set first deployment preferences:', prefs);
        }
        setLoadingFirstDeploymentPreferences(false);
      });
      // Always show preferences as first step for new deployments
      setStep('preferences');
    }
  }, [step, hasInitialized]);

  const loadAgentData = async () => {
    try {
      // Load agent data from simulation data
      const simulationData = simulationDataJson as any;
      const agentDetails = simulationData.agentDetails?.[agentId];
      const agentFromList = simulationData.agents?.find((a: any) => a.id === agentId);

      if (agentDetails || agentFromList) {
        // Construct agent data similar to API response
        const data = {
          id: agentId,
          name: agentDetails?.name || agentFromList?.name || agentName,
          creator_wallet: agentDetails?.creatorWallet || '0xCREATOR00000000000000000000000000000001',
          totalCost: agentFromList?.totalCost || 550,
          // Mock agent_telegram_users structure for cost calculation
          agent_telegram_users: agentFromList?.totalCost ? [{
            telegram_alpha_users: {
              credit_price: (agentFromList.totalCost / 1.1).toString(), // Remove platform fee to get base price
              telegram_username: 'abhidavinci'
            }
          }] : []
        };
        setAgentData(data);

        // Check if current user is the club creator
        const userWallet = UNIVERSAL_WALLET_ADDRESS.toLowerCase();
        const creatorWallet = (data.creator_wallet || '').toLowerCase();
        const creatorFlag = userWallet && creatorWallet && userWallet === creatorWallet;
        setIsCreator(creatorFlag);
        console.log('[OstiumConnect] Creator check:', { userWallet, creatorWallet, isCreator: creatorFlag });

        // Calculate total cost
        let subtotal = 0;
        if (data.agent_telegram_users && data.agent_telegram_users.length > 0) {
          data.agent_telegram_users.forEach((au: any) => {
            if (au.telegram_alpha_users?.credit_price) {
              subtotal += parseFloat(au.telegram_alpha_users.credit_price);
            }
          });
        } else {
          // Fallback to agent's totalCost if no telegram users
          subtotal = data.totalCost / 1.1; // Remove platform fee
        }
        const platformFee = subtotal * 0.1;
        setTotalCost(subtotal + platformFee);
        console.log('[OstiumConnect] Agent cost calculated:', { subtotal, platformFee, total: subtotal + platformFee });
      }
    } catch (err) {
      console.error('[OstiumConnect] Error loading agent data:', err);
    }
  };

  const loadCreditBalance = async () => {
    try {
      // Load credit balance from simulation data
      const simulationData = simulationDataJson as any;
      const balance = simulationData.totalCreditBalance || 0;
      setCreditBalance(balance);
      console.log('[OstiumConnect] User credit balance:', balance);
    } catch (err) {
      console.error('[OstiumConnect] Error loading credit balance:', err);
    }
  };

  const checkSetupStatus = async () => {
    // Frontend-only: simulate a quick setup check, then move to agent step, then oneclick
    console.log('[OstiumConnect] Simulating setup check (frontend simulation)');
    setLoading(false);
    // Move to agent step first (brief loading state)
    setStep('agent');
    // Then automatically move to oneclick after a short delay
    setTimeout(() => {
      setStep('oneclick');
    }, 1000);
  };

  // Removed unused backend functions (createDeploymentDirectly, assignAgent)

  const joinAgent = async () => {
    // 1. Check if user has enough credits (skip for creators - they join for free)
    if (!isCreator && totalCost > 0 && creditBalance < totalCost) {
      console.log('[OstiumConnect] Insufficient credits to join');
      setError(`Insufficient credits. Need ${totalCost.toFixed(0)} credits but only have ${creditBalance.toFixed(0)}.`);
      return;
    }

    setJoiningAgent(true);
    setError('');

    // Frontend-only simulation of deployment creation
    setTimeout(() => {
      const simulatedId = `SIM-${Date.now()}`;
      setDeploymentId(simulatedId);
      console.log('[OstiumConnect] ✅ Simulated deployment created:', simulatedId);

      if (onSuccess) {
        onSuccess();
      }

      setJoiningAgent(false);
    }, 2000);
  };

  const approveAgent = async () => {
    // Frontend-only simulation of delegate approval
    console.log('[OstiumConnect] Simulating delegate approval');
    setLoading(true);
    setError('');
    setTimeout(() => {
      setDelegateApproved(true);
      setStep('oneclick');
      setTxHash('0xSIMULATED_DELEGATE_TX');
      setLoading(false);
    }, 1200);
  };

  const enableOneClickTrading = async () => {
    // Frontend-only simulation: do both delegation and USDC approval
    console.log('[OstiumConnect] Simulating 1-click trading enablement');
    setLoading(true);
    setError('');

    // First, approve delegation if not already done
    if (!delegateApproved) {
      setCurrentAction('Approving delegation...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      setDelegateApproved(true);
    }

    // Then, approve USDC
    setCurrentAction('Approving USDC allowance...');
    await new Promise(resolve => setTimeout(resolve, 1200));
    setUsdcApproved(true);

    setStep('complete');
    setTxHash('0xSIMULATED_ONECLICK_TX');
    setLoading(false);
  };

  const handleConnect = () => {
    // Frontend-only wallet connect simulation
    console.log('[OstiumConnect] Simulating wallet connection');
    setLoading(true);
    setTimeout(() => {
      setIsWalletConnected(true);
      setLoading(false);
    }, 800);
  };

  const handlePreferencesSet = (preferences: TradingPreferences) => {
    console.log('[OstiumConnect] Trading preferences set:', preferences);
    tradingPreferencesRef.current = preferences;
    setTradingPreferences(preferences);
    // Step advancement is handled by onNext callback
  };

  const handlePreferencesNext = () => {
    // After preferences are set, proceed to check setup status with fresh prefs
    setLoading(true);
    checkSetupStatus();
  };

  const loadFirstDeploymentPreferences = async () => {
    // Frontend-only: load from simulation data if available
    try {
      const simulationData = simulationDataJson as any;
      const deployments = simulationData.deployments || [];
      const deploymentStatuses = simulationData.deploymentStatuses || {};

      // Find first deployment and its status
      const firstDeployment = deployments[0];
      if (firstDeployment && deploymentStatuses[firstDeployment.id]) {
        const status = deploymentStatuses[firstDeployment.id];
        return {
          risk_tolerance: status.riskTolerance || 50,
          trade_frequency: status.tradeFrequency || 50,
          social_sentiment_weight: status.socialSentimentWeight || 50,
          price_momentum_focus: status.priceMomentumFocus || 50,
          market_rank_priority: status.marketRankPriority || 50,
        } as TradingPreferences;
      }
    } catch (err) {
      console.error('[OstiumConnect] Error loading first deployment preferences:', err);
    }
    return null;
  };

  const goBack = () => {
    if (step === 'preferences') {
      setStep('connect');
    } else if (step === 'agent') {
      setStep('preferences');
    } else if (step === 'oneclick') {
      setStep('agent');
    } else if (step === 'complete') {
      setStep('oneclick');
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 sm:p-4 md:p-6 lg:p-8"
      onWheelCapture={(e) => {
        // Keep scroll inside the modal stack; don't bubble to page
        e.stopPropagation();
      }}
    >
      <div className="bg-[var(--bg-deep)] border border-[var(--border)] w-full max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl h-[95vh] sm:h-[90vh] md:h-[85vh] flex flex-col overflow-hidden overscroll-contain rounded-none sm:rounded-lg shadow-2xl">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-3 sm:px-4 md:px-5 lg:px-6 py-2.5 sm:py-3 md:py-4 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 lg:w-12 lg:h-12 border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <Zap className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 lg:h-6 lg:w-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="data-label mb-0.5 sm:mb-1 text-[9px] sm:text-[10px] md:text-xs lg:text-sm">JOIN ALPHA CLUB</p>
              <h2 className="font-display text-xs sm:text-base md:text-lg lg:text-xl xl:text-2xl truncate">Join {agentName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0 rounded-sm hover:bg-[var(--bg-elevated)]"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left: Journey steps - Only visible on large screens */}
          <aside className="hidden xl:flex w-64 2xl:w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-surface)] px-6 py-6 space-y-6 overflow-y-auto">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Your setup journey</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Follow the steps to connect your wallet, set your trading style, and let the agent trade on your behalf.
              </p>
            </div>

            <ol className="space-y-4 text-xs">
              <li className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'connect'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  1
                </span>
                <div>
                  <p className="font-semibold">Connect wallet</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Authorize your Arbitrum wallet.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'preferences'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  2
                </span>
                <div>
                  <p className="font-semibold">Trading style</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Set risk, frequency, and filters.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'agent'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  3
                </span>
                <div>
                  <p className="font-semibold">Assign trading agent</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Let the agent trade on your behalf.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'oneclick'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  4
                </span>
                <div>
                  <p className="font-semibold">Enable 1-Click Trading</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Delegate signatures and set allowance.</p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'complete'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  5
                </span>
                <div>
                  <p className="font-semibold">Join Agent</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">Deploy the agent and start trading.</p>
                </div>
              </li>
            </ol>
          </aside>

          {/* Right: Active step content */}
          <div
            className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'var(--accent) var(--bg-deep)',
            }}
            onWheelCapture={(e) => {
              const el = e.currentTarget;
              const isScrollable = el.scrollHeight > el.clientHeight;
              const isAtTop = el.scrollTop === 0;
              const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
              if (isScrollable && !(isAtTop && e.deltaY < 0) && !(isAtBottom && e.deltaY > 0)) {
                e.stopPropagation();
              }
            }}
          >
            {error && (
              <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-3 sm:p-4 md:p-5 border border-[var(--danger)] bg-[var(--danger)]/10 rounded-sm">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <span className="text-xs sm:text-sm md:text-base text-[var(--danger)] leading-relaxed">{error}</span>
              </div>
            )}

            {step === 'connect' ? (
              isWalletConnected ? (
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 border border-[var(--accent)]/60 bg-[var(--accent)]/5 rounded-sm">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border border-[var(--accent)] flex items-center justify-center bg-[var(--bg-deep)] flex-shrink-0">
                      <Wallet className="w-5 h-5 sm:w-6 sm:w-6 md:w-7 md:h-7 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm md:text-base font-semibold text-[var(--text-primary)] mb-1">Wallet connected</p>
                      <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] truncate font-mono">
                        {UNIVERSAL_WALLET_ADDRESS}
                      </p>
                    </div>
                    <div className="text-[9px] sm:text-[10px] md:text-xs px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 md:py-1.5 border border-[var(--accent)] text-[var(--accent)] font-bold rounded-sm">
                      ARBITRUM
                    </div>
                  </div>
                  <div className="border border-[var(--border)] p-3 sm:p-4 md:p-5 text-xs sm:text-sm md:text-base text-[var(--text-secondary)] rounded-sm">
                    <p className="font-semibold text-[var(--text-primary)] mb-1.5 sm:mb-2 text-xs sm:text-sm md:text-base">Ready to start</p>
                    <p className="leading-relaxed text-[11px] sm:text-xs md:text-sm">We'll keep your wallet connected while you finish the steps.</p>
                  </div>
                  <button
                    onClick={() => setStep('preferences')}
                    className="w-full py-2.5 sm:py-3 md:py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 py-4 sm:py-6 md:py-8">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 mx-auto border border-[var(--accent)] flex items-center justify-center">
                    <Wallet className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[var(--accent)]" />
                  </div>
                  <div className="px-3 sm:px-4">
                    <h3 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl mb-1.5 sm:mb-2 md:mb-3">CONNECT WALLET</h3>
                    <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                      Connect your Arbitrum wallet to whitelist the agent
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    className="w-full py-3.5 sm:py-4 md:py-5 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base rounded-sm"
                  >
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                    CONNECT WALLET
                  </button>
                </div>
              )
            ) : step === 'preferences' ? (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3 md:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 border border-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-[var(--accent)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl mb-1 sm:mb-1.5 md:mb-2">Set Your Trading Preferences</h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] leading-relaxed">
                      {firstDeploymentPreferences
                        ? 'Using values from your first deployment. Adjust as needed.'
                        : 'Configure how this agent should size and filter trades for you.'}
                    </p>
                  </div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-deep)] flex flex-col h-[calc(100vh-240px)] sm:h-[calc(100vh-280px)] md:h-[calc(100vh-320px)] lg:h-[calc(100vh-360px)] rounded-sm overflow-hidden">
                  {loadingFirstDeploymentPreferences ? (
                    <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
                      <Activity className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[var(--accent)] animate-spin" />
                    </div>
                  ) : (
                    <TradingPreferencesForm
                      userWallet={isWalletConnected ? UNIVERSAL_WALLET_ADDRESS : ''}
                      onClose={onClose}
                      onBack={goBack}
                      localOnly={true}
                      onSaveLocal={handlePreferencesSet}
                      onNext={handlePreferencesNext}
                      primaryLabel={loading ? 'Saving...' : 'Save & Continue'}
                      initialPreferences={firstDeploymentPreferences || tradingPreferences || undefined}
                    />
                  )}
                </div>
              </div>
            ) : step === 'agent' ? (
              <div className="text-center space-y-4 sm:space-y-6 md:space-y-8 py-6 sm:py-8 md:py-12">
                <Activity className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 mx-auto text-[var(--accent)] animate-pulse" />
                <div className="px-3 sm:px-4">
                  <h3 className="font-display text-base sm:text-lg md:text-xl lg:text-2xl mb-1.5 sm:mb-2 md:mb-3">ASSIGNING AGENT...</h3>
                  <p className="text-xs sm:text-sm md:text-base text-[var(--text-muted)] leading-relaxed max-w-md mx-auto">
                    Assigning your agent wallet
                  </p>
                </div>
              </div>
            ) : step === 'oneclick' ? (
              <>
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  <div className="text-center sm:text-left">
                    <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl mb-1.5 sm:mb-2 md:mb-3">Enable 1-Click Trading</h3>
                    <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-2xl">
                      Make the most of Ostium. Enable gasless transactions and 1-click trading.
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 sm:mb-3 md:mb-4">STEPS</p>
                    <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] mb-3 sm:mb-4 md:mb-6 leading-relaxed">Sign the following wallet requests.</p>
                  </div>

                  {/* Step 1: Enable Account Delegation */}
                  <div className={`border p-3 sm:p-4 md:p-5 rounded-sm ${delegateApproved ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}>
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 md:gap-4">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center border flex-shrink-0 ${delegateApproved ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>
                        {delegateApproved ? <CheckCircle className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" /> : <div className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 border-2 border-[var(--border)] rounded-full" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1">ENABLE ACCOUNT DELEGATION</p>
                        <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">Delegate signatures to a smart wallet.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Set Allowance */}
                  <div className={`border p-3 sm:p-4 md:p-5 rounded-sm ${usdcApproved ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}>
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 md:gap-4">
                      <div className={`w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 flex items-center justify-center border flex-shrink-0 ${usdcApproved ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>
                        {usdcApproved ? <CheckCircle className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6" /> : <span className="text-[10px] sm:text-xs md:text-sm font-bold">2</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs sm:text-sm md:text-base mb-0.5 sm:mb-1">SET ALLOWANCE</p>
                        <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">Set the maximum allowance. It's advisable to set this high.</p>
                      </div>
                    </div>
                  </div>

                  {txHash && (
                    <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-3 sm:p-4 md:p-5 rounded-sm">
                      <p className="text-[var(--accent)] text-xs sm:text-sm md:text-base font-semibold mb-1.5 sm:mb-2 md:mb-3">✓ Transaction confirmed</p>
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 sm:gap-2 transition-colors"
                      >
                        View on Arbiscan <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                      </a>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4">
                    <button
                      onClick={goBack}
                      className="w-full sm:w-32 py-2.5 sm:py-3 md:py-4 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      onClick={enableOneClickTrading}
                      disabled={loading || (delegateApproved && usdcApproved)}
                      className="flex-1 py-3 sm:py-4 md:py-5 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm md:text-base rounded-sm"
                    >
                      {loading ? (
                        <>
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-pulse" />
                          <span className="hidden sm:inline">{currentAction || 'ENABLING 1-CLICK TRADING...'}</span>
                          <span className="sm:hidden">ENABLING...</span>
                        </>
                      ) : (delegateApproved && usdcApproved) ? (
                        <>
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                          ENABLED
                        </>
                      ) : (
                        <>
                          <span className="hidden sm:inline">ENABLE 1-CLICK TRADING</span>
                          <span className="sm:hidden">ENABLE 1-CLICK</span>
                        </>
                      )}
                    </button>
                    {(delegateApproved && usdcApproved) && (
                      <button
                        onClick={() => setStep('complete')}
                        className="w-full sm:w-40 py-2.5 sm:py-3 md:py-4 border border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/10 transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                        type="button"
                      >
                        Next: Join
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : deploymentId ? (
              <div className="text-center space-y-4 sm:space-y-5 md:space-y-6 py-3 sm:py-4 md:py-6">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 mx-auto border border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center rounded-sm">
                  <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-[var(--bg-deep)]" />
                </div>
                <div className="px-3 sm:px-4">
                  <h3 className="font-display text-lg sm:text-xl md:text-2xl mb-1.5 sm:mb-2">AGENT DEPLOYED</h3>
                  <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                    Agent is now live and ready to trade on Ostium
                  </p>
                </div>

                {txHash && (
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm md:text-base text-[var(--accent)] hover:underline flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
                  >
                    View transaction <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                  </a>
                )}

                <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-2.5 text-xs sm:text-sm md:text-base text-left rounded-sm max-w-md mx-auto">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--accent)] flex-shrink-0" />
                    <span>Agent whitelisted</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--accent)] flex-shrink-0" />
                    <span>USDC approved</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--accent)] flex-shrink-0" />
                    <span>Agent deployed and active</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-[var(--accent)] flex-shrink-0" />
                    <span>Ready to execute signals</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center max-w-md mx-auto">
                  <button
                    onClick={goBack}
                    className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 p-3 sm:p-4 border border-[var(--danger)] bg-[var(--danger)]/10 rounded-sm">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm md:text-base text-[var(--danger)] leading-relaxed">{error}</span>
                  </div>
                )}

                {deploymentId ? (
                  <div className="text-center space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 py-3 sm:py-4 md:py-6 lg:py-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 mx-auto border border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center rounded-sm">
                      <CheckCircle className="w-8 h-8 sm:w-9 sm:h-9 md:w-12 md:h-12 text-[var(--bg-deep)]" />
                    </div>
                    <div className="px-3 sm:px-4">
                      <h3 className="font-display text-lg sm:text-xl md:text-2xl lg:text-3xl mb-1.5 sm:mb-2 md:mb-3">AGENT DEPLOYED</h3>
                      <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
                        Agent is now live and ready to trade on Ostium
                      </p>
                    </div>

                    {txHash && (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs sm:text-sm md:text-base text-[var(--accent)] hover:underline flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
                      >
                        View transaction <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                      </a>
                    )}

                    <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4 text-xs sm:text-sm md:text-base text-left rounded-sm max-w-md mx-auto">
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[var(--accent)] flex-shrink-0" />
                        <span>Agent whitelisted</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[var(--accent)] flex-shrink-0" />
                        <span>USDC approved</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[var(--accent)] flex-shrink-0" />
                        <span>Agent deployed and active</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-[var(--accent)] flex-shrink-0" />
                        <span>Ready to execute signals</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 justify-center max-w-md mx-auto">
                      <button
                        onClick={goBack}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                        type="button"
                      >
                        Back
                      </button>
                      <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                        type="button"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5 md:space-y-6 lg:space-y-8 py-3 sm:py-4 md:py-6 lg:py-8">
                    {/* AGENT LIVE Header */}
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto border-2 border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center mb-3 sm:mb-4 md:mb-6 rounded-sm">
                        <Zap className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[var(--bg-deep)]" />
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-1.5 sm:mb-2 md:mb-3">AGENT LIVE</h3>
                      <p className="text-xs sm:text-sm md:text-base text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto px-3 sm:px-4">
                        All approvals complete. Ready to deploy the agent.
                      </p>
                    </div>

                    {/* SETUP COMPLETE Section */}
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 md:p-6 rounded-sm">
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-3 sm:mb-4 md:mb-6 gap-3 sm:gap-4">
                        <div className="flex-1">
                          <h4 className="font-display text-base sm:text-lg md:text-xl text-[var(--accent)] mb-2 sm:mb-3 md:mb-4">SETUP COMPLETE</h4>
                          <div className="space-y-1.5 sm:space-y-2 md:space-y-3">
                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                              <span className="text-xs sm:text-sm md:text-base">Agent whitelisted & assigned</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2.5 md:h-2.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                              <span className="text-xs sm:text-sm md:text-base">USDC approved (Non-custodial)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 w-full lg:w-auto justify-center lg:justify-end">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[var(--accent)] flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] font-bold">READY TO ACTIVATE</span>
                        </div>
                      </div>

                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 py-0.5 sm:py-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-secondary)]">Agent whitelisted & assigned</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 py-0.5 sm:py-1">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[var(--accent)] rounded-full flex-shrink-0" />
                          <span className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-secondary)]">USDC approved (Non-custodial)</span>
                        </div>
                      </div>

                      {totalCost > 0 && (
                        <div className="mt-2.5 sm:mt-3 md:mt-4 pt-2.5 sm:pt-3 md:pt-4 border-t border-[var(--border)]">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-1.5 sm:mb-2 gap-1.5 sm:gap-2">
                            <p className="text-[9px] sm:text-[10px] md:text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Credit Summary</p>
                            <span className={`text-[8px] sm:text-[9px] md:text-[10px] px-1.5 sm:px-2 py-0.5 border font-bold rounded ${isCreator ? 'border-green-500/30 text-green-500' : 'border-[var(--accent)]/30 text-[var(--accent)]'}`}>
                              {isCreator ? 'CREATOR - FREE ACCESS' : 'PAID ACCESS'}
                            </span>
                          </div>

                          {!isCreator && (
                            <div className="mb-2.5 sm:mb-3 md:mb-4 space-y-0.5 sm:space-y-1">
                              {agentData?.agent_telegram_users?.map((au: any, idx: number) => {
                                if (au.telegram_alpha_users?.credit_price && parseFloat(au.telegram_alpha_users.credit_price) > 0) {
                                  return (
                                    <div key={idx} className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px]">
                                      <span className="text-[var(--text-secondary)] italic">Alpha Access: {au.telegram_alpha_users.telegram_username || 'Provider'}</span>
                                      <span className="text-[var(--text-primary)]">{parseFloat(au.telegram_alpha_users.credit_price).toFixed(0)} CREDS</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              <div className="flex flex-col sm:flex-row justify-between gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] md:text-[10px] pt-0.5 sm:pt-1 border-t border-[var(--border)] border-dashed">
                                <span className="text-[var(--text-muted)]">Platform Fee (10%)</span>
                                <span className="text-[var(--text-primary)]">{(totalCost * (10 / 110)).toFixed(0)} CREDS</span>
                              </div>
                            </div>
                          )}

                          {isCreator ? (
                            <div className="bg-green-500/5 p-2 sm:p-2.5 md:p-3 border border-green-500/20 rounded">
                              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-green-500 font-bold text-center">
                                ✓ AS THE CREATOR, YOU JOIN FOR FREE
                              </p>
                              <p className="text-[7px] sm:text-[8px] md:text-[9px] text-[var(--text-muted)] text-center mt-0.5 sm:mt-1">
                                You already paid when creating this club
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                                <div className="space-y-0.5 sm:space-y-1 md:space-y-2 text-center sm:text-left">
                                  <p className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">Cost to Join</p>
                                  <p className="text-lg sm:text-xl md:text-2xl font-display text-[var(--text-primary)]">{totalCost.toFixed(0)} <span className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)]">CREDS</span></p>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 md:space-y-2 text-center sm:text-right">
                                  <p className="text-[9px] sm:text-[10px] md:text-xs text-[var(--text-muted)] uppercase tracking-wider">Your Balance</p>
                                  <p className={`text-lg sm:text-xl md:text-2xl font-display ${creditBalance < totalCost ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{creditBalance.toFixed(0)} <span className="text-[10px] sm:text-xs md:text-sm text-[var(--text-secondary)]">CREDS</span></p>
                                </div>
                              </div>

                              {creditBalance >= totalCost ? (
                                <div className="mt-1.5 sm:mt-2 md:mt-3 bg-[var(--accent)]/5 p-1.5 sm:p-2 border border-[var(--accent)]/10 rounded-sm">
                                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-[var(--accent)] font-bold text-center">
                                    NEW BALANCE AFTER JOIN: {(creditBalance - totalCost).toFixed(0)} CREDS
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-1.5 sm:mt-2 md:mt-3 bg-red-500/5 p-1.5 sm:p-2 border border-red-500/20 rounded-sm">
                                  <p className="text-[8px] sm:text-[9px] md:text-[10px] text-red-500 font-bold text-center">
                                    ⚠ INSUFFICIENT CREDITS - NEED {(totalCost - creditBalance).toFixed(0)} MORE
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>


                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4">
                      <button
                        onClick={goBack}
                        className="w-full sm:w-auto px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 md:py-4 border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-elevated)] transition-colors text-xs sm:text-sm md:text-base rounded-sm"
                        type="button"
                      >
                        Back
                      </button>
                      <button
                        onClick={joinAgent}
                        disabled={joiningAgent || (!isCreator && totalCost > 0 && creditBalance < totalCost)}
                        className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-xs sm:text-sm md:text-base rounded-sm"
                        type="button"
                      >
                        {joiningAgent ? (
                          <>
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 animate-spin" />
                            <span className="hidden sm:inline">JOINING AGENT...</span>
                            <span className="sm:hidden">JOINING...</span>
                          </>
                        ) : !isCreator && totalCost > 0 && creditBalance < totalCost ? (
                          <>
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span className="hidden sm:inline">INSUFFICIENT CREDITS</span>
                            <span className="sm:hidden">INSUFFICIENT</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                            <span className="hidden lg:inline">{isCreator ? 'JOIN AGENT (FREE - CREATOR)' : totalCost > 0 ? `JOIN AGENT (${totalCost.toFixed(0)} CREDS)` : 'JOIN AGENT (FREE)'}</span>
                            <span className="lg:hidden">JOIN AGENT</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

