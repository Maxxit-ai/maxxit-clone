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

  // Guard refs to prevent duplicate API calls
  const isCheckingRef = useRef(false);
  const isAssigningRef = useRef(false);
  const [hasInitialized, setHasInitialized] = useState(false); // Persists in state, not ref

  // Payment & Cost State
  const [agentData, setAgentData] = useState<any>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [isWeb3ModalOpen, setIsWeb3ModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showTopUpUI, setShowTopUpUI] = useState(false);
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
    // Frontend-only: simulate a quick setup check, then move to oneclick step
    console.log('[OstiumConnect] Skipping backend setup check (frontend simulation)');
    setTimeout(() => {
      setLoading(false);
      setStep('oneclick');
    }, 600);
  };

  const createDeploymentDirectly = async (_wallet: string) => {
    // Frontend-only: not used in simulation, kept for compatibility
    console.log('[OstiumConnect] createDeploymentDirectly called in simulation (no-op)');
  };

  const assignAgent = async () => {
    // Frontend-only: agent assignment is simulated when preferences are saved
    console.log('[OstiumConnect] assignAgent called in simulation (handled via handlePreferencesSet)');
  };

  const joinAgent = async () => {
    // 1. Check if user has enough credits (skip for creators - they join for free)
    if (!isCreator && totalCost > 0 && creditBalance < totalCost) {
      console.log('[OstiumConnect] Insufficient credits to join, showing top-up UI');
      setShowTopUpUI(true);
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
    // Don't auto-advance - user will click "Next" button
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onWheelCapture={(e) => {
        // Keep scroll inside the modal stack; don't bubble to page
        e.stopPropagation();
      }}
    >
      <div className="bg-[var(--bg-deep)] border border-[var(--border)] max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden overscroll-contain">
        {/* Header */}
        <div className="border-b border-[var(--border)] px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[var(--accent)] flex items-center justify-center">
              <Zap className="h-5 w-5 text-[var(--accent)]" />
            </div>
            <div>
              <p className="data-label mb-1">JOIN ALPHA CLUB</p>
              <h2 className="font-display text-xl">Join {agentName}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex">
          {/* Left: Journey steps */}
          <aside className="hidden md:flex w-64 flex-col border-r border-[var(--border)] bg-[var(--bg-deep)] px-6 py-6 space-y-6">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Your setup journey</p>
              <p className="text-xs text-[var(--text-secondary)]">
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
                  <p className="text-[10px] text-[var(--text-muted)]">Authorize your Arbitrum wallet.</p>
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
                  <p className="text-[10px] text-[var(--text-muted)]">Set risk, frequency, and filters.</p>
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
                  <p className="text-[10px] text-[var(--text-muted)]">Let the agent trade on your behalf.</p>
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
                  <p className="text-[10px] text-[var(--text-muted)]">Delegate signatures and set allowance.</p>
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
                  <p className="text-[10px] text-[var(--text-muted)]">Deploy the agent and start trading.</p>
                </div>
              </li>
            </ol>
          </aside>

          {/* Right: Active step content */}
          <div
            className="flex-1 p-6 space-y-4 overflow-y-auto custom-scrollbar min-h-0"
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
              <div className="flex items-start gap-3 p-4 border border-[var(--danger)] bg-[var(--danger)]/10">
                <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                <span className="text-sm text-[var(--danger)]">{error}</span>
              </div>
            )}

            {step === 'connect' ? (
              isWalletConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 border border-[var(--accent)]/60 bg-[var(--accent)]/5 rounded">
                    <div className="w-12 h-12 border border-[var(--accent)] flex items-center justify-center bg-[var(--bg-deep)]">
                      <Wallet className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Wallet connected</p>
                      <p className="text-xs text-[var(--text-secondary)] truncate font-mono">
                        {UNIVERSAL_WALLET_ADDRESS}
                      </p>
                    </div>
                    <div className="text-[10px] px-2 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold">
                      ARBITRUM
                    </div>
                  </div>
                  <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)] rounded">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">Ready to start</p>
                    <p>We'll keep your wallet connected while you finish the steps.</p>
                  </div>
                  <button
                    onClick={() => setStep('preferences')}
                    className="w-full py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 mx-auto border border-[var(--accent)] flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg mb-2">CONNECT WALLET</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Connect your Arbitrum wallet to whitelist the agent
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    CONNECT WALLET
                  </button>
                </div>
              )
            ) : step === 'preferences' ? (
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 border border-[var(--accent)] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[var(--accent)]" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg">Set Your Trading Preferences</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {firstDeploymentPreferences
                        ? 'Using values from your first deployment. Adjust as needed.'
                        : 'Configure how this agent should size and filter trades for you.'}
                    </p>
                  </div>
                </div>

                <div className="border border-[var(--border)] bg-[var(--bg-deep)] flex flex-col max-h-[60vh]">
                  {loadingFirstDeploymentPreferences ? (
                    <div className="flex items-center justify-center py-20">
                      <Activity className="w-8 h-8 text-[var(--accent)] animate-spin" />
                    </div>
                  ) : (
                    <TradingPreferencesForm
                      userWallet={isWalletConnected ? UNIVERSAL_WALLET_ADDRESS : ''}
                      onClose={onClose}
                      onBack={goBack}
                      localOnly={true}
                      onSaveLocal={handlePreferencesSet}
                      primaryLabel={loading ? 'Saving...' : 'Save & Continue'}
                      initialPreferences={firstDeploymentPreferences || tradingPreferences || undefined}
                    />
                  )}
                </div>
              </div>
            ) : step === 'agent' ? (
              <div className="text-center space-y-4 py-8">
                <Activity className="w-16 h-16 mx-auto text-[var(--accent)] animate-pulse" />
                <div>
                  <h3 className="font-display text-lg mb-2">ASSIGNING AGENT...</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Assigning your agent wallet
                  </p>
                </div>
              </div>
            ) : step === 'oneclick' ? (
              <>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-display text-xl mb-2">Enable 1-Click Trading</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Make the most of Ostium. Enable gasless transactions and 1-click trading.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">STEPS</p>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">Sign the following wallet requests.</p>
                  </div>

                  {/* Step 1: Enable Account Delegation */}
                  <div className={`border p-4 rounded ${delegateApproved ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center border ${delegateApproved ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>
                        {delegateApproved ? <CheckCircle className="w-5 h-5" /> : <div className="w-4 h-4 border-2 border-[var(--border)] rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">ENABLE ACCOUNT DELEGATION</p>
                        <p className="text-xs text-[var(--text-secondary)]">Delegate signatures to a smart wallet.</p>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Set Allowance */}
                  <div className={`border p-4 rounded ${usdcApproved ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 flex items-center justify-center border ${usdcApproved ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg-deep)]' : 'border-[var(--border)]'}`}>
                        {usdcApproved ? <CheckCircle className="w-5 h-5" /> : <span className="text-xs font-bold">2</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">SET ALLOWANCE</p>
                        <p className="text-xs text-[var(--text-secondary)]">Set the maximum allowance. It's advisable to set this high.</p>
                      </div>
                    </div>
                  </div>

                  {txHash && (
                    <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-3">
                      <p className="text-[var(--accent)] text-sm mb-2">✓ Transaction confirmed</p>
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1"
                      >
                        View on Arbiscan <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={goBack}
                      className="w-32 py-3 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors"
                      type="button"
                    >
                      Back
                    </button>
                    <button
                      onClick={enableOneClickTrading}
                      disabled={loading || (delegateApproved && usdcApproved)}
                      className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Activity className="w-5 h-5 animate-pulse" />
                          {currentAction || 'ENABLING 1-CLICK TRADING...'}
                        </>
                      ) : (delegateApproved && usdcApproved) ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          ENABLED
                        </>
                      ) : (
                        'ENABLE 1-CLICK TRADING'
                      )}
                    </button>
                    {(delegateApproved && usdcApproved) && (
                      <button
                        onClick={() => setStep('complete')}
                        className="w-40 py-3 border border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/10 transition-colors"
                        type="button"
                      >
                        Next: Join
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : deploymentId ? (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 mx-auto border border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-[var(--bg-deep)]" />
                </div>
                <div>
                  <h3 className="font-display text-xl mb-2">AGENT DEPLOYED</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Agent is now live and ready to trade on Ostium
                  </p>
                </div>

                {txHash && (
                  <a
                    href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--accent)] hover:underline flex items-center justify-center gap-1"
                  >
                    View transaction <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-4 space-y-2 text-sm text-left">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                    <span>Agent whitelisted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                    <span>USDC approved</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                    <span>Agent deployed and active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                    <span>Ready to execute signals</span>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={goBack}
                    className="px-4 py-3 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors"
                    type="button"
                  >
                    Back
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                    type="button"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="flex items-start gap-3 p-4 border border-[var(--danger)] bg-[var(--danger)]/10">
                    <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--danger)]">{error}</span>
                  </div>
                )}

                {deploymentId ? (
                  <div className="text-center space-y-6 py-4">
                    <div className="w-16 h-16 mx-auto border border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-[var(--bg-deep)]" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl mb-2">AGENT DEPLOYED</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Agent is now live and ready to trade on Ostium
                      </p>
                    </div>

                    {txHash && (
                      <a
                        href={`https://sepolia.arbiscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[var(--accent)] hover:underline flex items-center justify-center gap-1"
                      >
                        View transaction <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-4 space-y-2 text-sm text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                        <span>Agent whitelisted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                        <span>USDC approved</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                        <span>Agent deployed and active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                        <span>Ready to execute signals</span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={goBack}
                        className="px-4 py-3 border border-[var(--accent)]/60 text-[var(--text-primary)] font-semibold hover:border-[var(--accent)] transition-colors"
                        type="button"
                      >
                        Back
                      </button>
                      <button
                        onClick={onClose}
                        className="px-4 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                        type="button"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 py-4">
                    {/* AGENT LIVE Header */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto border-2 border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center mb-4">
                        <Zap className="w-10 h-10 text-[var(--bg-deep)]" />
                      </div>
                      <h3 className="font-display text-2xl mb-2">AGENT LIVE</h3>
                      <p className="text-sm text-[var(--text-secondary)]">
                        All approvals complete. Ready to deploy the agent.
                      </p>
                    </div>

                    {/* SETUP COMPLETE Section */}
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-display text-lg text-[var(--accent)] mb-3">SETUP COMPLETE</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[var(--accent)] rounded-full" />
                              <span className="text-sm">Agent whitelisted & assigned</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[var(--accent)] rounded-full" />
                              <span className="text-sm">USDC approved (Non-custodial)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                          <span className="text-xs text-[var(--text-muted)] font-bold">READY TO ACTIVATE</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                          <span className="text-xs text-[var(--text-secondary)]">Agent whitelisted & assigned</span>
                        </div>
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
                          <span className="text-xs text-[var(--text-secondary)]">USDC approved (Non-custodial)</span>
                        </div>
                      </div>

                      {totalCost > 0 && (
                        <div className="mt-4 pt-4 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Credit Summary</p>
                            <span className={`text-[10px] px-2 py-0.5 border font-bold rounded ${isCreator ? 'border-green-500/30 text-green-500' : 'border-[var(--accent)]/30 text-[var(--accent)]'}`}>
                              {isCreator ? 'CREATOR - FREE ACCESS' : 'PAID ACCESS'}
                            </span>
                          </div>

                          {!isCreator && (
                            <div className="mb-4 space-y-1">
                              {agentData?.agent_telegram_users?.map((au: any, idx: number) => {
                                if (au.telegram_alpha_users?.credit_price && parseFloat(au.telegram_alpha_users.credit_price) > 0) {
                                  return (
                                    <div key={idx} className="flex justify-between text-[10px]">
                                      <span className="text-[var(--text-secondary)] italic">Alpha Access: {au.telegram_alpha_users.telegram_username || 'Provider'}</span>
                                      <span className="text-[var(--text-primary)]">{parseFloat(au.telegram_alpha_users.credit_price).toFixed(0)} CREDS</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                              <div className="flex justify-between text-[10px] pt-1 border-t border-[var(--border)] border-dashed">
                                <span className="text-[var(--text-muted)]">Platform Fee (10%)</span>
                                <span className="text-[var(--text-primary)]">{(totalCost * (10 / 110)).toFixed(0)} CREDS</span>
                              </div>
                            </div>
                          )}

                          {isCreator ? (
                            <div className="bg-green-500/5 p-3 border border-green-500/20 rounded">
                              <p className="text-[11px] text-green-500 font-bold text-center">
                                ✓ AS THE CREATOR, YOU JOIN FOR FREE
                              </p>
                              <p className="text-[9px] text-[var(--text-muted)] text-center mt-1">
                                You already paid when creating this club
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Cost to Join</p>
                                  <p className="text-xl font-display text-[var(--text-primary)]">{totalCost.toFixed(0)} <span className="text-[10px] text-[var(--text-secondary)]">CREDS</span></p>
                                </div>
                                <div className="space-y-1 text-right">
                                  <p className="text-[10px] text-[var(--text-muted)] uppercase">Your Balance</p>
                                  <p className={`text-xl font-display ${creditBalance < totalCost ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>{creditBalance.toFixed(0)} <span className="text-[10px] text-[var(--text-secondary)]">CREDS</span></p>
                                </div>
                              </div>

                              {creditBalance >= totalCost ? (
                                <div className="mt-3 bg-[var(--accent)]/5 p-2 border border-[var(--accent)]/10">
                                  <p className="text-[10px] text-[var(--accent)] font-bold text-center">
                                    NEW BALANCE AFTER JOIN: {(creditBalance - totalCost).toFixed(0)} CREDS
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-3 bg-red-500/5 p-2 border border-red-500/20">
                                  <p className="text-[10px] text-red-500 font-bold text-center">
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
                    <div className="flex gap-3">
                      <button
                        onClick={goBack}
                        className="px-6 py-3 border border-[var(--border)] text-[var(--text-primary)] font-bold hover:bg-[var(--bg-elevated)] transition-colors"
                        type="button"
                      >
                        Back
                      </button>
                      <button
                        onClick={joinAgent}
                        disabled={joiningAgent || (!isCreator && totalCost > 0 && creditBalance < totalCost)}
                        className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        type="button"
                      >
                        {joiningAgent ? (
                          <>
                            <Activity className="w-5 h-5 animate-spin" />
                            JOINING AGENT...
                          </>
                        ) : !isCreator && totalCost > 0 && creditBalance < totalCost ? (
                          <>
                            <AlertCircle className="w-5 h-5" />
                            INSUFFICIENT CREDITS
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            {isCreator ? 'JOIN AGENT (FREE - CREATOR)' : totalCost > 0 ? `JOIN AGENT (${totalCost.toFixed(0)} CREDS)` : 'JOIN AGENT (FREE)'}
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

