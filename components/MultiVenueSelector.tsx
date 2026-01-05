import { useState, useEffect } from 'react';
import { X, Zap, ArrowRight, CheckCircle, Activity, Wallet, Copy, Check, ExternalLink, Send } from 'lucide-react';
import { HyperliquidConnect } from './HyperliquidConnect';
import { OstiumConnect } from './OstiumConnect';

interface MultiVenueSelectorProps {
  agentId: string;
  agentName: string;
  agentDescription: string | null;
  onClose: () => void;
  onComplete: () => void;
  userAgentAddresses?: {
    hyperliquid?: string | null;
    ostium?: string | null;
  } | null;
  agentDeployments?: Record<string, string[]> | null; // from static JSON: agentId -> enabled_venues[]
}

export function MultiVenueSelector({
  agentId,
  agentName,
  agentDescription,
  onClose,
  onComplete,
  userAgentAddresses,
  agentDeployments,
}: MultiVenueSelectorProps) {
  const [hyperliquidModalOpen, setHyperliquidModalOpen] = useState(false);
  const [ostiumModalOpen, setOstiumModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setupStatus, setSetupStatus] = useState<{
    hasHyperliquid: boolean;
    hasOstium: boolean;
  } | null>(null);
  const [notification, setNotification] = useState<string>('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [ethAmount, setEthAmount] = useState<string>('');
  const [sendingEth, setSendingEth] = useState(false);
  const [ethTxHash, setEthTxHash] = useState<string | null>(null);
  const [ethError, setEthError] = useState<string | null>(null);

  const handleCopyAddress = (address: string, type: 'hyperliquid' | 'ostium') => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(`${type}-${address}`);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const handleSendETH = async () => {
    if (!userAgentAddresses?.ostium || !ethAmount) {
      setEthError('Please enter an ETH amount');
      setTimeout(() => setEthError(null), 3000);
      return;
    }

    const amount = parseFloat(ethAmount);
    if (isNaN(amount) || amount <= 0) {
      setEthError('Please enter a valid ETH amount');
      setTimeout(() => setEthError(null), 3000);
      return;
    }

    try {
      // Frontend-only simulation of sending ETH - no real blockchain interaction
      setSendingEth(true);
      setEthError(null);
      setEthTxHash(null);

      const simulatedTxHash = `0xSIMULATED_ETH_TX_${Date.now().toString(16)}`;
      setEthTxHash(simulatedTxHash);
      setNotification(`ETH transaction sent! Hash: ${simulatedTxHash.slice(0, 10)}...`);

      // Simulate confirmation delay
      setTimeout(() => {
        setNotification('ETH successfully "sent" to agent address (simulation).');
        setTimeout(() => setNotification(''), 5000);
        setEthAmount('');
        setEthTxHash(null);
        setSendingEth(false);
      }, 1500);
    } catch (err: any) {
      console.error('Error in simulated ETH send:', err);
      setEthError('Failed to simulate ETH send. Please try again.');
      setTimeout(() => setEthError(null), 5000);
      setSendingEth(false);
    }
  };

  useEffect(() => {
    // Frontend-only: simulate initial setup status load
    checkSetupStatus();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const checkSetupStatus = async () => {
    // Frontend-only: no backend status check.
    // Use static JSON-derived deployments to decide which venues are "active" for this agent.
    const deploymentsForAgent = (typeof agentDeployments === 'object' && agentDeployments)
      ? agentDeployments[agentId] || []
      : [];

    const hasOstium = deploymentsForAgent.includes('OSTIUM');
    const hasHyperliquid = deploymentsForAgent.includes('HYPERLIQUID');

    setSetupStatus({ hasHyperliquid, hasOstium });
    setLoading(false);
  };

  const venues = [
    {
      id: 'OSTIUM',
      name: 'OSTIUM',
      description: 'Arbitrum perpetuals with low gas',
    },
    {
      id: 'HYPERLIQUID',
      name: 'HYPERLIQUID',
      description: 'Coming soon',
      disabled: true,
    },
    {
      id: 'SPOT',
      name: 'SPOT',
      description: 'Coming soon',
      disabled: true,
    },
  ];

  const handleVenueClick = (venueId: string) => {
    // Check if venue is already set up
    const isAlreadySetup =
      (venueId === 'HYPERLIQUID' && setupStatus?.hasHyperliquid) ||
      (venueId === 'OSTIUM' && setupStatus?.hasOstium);

    if (isAlreadySetup) {
      // Show notification that venue is already active
      setNotification(`${venueId} is already active for this agent`);
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    if (venueId === 'HYPERLIQUID') {
      setHyperliquidModalOpen(true);
    } else if (venueId === 'OSTIUM') {
      setOstiumModalOpen(true);
    }
  };

  // Loading state (frontend-only simulation)
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-deep)] border border-[var(--border)] max-w-md w-full p-8">
          <div className="text-center space-y-4">
            <Activity className="h-12 w-12 mx-auto text-[var(--accent)] animate-pulse" />
            <p className="text-[var(--text-muted)]">Checking setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-deep)] border border-[var(--border)] max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-[var(--border)] p-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="font-display text-xl">{agentName}</h2>
              {agentDescription && <p className="text-xs text-[var(--text-secondary)] pb-2">{agentDescription}</p>}
              <p className="text-xs text-[var(--text-muted)] mt-1">Select a venue to join</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div
            className="p-4 overflow-y-auto flex-1 modal-scrollable"
            style={{ overscrollBehavior: 'contain' }}
            onWheel={(e) => {
              const target = e.currentTarget;
              const isAtTop = target.scrollTop === 0;
              const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;

              // Prevent scroll propagation if not at boundaries
              if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                e.stopPropagation();
              }
            }}
          >
            {/* Notification Toast */}
            {notification && (
              <div className="mb-4 p-3 border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>{notification}</span>
              </div>
            )}

            {/* Venue buttons - horizontal layout */}
            <div className="grid grid-cols-3 gap-3">
              {venues.map((venue) => {
                const isAlreadySetup =
                  (venue.id === 'HYPERLIQUID' && setupStatus?.hasHyperliquid) ||
                  (venue.id === 'OSTIUM' && setupStatus?.hasOstium);

                return (
                  <button
                    key={venue.id}
                    onClick={() => !venue.disabled && handleVenueClick(venue.id)}
                    disabled={venue.disabled}
                    className={`p-4 border transition-all text-center ${venue.disabled ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''} ${isAlreadySetup
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 cursor-pointer'
                      : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                  >
                    <div className="space-y-2">
                      <div className="w-8 h-8 border border-[var(--accent)] flex items-center justify-center mx-auto">
                        <Zap className="w-4 h-4 text-[var(--accent)]" />
                      </div>
                      <h3 className="font-display text-sm">{venue.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{venue.description}</p>

                      {!venue.disabled && !isAlreadySetup && (
                        <div className="ml-13 space-y-1 text-xs text-[var(--text-muted)] mt-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--accent)]">✓</span>
                            <span>Non-custodial trading</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--accent)]">✓</span>
                            <span>Gasless execution</span>
                          </div>
                        </div>
                      )}

                      {venue.disabled ? (
                        <div className="mt-2 px-3 py-1 border border-[var(--border)] text-[var(--text-muted)] text-xs inline-block">
                          COMING SOON
                        </div>
                      ) : isAlreadySetup ? (
                        <div className="mt-2 space-y-1">
                          <div className="px-3 py-1 bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-xs inline-flex items-center gap-1.5">
                            <CheckCircle className="w-3 h-3" />
                            ACTIVE
                          </div>
                          <p className="text-xs text-[var(--text-muted)] italic">Click for details</p>
                        </div>
                      ) : (
                        <div className="mt-2 px-3 py-1 border border-[var(--accent)] text-[var(--accent)] font-bold text-xs inline-flex items-center gap-1.5">
                          SETUP
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Agent Addresses Display */}
            {userAgentAddresses && (userAgentAddresses.hyperliquid || userAgentAddresses.ostium) && (
              <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 mt-6">
                <p className="data-label mb-3">YOUR AGENT WALLETS</p>
                <div className="space-y-3">
                  {/* {userAgentAddresses.hyperliquid && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 border-2 border-[var(--accent)]/60 flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-[var(--accent)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--accent)] uppercase">HYPERLIQUID</p>
                          <p className="text-xs font-mono text-[var(--text-primary)] truncate" title={userAgentAddresses.hyperliquid}>
                            {formatAddress(userAgentAddresses.hyperliquid)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyAddress(userAgentAddresses.hyperliquid!, 'hyperliquid')}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0 border border-[var(--border)] hover:border-[var(--accent)]/50"
                        title="Copy full address"
                      >
                        {copiedAddress === `hyperliquid-${userAgentAddresses.hyperliquid}` ? (
                          <Check className="w-4 h-4 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )} */}

                  {userAgentAddresses.ostium && (
                    <div className="flex items-center justify-between gap-3 p-3 bg-[var(--bg-deep)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 border-2 border-[var(--accent)]/60 flex items-center justify-center flex-shrink-0">
                          <Wallet className="w-4 h-4 text-[var(--accent)]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--accent)] uppercase">OSTIUM</p>
                          <p className="text-xs font-mono text-[var(--text-primary)] truncate" title={userAgentAddresses.ostium}>
                            {formatAddress(userAgentAddresses.ostium)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCopyAddress(userAgentAddresses.ostium!, 'ostium')}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0 border border-[var(--border)] hover:border-[var(--accent)]/50"
                        title="Copy full address"
                      >
                        {copiedAddress === `ostium-${userAgentAddresses.ostium}` ? (
                          <Check className="w-4 h-4 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Step-by-Step Instructions */}
            <div className="border border-[var(--border)] p-4 mt-6">
              <p className="data-label mb-4">SETUP INSTRUCTIONS</p>
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      1
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Select a Venue</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Click on a venue button above (OSTIUM, HYPERLIQUID, or SPOT) to begin the deployment process.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      2
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Configure Trading Preferences</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Set your risk tolerance, trade frequency, and other trading parameters for the agent.
                    </p>
                  </div>
                </div>

                {/* Step 3 - Venue Specific */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      3
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">
                      {setupStatus?.hasOstium ? 'OSTIUM: ' : setupStatus?.hasHyperliquid ? 'HYPERLIQUID: ' : 'Complete '}
                      Approve Agent Delegation
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Sign transactions to delegate trading permissions to your trading wallet. This allows the agent to execute trades on your behalf.
                    </p>
                  </div>
                </div>

                {/* Step 4 - USDC Approval */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      4
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Approve USDC</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Approve USDC spending for the agent so it can execute trades using your funds.
                    </p>
                  </div>
                </div>

                {/* Step 5 - Active */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] font-bold text-sm">
                      ✓
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Agent Active</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Once all steps are complete, the agent will automatically execute trades based on signals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* OSTIUM Specific: ETH Funding & Registration */}
            {userAgentAddresses?.ostium && (
              <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 mt-6">
                <p className="data-label mb-3">OSTIUM SETUP COMPLETE - NEXT STEPS</p>

                {/* ETH Funding Section */}
                <div className="mb-4 p-3 bg-[var(--bg-deep)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Fund Agent with ETH
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    Send ETH to your trading address so it can pay for gas fees when executing trades.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0.01"
                      value={ethAmount}
                      onChange={(e) => setEthAmount(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      onClick={handleSendETH}
                      disabled={sendingEth || !ethAmount || parseFloat(ethAmount) <= 0}
                      className="px-4 py-2 bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-xs hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {sendingEth ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          SENDING...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          SEND ETH
                        </>
                      )}
                    </button>
                  </div>
                  {ethTxHash && (
                    <p className="text-xs text-[var(--accent)] mt-2 font-mono">
                      TX: {ethTxHash.slice(0, 20)}...
                    </p>
                  )}
                  {ethError && (
                    <p className="text-xs text-red-500 mt-2">
                      {ethError}
                    </p>
                  )}
                </div>

                {/* Registration Instructions */}
                <div className="p-3 bg-[var(--bg-deep)] border border-[var(--border)]">
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />
                    Register on Ostium Platform
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mb-3">
                    To enable trading, you need to register on the Ostium platform and deposit USDC:
                  </p>
                  <ol className="space-y-2 text-xs text-[var(--text-secondary)] ml-4 list-decimal">
                    <li>
                      Visit{' '}
                      <a
                        href="https://app.ostium.com/trade"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                      >
                        app.ostium.com/trade
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>Connect your wallet and set a username</li>
                    <li>Deposit USDC to your account</li>
                    <li>The agent will trade using the USDC you deposit</li>
                  </ol>
                  <a
                    href="https://app.ostium.com/trade"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-xs hover:bg-[var(--accent-dim)] transition-colors"
                  >
                    Open Ostium Platform
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Done button - only show if at least one venue is active */}
            {(setupStatus?.hasHyperliquid || setupStatus?.hasOstium) && (
              <button
                onClick={onComplete}
                className="w-full mt-4 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors mb-4"
              >
                DONE
              </button>
            )}
          </div>
        </div>
      </div>

      {hyperliquidModalOpen && (
        <HyperliquidConnect
          agentId={agentId}
          agentName={agentName}
          agentVenue="MULTI"
          onClose={() => setHyperliquidModalOpen(false)}
          onSuccess={() => {
            setHyperliquidModalOpen(false);
            checkSetupStatus();
          }}
        />
      )}

      {ostiumModalOpen && (
        <OstiumConnect
          agentId={agentId}
          agentName={agentName}
          onClose={() => {
            setOstiumModalOpen(false);
            // Refresh setup status when modal is closed
            checkSetupStatus();
          }}
          onSuccess={() => {
            // Don't close modal here - let user close manually
            // Just refresh setup status
            checkSetupStatus();
            // Refresh addresses will be handled by parent component via onComplete
          }}
        />
      )}
    </>
  );
}