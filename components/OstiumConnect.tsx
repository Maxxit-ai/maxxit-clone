/**
 * Ostium Connection Flow - Brutalist Design (Frontend Simulation Only)
 */

import { useState, useEffect, useRef } from 'react';
import { X, Wallet, CheckCircle, AlertCircle, Zap, Activity, ExternalLink } from 'lucide-react';
import { TradingPreferencesForm, TradingPreferences } from './TradingPreferencesModal';

interface OstiumConnectProps {
  agentId: string;
  agentName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

import { UNIVERSAL_WALLET_ADDRESS, UNIVERSAL_OSTIUM_AGENT_ADDRESS } from '../json/addresses';

export function OstiumConnect({
  agentId,
  agentName,
  onClose,
  onSuccess,
}: OstiumConnectProps) {

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deploymentId, setDeploymentId] = useState<string>('');
  const [step, setStep] = useState<'connect' | 'preferences' | 'agent' | 'delegate' | 'usdc' | 'complete'>('connect');
  const [joiningAgent, setJoiningAgent] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [delegateApproved, setDelegateApproved] = useState(false);
  const [usdcApproved, setUsdcApproved] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [agentAddress] = useState(UNIVERSAL_OSTIUM_AGENT_ADDRESS);

  // Trading preferences stored locally until all approvals complete
  const [tradingPreferences, setTradingPreferences] = useState<TradingPreferences | null>(null);
  const tradingPreferencesRef = useRef<TradingPreferences | null>(null); // ensures latest prefs are used in async flows
  const [firstDeploymentPreferences, setFirstDeploymentPreferences] = useState<TradingPreferences | null>(null);
  const [loadingFirstDeploymentPreferences, setLoadingFirstDeploymentPreferences] = useState(false);


  const checkSetupStatus = async () => {
    // Frontend-only: simulate a quick setup check, then move to delegate step
    console.log('[OstiumConnect] Skipping backend setup check (frontend simulation)');
    setTimeout(() => {
      setLoading(false);
      setStep('delegate');
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

  // const approveAgent = async () => {
  //   setLoading(true);
  //   setError('');

  //   // Frontend-only simulation of delegate approval
  //   setTimeout(() => {
  //     console.log('[OstiumConnect] ✅ Simulated delegate approval, moving to USDC step');
  //     setDelegateApproved(true);
  //     setStep('usdc');
  //     setTxHash('0xSIMULATED_DELEGATE_TX');
  //     setLoading(false);
  //   }, 2000);
  // };

  // const approveUsdc = async () => {
  //   console.log('[OstiumConnect] approveUsdc called - starting USDC approval flow');
  //   setLoading(true);
  //   setError('');

  //   try {
  //     if (!authenticated || !user?.wallet?.address) {
  //       throw new Error('Please connect your wallet');
  //     }

  //     const provider = (window as any).ethereum;
  //     if (!provider) {
  //       throw new Error('No wallet provider found.');
  //     }

  //     const ethersProvider = new ethers.providers.Web3Provider(provider);
  //     await ethersProvider.send('eth_requestAccounts', []);

  //     const network = await ethersProvider.getNetwork();
  //     if (network.chainId !== ARBITRUM_CHAIN_ID) {
  //       throw new Error('Please switch to Arbitrum');
  //     }

  //     const signer = ethersProvider.getSigner();
  //     const usdcContract = new ethers.Contract(USDC_TOKEN, USDC_ABI, signer);

  //     const currentAllowanceStorage = await usdcContract.allowance(user.wallet.address, OSTIUM_STORAGE);
  //     // const currentAllowanceTrading = await usdcContract.allowance(user.wallet.address, OSTIUM_TRADING_CONTRACT);
  //     const allowanceAmount = ethers.utils.parseUnits('1000000', 6);

  //     const storageAllowance = parseFloat(ethers.utils.formatUnits(currentAllowanceStorage, 6));
  //     // const tradingAllowance = parseFloat(ethers.utils.formatUnits(currentAllowanceTrading, 6));
  //     const requiredAmount = parseFloat(ethers.utils.formatUnits(allowanceAmount, 6));

  //     console.log('[OstiumConnect] USDC Approval Check:');
  //     console.log('  Storage allowance:', storageAllowance, 'USDC');
  //     // console.log('  Trading allowance:', tradingAllowance, 'USDC');
  //     console.log('  Required amount:', requiredAmount, 'USDC');

  //     // Use a lower threshold - only skip if user has genuinely high approval
  //     // This ensures first-time users always go through the approval flow
  //     const MIN_REQUIRED_APPROVAL = 100; // $100 minimum to skip (not $10)
  //     const needsStorageApproval = storageAllowance < MIN_REQUIRED_APPROVAL;
  //     // const needsTradingApproval = tradingAllowance < MIN_REQUIRED_APPROVAL;

  //     console.log('  Needs Storage approval:', needsStorageApproval, `(current: ${storageAllowance}, required: ${MIN_REQUIRED_APPROVAL})`);
  //     // console.log('  Needs Trading approval:', needsTradingApproval, `(current: ${tradingAllowance}, required: ${MIN_REQUIRED_APPROVAL})`);

  //     if (!needsStorageApproval) {
  //       console.log('[OstiumConnect] USDC already sufficiently approved, skipping to complete');
  //       setUsdcApproved(true);
  //       setStep('complete');

  //       // Call onSuccess but don't auto-close - let user close manually
  //       if (onSuccess) {
  //         onSuccess();
  //       }
  //       return;
  //     }

  //     // At least one approval is needed
  //     console.log('[OstiumConnect] USDC approval needed, proceeding with transaction(s)');

  //     if (needsStorageApproval) {
  //       const approveData = usdcContract.interface.encodeFunctionData('approve', [OSTIUM_STORAGE, allowanceAmount]);
  //       const gasEstimate = await ethersProvider.estimateGas({
  //         to: USDC_TOKEN,
  //         from: user.wallet.address,
  //         data: approveData,
  //       });

  //       // 50% gas buffer for reliability
  //       const gasWithBuffer = gasEstimate.mul(150).div(100);
  //       console.log(`[OstiumConnect] USDC Storage approval - Gas estimate: ${gasEstimate.toString()}, with 50% buffer: ${gasWithBuffer.toString()}`);

  //       const txHash = await provider.request({
  //         method: 'eth_sendTransaction',
  //         params: [{
  //           from: user.wallet.address,
  //           to: USDC_TOKEN,
  //           data: approveData,
  //           gas: gasWithBuffer.toHexString(),
  //         }],
  //       });

  //       setTxHash(txHash);
  //       await ethersProvider.waitForTransaction(txHash);
  //     }

  //     // if (needsTradingApproval) {
  //     //   const approveDataTrading = usdcContract.interface.encodeFunctionData('approve', [OSTIUM_TRADING_CONTRACT, allowanceAmount]);
  //     //   const gasEstimateTrading = await ethersProvider.estimateGas({
  //     //     to: USDC_TOKEN,
  //     //     from: user.wallet.address,
  //     //     data: approveDataTrading,
  //     //   });

  //     //   // 50% gas buffer for reliability
  //     //   const gasWithBufferTrading = gasEstimateTrading.mul(150).div(100);
  //     //   console.log(`[OstiumConnect] USDC Trading approval - Gas estimate: ${gasEstimateTrading.toString()}, with 50% buffer: ${gasWithBufferTrading.toString()}`);

  //     //   const txHashTrading = await provider.request({
  //     //     method: 'eth_sendTransaction',
  //     //     params: [{
  //     //       from: user.wallet.address,
  //     //       to: USDC_TOKEN,
  //     //       data: approveDataTrading,
  //     //       gas: gasWithBufferTrading.toHexString(),
  //     //     }],
  //     //   });

  //     //   setTxHash(txHashTrading);
  //     //   await ethersProvider.waitForTransaction(txHashTrading);
  //     // }

  //     setUsdcApproved(true);
  //     setStep('complete');

  //     // Don't call onSuccess here - wait until deployment is actually created
  //     // onSuccess will be called in joinAgent function

  //   } catch (err: any) {
  //     console.error('USDC approval error:', err);

  //     if (err.code === 4001 || err.message?.includes('rejected')) {
  //       setError('Transaction rejected');
  //     } else {
  //       setError(err.message || 'Failed to approve USDC');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // const handleConnect = () => {
  //   if (!authenticated) {
  //     login();
  //   }
  // };

  const approveAgent = async () => {
    // Frontend-only simulation of delegate approval
    console.log('[OstiumConnect] Simulating delegate approval');
    setLoading(true);
    setError('');
    setTimeout(() => {
      setDelegateApproved(true);
      setStep('usdc');
      setTxHash('0xSIMULATED_DELEGATE_TX');
      setLoading(false);
    }, 1200);
  };

  const approveUsdc = async () => {
    // Frontend-only simulation of USDC approval
    console.log('[OstiumConnect] Simulating USDC approval');
    setLoading(true);
    setError('');
    setTimeout(() => {
      setUsdcApproved(true);
      setStep('complete');
      setTxHash('0xSIMULATED_USDC_TX');
      setLoading(false);
    }, 1200);
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

    // After preferences are set, proceed to check setup status with fresh prefs
    setLoading(true);
    checkSetupStatus();
  };

  const loadFirstDeploymentPreferences = async () => {
    // Frontend-only: no previous deployments to load in this simulation
    console.log('[OstiumConnect] loadFirstDeploymentPreferences (simulation, returning null)');
    return null;
  };

  const goBack = () => {
    if (step === 'preferences') {
      setStep('connect');
    } else if (step === 'agent') {
      setStep('preferences');
    } else if (step === 'delegate') {
      setStep('preferences');
    } else if (step === 'usdc') {
      setStep('delegate');
    } else if (step === 'complete') {
      setStep('usdc');
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
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'delegate'
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
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${step === 'usdc'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                >
                  4
                </span>
                <div>
                  <p className="font-semibold">Provide funds (non-custodial)</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Funds stay in your wallet, only routed to Ostium.</p>
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
                        {UNIVERSAL_CONNECTED_WALLET_ADDRESS}
                      </p>
                    </div>
                    <div className="text-[10px] px-2 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold">
                      ARBITRUM
                    </div>
                  </div>
                  <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)] rounded">
                    <p className="font-semibold text-[var(--text-primary)] mb-1">Ready to start</p>
                    <p>We’ll keep your wallet connected while you finish the steps.</p>
                  </div>
                  <button
                    onClick={() => setStep('preferences')}
                    className="w-full py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                // Show connect button if not authenticated
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
                      userWallet={isWalletConnected ? UNIVERSAL_CONNECTED_WALLET_ADDRESS : ''}
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
            ) : step === 'delegate' ? (
              <>
                <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-4 space-y-2 rounded">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--accent)] font-semibold">Step 3 · Assign Agent to Trade for You</p>
                    {delegateApproved && (
                      <span className="text-[10px] px-2 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">
                    This assigns your Alpha Club's trading wallet to execute trades on your behalf. The agent can open and close positions, but <strong className="text-[var(--accent)]">cannot withdraw your funds</strong>.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="border border-[var(--border)] p-3 rounded">
                    <p className="font-semibold text-[var(--text-primary)]">Trading wallet assigned</p>
                    <p className="font-mono break-all text-[var(--text-secondary)] mt-1">{agentAddress}</p>
                  </div>
                  <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 rounded">
                    <p className="font-semibold text-[var(--accent)]">🔒 Your funds stay safe</p>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Agent can only trade. It cannot withdraw, transfer, or access any other tokens. Revoke anytime.
                    </p>
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
                    onClick={approveAgent}
                    disabled={loading || delegateApproved}
                    className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Activity className="w-5 h-5 animate-pulse" />
                        SIGNING...
                      </>
                    ) : delegateApproved ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        DELEGATE APPROVED
                      </>
                    ) : (
                      'APPROVE AGENT ACCESS →'
                    )}
                  </button>
                  {delegateApproved && (
                    <button
                      onClick={() => setStep('usdc')}
                      className="w-40 py-3 border border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/10 transition-colors"
                      type="button"
                    >
                      Next: USDC
                    </button>
                  )}
                </div>
              </>
            ) : step === 'usdc' ? (
              <>
                <div className="border border-[var(--accent)] bg-[var(--accent)]/5 p-4 space-y-3 text-sm rounded">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-[var(--accent)]">STEP 4: PROVIDE FUNDS TO AGENT (NON-CUSTODIAL)</p>
                    {!usdcApproved && (
                      <span className="text-[10px] px-2 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold rounded">
                        Required
                      </span>
                    )}
                    {usdcApproved && (
                      <span className="text-[10px] px-2 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold rounded">
                        Completed
                      </span>
                    )}
                  </div>
                  <p className="text-[var(--text-secondary)]">
                    You're allowing the agent to use your USDC for trading on Ostium. This is <strong className="text-[var(--accent)]">100% non-custodial</strong>: your funds never leave your wallet — they're only routed to Ostium for position management.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3 text-xs">
                  <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-3 rounded">
                    <p className="font-semibold text-[var(--accent)]">🔒 Non-custodial guarantee</p>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Funds stay in YOUR wallet. Agent can only route USDC to Ostium for trades — cannot withdraw or transfer elsewhere.
                    </p>
                  </div>
                  <div className="border border-[var(--border)] p-3 rounded">
                    <p className="font-semibold text-[var(--text-primary)]">Full control</p>
                    <p className="text-[var(--text-secondary)] mt-1">
                      Revoke or reduce this allowance anytime from your wallet. Agent cannot access other tokens.
                    </p>
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
                    onClick={approveUsdc}
                    disabled={loading || usdcApproved}
                    className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Activity className="w-5 h-5 animate-pulse" />
                        SIGNING...
                      </>
                    ) : usdcApproved ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        USDC APPROVED
                      </>
                    ) : (
                      'APPROVE USDC →'
                    )}
                  </button>
                  {usdcApproved && (
                    <button
                      onClick={() => setStep('complete')}
                      className="w-40 py-3 border border-[var(--accent)] text-[var(--accent)] font-semibold hover:bg-[var(--accent)]/10 transition-colors"
                      type="button"
                    >
                      Next: Finish
                    </button>
                  )}
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
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 mx-auto border border-[var(--accent)] flex items-center justify-center">
                  <Zap className="w-10 h-10 text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-display text-xl mb-2">AGENT LIVE</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    All approvals complete. Ready to deploy the agent.
                  </p>
                </div>

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
                    <div className="w-4 h-4 border border-[var(--accent)] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse" />
                    </div>
                    <span>Ready to deploy agent</span>
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
                    onClick={joinAgent}
                    disabled={joiningAgent}
                    className="px-6 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center gap-2"
                    type="button"
                  >
                    {joiningAgent ? (
                      <>
                        <Activity className="w-5 h-5 animate-spin" />
                        JOINING AGENT...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        JOIN AGENT
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

