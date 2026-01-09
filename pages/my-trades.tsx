import { useEffect, useRef, useState } from "react";
import { Header } from "@components/Header";
import simulationDataJson from "../json/simulation-data.json";
import { UNIVERSAL_WALLET_ADDRESS } from "../json/addresses";
import {
  Wallet,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Shield,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  Loader2,
  Bell,
  BellOff,
} from "lucide-react";

interface Trade {
  id: string;
  tokenSymbol: string;
  side: string;
  status: string;
  qty: string;
  entryPrice: string;
  currentPrice: string | null;
  exitPrice: string | null;
  pnl: string | null;
  unrealizedPnl: string | null;
  unrealizedPnlPercent: string | null;
  stopLoss: string | null;
  takeProfit: string | null;
  openedAt: string;
  venue: string;
  agentName: string;
  agentId: string;
  deploymentId: string;
  signalId: string;
  signalCreatedAt: string;
  llmDecision: string | null;
  llmFundAllocation: number | null;
  llmLeverage: number | null;
  llmShouldTrade: boolean | null;
  hasSignatureData: boolean;
  signatureData: {
    messageText: string;
    llmSignature: string;
    llmRawOutput: string;
    llmModelUsed: string;
    llmChainId: number;
    llmFullPrompt: string | null;
    llmMarketContext: string | null;
    llmReasoning: string;
    messageCreatedAt: string;
    confidenceScore: number;
    telegramPostId: string;
    telegramUsername: string;
  } | null;
}

interface VerificationResult {
  success: boolean;
  isValid: boolean;
  recoveredAddress: string;
  expectedAddress: string;
  message: string;
  details: {
    chainId: number;
    model: string;
    messageLength: number;
  };
}

interface UntradedSignal {
  id: string;
  tokenSymbol: string;
  side: string;
  venue: string;
  createdAt: string;
  agentName: string;
  agentId: string;
  deploymentId: string | null;
  llmDecision: string | null;
  llmFundAllocation: number | null;
  llmLeverage: number | null;
  llmShouldTrade: boolean | null;
  hasSignatureData: boolean;
  signatureData: Trade["signatureData"];
}

interface TradesResponse {
  trades: Trade[];
  total: number;
  summary?: {
    total: number;
    open: number;
    closed: number;
  };
  untradedSignals?: UntradedSignal[];
}

export default function MyTrades() {
  // Frontend-only: simulate authentication state
  const authenticated = true;
  const simulatedUserWallet = UNIVERSAL_WALLET_ADDRESS;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [expandedUntradedSignal, setExpandedUntradedSignal] = useState<
    string | null
  >(null);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<
    Trade | UntradedSignal | null
  >(null);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">(
    "ALL"
  );
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<{
    total: number;
    open: number;
    closed: number;
  }>({
    total: 0,
    open: 0,
    closed: 0,
  });
  const [untradedSignals, setUntradedSignals] = useState<UntradedSignal[]>([]);

  // Telegram Notification States
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramMessage, setTelegramMessage] = useState<string | null>(null);

  // Prevent background scroll when verification modal is open
  useEffect(() => {
    if (verificationModalOpen) {
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyOverflow = document.body.style.overflow;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.overflow = originalBodyOverflow;
      };
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }, [verificationModalOpen]);
  const cacheRef = useRef<Record<string, TradesResponse>>({});

  useEffect(() => {
    if (authenticated) {
      fetchTrades(page, statusFilter);
      checkTelegramStatus();
    } else {
      setLoading(false);
    }
  }, [authenticated, page, statusFilter]);

  const checkTelegramStatus = async () => {
    // Frontend-only: use simulation data from JSON
    try {
      const { telegramStatus } = simulationDataJson as any;
      if (telegramStatus?.connected) {
        setTelegramConnected(true);
        setTelegramUsername(telegramStatus.username);
      } else {
        setTelegramConnected(false);
        setTelegramUsername(null);
      }
    } catch (error) {
      console.error("Failed to load Telegram status:", error);
    }
  };

  const handleConnectTelegram = async () => {
    // Frontend-only: simulate Telegram connection
    setTelegramLoading(true);
    // setTelegramMessage("Simulating Telegram connection...");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setTelegramConnected(true);
      setTelegramUsername("lazy_trader");
      // setTelegramMessage("Telegram connection simulated for demo only.");
    } catch (error) {
      console.error("Failed to connect Telegram:", error);
      setTelegramMessage("Failed to simulate Telegram connection. Please retry.");
    } finally {
      setTelegramLoading(false);
    }
  };

  const fetchTrades = async (
    currentPage: number = 1,
    status: "ALL" | "OPEN" | "CLOSED" = "ALL",
    forceRefresh = false
  ) => {
    // Frontend-only: use simulation data from JSON with filtering and pagination
    const cacheKey = `${status}-${currentPage}`;
    const cached = cacheRef.current[cacheKey];

    if (!forceRefresh && cached) {
      setTrades(cached.trades || []);
      setTotal(cached.total || 0);
      if (cached.summary) {
        setSummary({
          total: cached.summary.total,
          open: cached.summary.open,
          closed: cached.summary.closed,
        });
      }
      setUntradedSignals(cached.untradedSignals || []);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { trades: allTrades, untradedSignals: allUntradedSignals } = simulationDataJson as any;

      // Apply status filter
      let filteredTrades = allTrades || [];
      if (status !== "ALL") {
        filteredTrades = filteredTrades.filter((trade: Trade) => trade.status === status);
      }

      // Calculate summary
      const totalTrades = allTrades?.length || 0;
      const openTrades = allTrades?.filter((t: Trade) => t.status === "OPEN").length || 0;
      const closedTrades = allTrades?.filter((t: Trade) => t.status === "CLOSED").length || 0;

      // Pagination
      const total = filteredTrades.length;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

      const data: TradesResponse = {
        trades: paginatedTrades,
        total,
        summary: {
          total: totalTrades,
          open: openTrades,
          closed: closedTrades,
        },
        untradedSignals: allUntradedSignals || [],
      };

      setTrades(data.trades || []);
      setTotal(data.total || 0);
      if (data.summary) {
        setSummary({
          total: data.summary.total,
          open: data.summary.open,
          closed: data.summary.closed,
        });
      }
      setUntradedSignals(data.untradedSignals || []);
      cacheRef.current[cacheKey] = data;
    } catch (error) {
      console.error("Failed to load trades:", error);
      setTrades([]);
      setTotal(0);
      setSummary({ total: 0, open: 0, closed: 0 });
      setUntradedSignals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignature = async (trade: Trade | UntradedSignal) => {
    // Frontend-only: simulate signature verification
    if (!trade.signatureData) return;

    setSelectedTrade(trade);
    setVerificationModalOpen(true);
    setVerificationResult(null);
    setVerifying(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate verification result (always valid for demo)
      const expectedAddress = "0xEIGENLABS00000000000000000000000000000001";
      const recoveredAddress = expectedAddress; // Simulate successful recovery
      const isValid = true;

      const verificationData: VerificationResult = {
        success: true,
        isValid,
        recoveredAddress,
        expectedAddress,
        message: isValid
          ? "Signature verified successfully. Trade is authentic and signed by EigenLabs operator."
          : "Signature verification failed. Addresses do not match.",
        details: {
          chainId: trade.signatureData.llmChainId,
          model: trade.signatureData.llmModelUsed,
          messageLength: trade.signatureData.messageText.length,
        },
      };

      setVerificationResult(verificationData);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        success: false,
        isValid: false,
        recoveredAddress: "",
        expectedAddress: "0xEIGENLABS00000000000000000000000000000001",
        message: error instanceof Error ? error.message : "Unknown error",
        details: {
          chainId: trade.signatureData?.llmChainId || 42161,
          model: trade.signatureData?.llmModelUsed || "eigenai-v1",
          messageLength: trade.signatureData?.messageText.length || 0,
        },
      });
    } finally {
      setVerifying(false);
    }
  };

  const toggleTradeExpansion = (tradeId: string) => {
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId);
  };

  const toggleUntradedExpansion = (signalId: string) => {
    setExpandedUntradedSignal(
      expandedUntradedSignal === signalId ? null : signalId
    );
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openCount = summary.open;
  const closedCount = summary.closed;
  const showingStart =
    total === 0 ? 0 : Math.min((page - 1) * pageSize + 1, total);
  const showingEnd = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)] border border-[var(--border)]">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-12">
          <p className="data-label mb-2 text-xs sm:text-sm">BLOCKCHAIN VERIFICATION</p>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl mb-3 sm:mb-4">MY TRADES</h1>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-2xl">
            All your open trades on Ostium platform with eigenAI signature
            verification. Each trade is cryptographically signed by EigenLabs
            operator ensuring authenticity and transparency.
          </p>
        </div>

        {/* Telegram Notifications */}
        {authenticated && (
          <div className="mb-6 sm:mb-8 border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {telegramConnected ? (
                  <>
                    <div className="w-12 h-12 border border-[var(--accent)] bg-[var(--accent)]/10 flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[var(--accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base sm:text-lg mb-1">
                        TELEGRAM CONNECTED
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] break-words">
                        Notifications enabled for @
                        {telegramUsername || "your account"}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 hidden sm:block">
                        You'll receive real-time updates when positions are
                        opened or closed
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                      <BellOff className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--text-muted)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-base sm:text-lg mb-1">
                        TELEGRAM NOTIFICATIONS
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                        Get instant notifications about your trades on Telegram
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1 hidden sm:block">
                        • New positions opened • Positions closed • Stop loss /
                        Take profit hits
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="w-full sm:w-auto">
                {telegramConnected ? (
                  <button
                    onClick={checkTelegramStatus}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 border border-[var(--accent)] text-[var(--accent)] font-bold hover:bg-[var(--accent)]/10 transition-colors text-sm"
                  >
                    ✓ CONNECTED
                  </button>
                ) : (
                  <button
                    onClick={handleConnectTelegram}
                    disabled={telegramLoading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {telegramLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        CONNECTING...
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        CONNECT TELEGRAM
                      </>
                    )}
                  </button>
                )}
                {telegramMessage && (
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    {telegramMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Overview cards */}
        {authenticated && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
              <p className="data-label mb-1 text-xs">TOTAL TRADES</p>
              <p className="font-display text-2xl sm:text-3xl">{summary.total}</p>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                All signals linked to your deployments
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
              <p className="data-label mb-1 text-xs">OPEN POSITIONS</p>
              <p className="font-display text-2xl sm:text-3xl text-green-400">
                {openCount}
              </p>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                Currently active trades
              </p>
            </div>
            <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-3 sm:p-4">
              <p className="data-label mb-1 text-xs">CLOSED / FILLED</p>
              <p className="font-display text-2xl sm:text-3xl text-[var(--text-muted)]">
                {closedCount}
              </p>
              <p className="text-[var(--text-muted)] text-xs sm:text-sm">
                Completed or inactive trades
              </p>
            </div>
          </div>
        )}

        {!authenticated ? (
          <div className="border border-[var(--border)] bg-[var(--bg-surface)]">
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 border border-[var(--accent)] flex items-center justify-center mb-6">
                <Wallet className="w-8 h-8 text-[var(--accent)]" />
              </div>
              <h3 className="font-display text-xl mb-2">CONNECT WALLET</h3>
              <p className="text-[var(--text-muted)] mb-6 text-center">
                Connect your wallet to view your trades
              </p>
              <button
                onClick={() => {
                  // Frontend-only: simulate wallet connection
                  // Already authenticated in simulation
                }}
                className="px-8 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
              >
                CONNECT WALLET
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <label className="text-xs text-[var(--text-muted)] font-mono">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value as "ALL" | "OPEN" | "CLOSED"
                    );
                    setPage(1);
                  }}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                >
                  <option value="ALL">All</option>
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  Showing {showingStart}-{showingEnd} of {total} trades
                </div>
                <button
                  onClick={() => {
                    cacheRef.current = {};
                    fetchTrades(page, statusFilter, true);
                  }}
                  className="px-3 py-1.5 sm:py-2 border border-[var(--border)] text-xs sm:text-sm hover:border-[var(--accent)] disabled:opacity-50"
                  disabled={loading}
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4 border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="border border-[var(--border)] bg-[var(--bg-surface)] animate-pulse"
                  >
                    <div className="p-6">
                      <div className="grid grid-cols-12 items-center gap-4">
                        <div className="col-span-3">
                          <div className="h-3 w-16 bg-[var(--bg-elevated)] mb-2" />
                          <div className="h-5 w-32 bg-[var(--bg-elevated)]" />
                        </div>
                        <div className="col-span-2">
                          <div className="h-3 w-24 bg-[var(--bg-elevated)] mb-1" />
                          <div className="h-4 w-20 bg-[var(--bg-elevated)]" />
                        </div>
                        <div className="col-span-3">
                          <div className="h-3 w-24 bg-[var(--bg-elevated)] mb-1" />
                          <div className="h-4 w-32 bg-[var(--bg-elevated)]" />
                        </div>
                        <div className="col-span-2">
                          <div className="h-3 w-16 bg-[var(--bg-elevated)] mb-1" />
                          <div className="h-4 w-16 bg-[var(--bg-elevated)]" />
                        </div>
                        <div className="col-span-1">
                          <div className="h-3 w-24 bg-[var(--bg-elevated)]" />
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <div className="h-4 w-4 bg-[var(--bg-elevated)]" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : trades.length === 0 ? (
              <div className="border border-[var(--border)] bg-[var(--bg-surface)]">
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <Activity className="w-12 h-12 text-[var(--text-muted)] mb-6" />
                  <h3 className="font-display text-xl mb-2">NO TRADES YET</h3>
                  <p className="text-[var(--text-muted)] mb-6 text-center">
                    You don't have any trades linked to your deployments yet.
                    Try adjusting filters.
                  </p>
                  <a
                    href="/#agents"
                    className="px-8 py-3 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                  >
                    BROWSE AGENTS
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {trades.map((trade, index) => {
                  const isExpanded = expandedTrade === trade.id;
                  const pnl = parseFloat(trade.unrealizedPnl || "0");
                  const pnlPercent = parseFloat(
                    trade.unrealizedPnlPercent || "0"
                  );
                  const isProfitable = pnl > 0;

                  return (
                    <div
                      key={trade.id}
                      className="border border-[var(--border)] bg-[var(--bg-surface)]"
                    >
                      {/* Trade Header - Always Visible */}
                      <div
                        className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                        onClick={() => toggleTradeExpansion(trade.id)}
                      >
                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4">
                          {/* Trade Number & Token - Mobile: Full width, Desktop: Col 3 */}
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 sm:col-span-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between sm:block">
                                <span className="text-[var(--accent)] font-mono text-xs">
                                  #{String(index + 1).padStart(2, "0")}
                                </span>
                                {/* Expand Icon - Mobile only */}
                                <div className="sm:hidden">
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                  )}
                                </div>
                              </div>
                              <h3 className="font-display text-base sm:text-lg md:text-xl mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="text-lg sm:text-xl md:text-2xl">{trade.tokenSymbol}</span>
                                <span
                                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-bold ${trade.side === "LONG"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                                >
                                  {trade.side}
                                </span>
                                <span
                                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-bold border border-[var(--border)] ${trade.status === "OPEN"
                                    ? "text-green-300 bg-green-500/10"
                                    : "text-[var(--text-muted)] bg-[var(--bg-surface)]"
                                    }`}
                                >
                                  {trade.status}
                                </span>
                              </h3>
                            </div>
                          </div>

                          {/* Entry Price - Mobile: Full width row, Desktop: Col 2 */}
                          <div className="sm:col-span-2">
                            <p className="data-label mb-1 text-[10px] sm:text-xs">ENTRY</p>
                            <p className="font-mono text-sm sm:text-base font-semibold">${trade.entryPrice}</p>
                          </div>

                          {/* Signal Time - Mobile: Full width row, Desktop: Col 3 */}
                          <div className="sm:col-span-3">
                            <p className="data-label mb-1 text-[10px] sm:text-xs">SIGNAL TIME</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-[var(--text-secondary)] break-words">
                              {formatDate(trade.signalCreatedAt)}
                            </p>
                          </div>

                          {/* Venue & Signature Status - Mobile: Side by side, Desktop: Separate cols */}
                          <div className="flex items-center justify-between sm:contents gap-2 sm:col-span-2">
                            <div className="sm:col-span-2">
                              <p className="data-label mb-1 text-[10px] sm:text-xs hidden sm:block">VENUE</p>
                              <span className="text-[10px] sm:text-xs border border-[var(--border)] px-2 py-1 inline-block">
                                {trade.venue}
                              </span>
                            </div>

                            {/* Signature Status */}
                            <div className="flex items-center gap-1.5 sm:gap-2 sm:col-span-1">
                              {trade.hasSignatureData ? (
                                <>
                                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold text-[var(--accent)]">
                                    SIGNED
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono">
                                  No sig
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expand Icon - Desktop only */}
                          <div className="hidden sm:flex sm:col-span-1 sm:justify-end">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--bg-elevated)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {/* Left Column - Trade Details */}
                            <div className="space-y-2 sm:space-y-3">
                              <h4 className="font-display text-xs sm:text-sm mb-1.5 sm:mb-2">
                                TRADE DETAILS
                              </h4>

                              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                                <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">QUANTITY</p>
                                  <p className="font-mono text-[11px] sm:text-xs">{trade.qty}</p>
                                </div>

                                <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">AGENT</p>
                                  <p className="text-[11px] sm:text-xs truncate">{trade.agentName}</p>
                                </div>

                                <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">STATUS</p>
                                  <p
                                    className={`text-[11px] sm:text-xs font-bold ${trade.status === "OPEN"
                                      ? "text-green-400"
                                      : "text-[var(--text-muted)]"
                                      }`}
                                  >
                                    {trade.status}
                                  </p>
                                </div>

                                {/* PNL and Exit Price - Only show if present */}
                                {(trade.pnl !== null ||
                                  trade.exitPrice !== null) && (
                                    <>
                                      {trade.exitPrice && (
                                        <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                            EXIT PRICE
                                          </p>
                                          <p className="font-mono text-[11px] sm:text-xs">
                                            ${trade.exitPrice}
                                          </p>
                                        </div>
                                      )}

                                      {trade.pnl && (
                                        <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                            REALIZED PNL
                                          </p>
                                          <p
                                            className={`font-mono text-[11px] sm:text-xs font-bold ${parseFloat(trade.pnl) >= 0
                                              ? "text-green-400"
                                              : "text-red-400"
                                              }`}
                                          >
                                            {parseFloat(trade.pnl) >= 0
                                              ? "+"
                                              : ""}
                                            ${trade.pnl}
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">STOP LOSS</p>
                                  <p className="font-mono text-[11px] sm:text-xs">
                                    {trade.stopLoss || "N/A"}
                                  </p>
                                </div>

                                <div className="border border-[var(--border)] p-1.5 sm:p-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">TAKE PROFIT</p>
                                  <p className="font-mono text-[11px] sm:text-xs">
                                    {trade.takeProfit || "N/A"}
                                  </p>
                                </div>

                                <div className="border border-[var(--border)] p-1.5 sm:p-2 col-span-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">OPENED AT</p>
                                  <p className="text-[10px] sm:text-[11px] break-words">
                                    {formatDate(trade.openedAt)}
                                  </p>
                                </div>

                                <div className="border border-[var(--border)] p-1.5 sm:p-2 col-span-2">
                                  <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                    SIGNAL CREATED AT
                                  </p>
                                  <p className="text-[10px] sm:text-[11px] break-words">
                                    {formatDate(trade.signalCreatedAt)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column - Agent Decision + Signature Data */}
                            <div className="space-y-2 sm:space-y-3">
                              {/* LLM Decision (if available) - Combined with Signature */}
                              {(trade.llmDecision !== null ||
                                trade.llmFundAllocation !== null ||
                                trade.llmLeverage !== null ||
                                trade.llmShouldTrade !== null) && (
                                  <div className="space-y-1.5 sm:space-y-2">
                                    <h4 className="font-display text-xs sm:text-sm mb-1 sm:mb-1.5">
                                      AGENT DECISION
                                    </h4>
                                    <div className="border border-[var(--border)] p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-[var(--bg-surface)]">
                                      {trade.llmDecision && (
                                        <div>
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                            DECISION SUMMARY
                                          </p>
                                          <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] break-words line-clamp-2">
                                            {trade.llmDecision}
                                          </p>
                                        </div>
                                      )}

                                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                        {trade.llmFundAllocation !== null && (
                                          <div className="border border-[var(--border)] p-1.5">
                                            <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                              FUND
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] font-mono text-[var(--accent)]">
                                              {trade.llmFundAllocation.toFixed(0)}%
                                            </p>
                                          </div>
                                        )}

                                        {trade.llmLeverage !== null && (
                                          <div className="border border-[var(--border)] p-1.5">
                                            <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                              LEV
                                            </p>
                                            <p className="text-[10px] sm:text-[11px] font-mono">
                                              {trade.llmLeverage.toFixed(1)}x
                                            </p>
                                          </div>
                                        )}

                                        {trade.llmShouldTrade !== null && (
                                          <div className="border border-[var(--border)] p-1.5">
                                            <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">
                                              TRADE
                                            </p>
                                            <p
                                              className={`text-[10px] sm:text-[11px] font-bold ${trade.llmShouldTrade
                                                ? "text-green-400"
                                                : "text-red-400"
                                                }`}
                                            >
                                              {trade.llmShouldTrade ? "YES" : "NO"}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Signature Data */}
                              <div>
                              <h4 className="font-display text-xs sm:text-sm font-bold mb-1.5 sm:mb-2 uppercase tracking-tight">
                                EIGENAI SIGNATURE
                              </h4>

                              {trade.signatureData ? (
                                <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2 sm:p-3 space-y-2 sm:space-y-2.5">
                                  {/* Signal Message */}
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5 sm:mb-1">
                                      ORIGINAL SIGNAL
                                    </p>
                                    <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] italic break-words line-clamp-2">
                                      "
                                      {trade.signatureData.messageText.substring(
                                        0,
                                        100
                                      )}
                                      {trade.signatureData.messageText.length >
                                        100
                                        ? "..."
                                        : ""}
                                      "
                                    </p>
                                  </div>

                                  {/* Compact Info Grid */}
                                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 border-t border-[var(--border)] pt-2">
                                    <div>
                                      <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Alpha Trader</p>
                                      <p className="text-[10px] sm:text-[11px] font-mono truncate">
                                        @{trade.signatureData.telegramUsername}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Model</p>
                                      <p className="text-[10px] sm:text-[11px] font-mono truncate">
                                        {trade.signatureData.llmModelUsed}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Chain ID</p>
                                      <p className="text-[10px] sm:text-[11px] font-mono">
                                        {trade.signatureData.llmChainId}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Confidence</p>
                                      <p className="text-[11px] sm:text-xs font-bold text-[var(--accent)]">
                                        {(
                                          trade.signatureData.confidenceScore *
                                          100
                                        ).toFixed(0)}%
                                      </p>
                                    </div>
                                  </div>

                                  {/* Signature (truncated) */}
                                  <div className="py-1.5 sm:py-2 border-t border-[var(--border)]">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5 sm:mb-1">
                                      Signature
                                    </p>
                                    <p className="text-[9px] sm:text-[10px] font-mono break-all text-[var(--accent)] leading-tight line-clamp-2">
                                      {trade.signatureData.llmSignature}
                                    </p>
                                  </div>

                                  {/* Verify Button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerifySignature(trade);
                                    }}
                                    className="w-full py-1.5 sm:py-2 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-1.5 mt-1.5 text-[10px] sm:text-xs"
                                  >
                                    <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                    VERIFY SIGNATURE
                                  </button>
                                </div>
                              ) : (
                                <div className="border border-dashed border-[var(--border)] bg-[var(--bg-surface)] p-2 sm:p-3 space-y-1.5">
                                  <p className="font-bold text-[11px] sm:text-xs text-[var(--text-secondary)]">
                                    No signature available for this signal yet.
                                  </p>
                                  <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)]">
                                    You can still track the position details and
                                    status above.
                                  </p>
                                </div>
                              )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pagination */}
                <div className="flex items-center justify-between pt-3 sm:pt-4 gap-2">
                  <button
                    disabled={page === 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-[var(--border)] text-[11px] sm:text-xs md:text-sm ${page === 1
                      ? "text-[var(--text-muted)] cursor-not-allowed opacity-50"
                      : "hover:border-[var(--accent)]"
                      } transition-colors`}
                  >
                    Previous
                  </button>
                  <div className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono px-2">
                    Page {page} / {Math.max(1, Math.ceil(total / pageSize))}
                  </div>
                  <button
                    disabled={page * pageSize >= total}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPage((p) => p + 1);
                    }}
                    className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-[var(--border)] text-[11px] sm:text-xs md:text-sm ${page * pageSize >= total
                      ? "text-[var(--text-muted)] cursor-not-allowed opacity-50"
                      : "hover:border-[var(--accent)]"
                      } transition-colors`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Untraded signals (signals without positions) */}
            {untradedSignals.length > 0 && (
              <div className="mt-8 sm:mt-12 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <p className="data-label mb-1 text-xs">UNTRADED SIGNALS</p>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                      Signals from your agents that did not result in positions.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-muted)]">
                    {untradedSignals.length} signals
                  </span>
                </div>

                {untradedSignals.map((signal, index) => {
                  const isExpanded = expandedUntradedSignal === signal.id;

                  return (
                    <div
                      key={signal.id}
                      className="border border-[var(--border)] bg-[var(--bg-surface)]"
                    >
                      {/* Header */}
                      <div
                        className="p-3 sm:p-4 md:p-6 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                        onClick={() => toggleUntradedExpansion(signal.id)}
                      >
                        <div className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4">
                          {/* Index + token - Mobile: Full width, Desktop: Col 3 */}
                          <div className="flex items-start sm:items-center gap-2 sm:gap-3 sm:col-span-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between sm:block">
                                <span className="text-[var(--accent)] font-mono text-xs">
                                  S#{String(index + 1).padStart(2, "0")}
                                </span>
                                {/* Expand Icon - Mobile only */}
                                <div className="sm:hidden">
                                  {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                                  ) : (
                                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                                  )}
                                </div>
                              </div>
                              <h3 className="font-display text-base sm:text-lg md:text-xl mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="text-lg sm:text-xl md:text-2xl">{signal.tokenSymbol}</span>
                                <span
                                  className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-bold ${signal.side === "LONG"
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-red-500/20 text-red-400"
                                    }`}
                                >
                                  {signal.side}
                                </span>
                                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 font-bold border border-[var(--border)] text-yellow-300 bg-yellow-500/10">
                                  NOT TRADED
                                </span>
                              </h3>
                            </div>
                          </div>

                          {/* Agent - Mobile: Full width row, Desktop: Col 3 */}
                          <div className="sm:col-span-3">
                            <p className="data-label mb-1 text-[10px] sm:text-xs">AGENT</p>
                            <p className="text-xs sm:text-sm truncate">{signal.agentName}</p>
                          </div>

                          {/* Signal time - Mobile: Full width row, Desktop: Col 3 */}
                          <div className="sm:col-span-3">
                            <p className="data-label mb-1 text-[10px] sm:text-xs">SIGNAL TIME</p>
                            <p className="text-[11px] sm:text-xs md:text-sm text-[var(--text-secondary)] break-words">
                              {formatDate(signal.createdAt)}
                            </p>
                          </div>

                          {/* Venue & Signature status - Mobile: Side by side, Desktop: Separate cols */}
                          <div className="flex items-center justify-between sm:contents gap-2 sm:col-span-2">
                            <div className="sm:col-span-2">
                              <p className="data-label mb-1 text-[10px] sm:text-xs hidden sm:block">VENUE</p>
                              <span className="text-[10px] sm:text-xs border border-[var(--border)] px-2 py-1 inline-block">
                                {signal.venue}
                              </span>
                            </div>

                            {/* Signature status + toggle */}
                            <div className="flex items-center gap-1.5 sm:gap-2 sm:col-span-1">
                              {signal.hasSignatureData ? (
                                <>
                                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--accent)] flex-shrink-0" />
                                  <span className="text-[10px] sm:text-xs font-bold text-[var(--accent)]">
                                    SIGNED
                                  </span>
                                </>
                              ) : (
                                <span className="text-[10px] sm:text-xs text-[var(--text-muted)] font-mono">
                                  No sig
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Expand Icon - Desktop only */}
                          <div className="hidden sm:flex sm:col-span-1 sm:justify-end">
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border)] p-3 sm:p-4 bg-[var(--bg-elevated)]">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {/* Left Column - Agent Decision */}
                            {(signal.llmDecision ||
                              signal.llmFundAllocation !== null ||
                              signal.llmLeverage !== null ||
                              signal.llmShouldTrade !== null) && (
                                <div className="space-y-1.5 sm:space-y-2">
                                  <p className="data-label mb-1 sm:mb-1.5 text-xs sm:text-sm">AGENT DECISION</p>
                                  <div className="border border-[var(--border)] p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-[var(--bg-surface)]">
                                    {signal.llmDecision && (
                                      <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] break-words line-clamp-2">
                                        {signal.llmDecision}
                                      </p>
                                    )}
                                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                      {signal.llmFundAllocation !== null && (
                                        <div className="border border-[var(--border)] p-1.5">
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">FUND</p>
                                          <p className="text-[10px] sm:text-[11px] font-mono text-[var(--accent)]">
                                            {signal.llmFundAllocation.toFixed(0)}%
                                          </p>
                                        </div>
                                      )}
                                      {signal.llmLeverage !== null && (
                                        <div className="border border-[var(--border)] p-1.5">
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">LEV</p>
                                          <p className="text-[10px] sm:text-[11px] font-mono">
                                            {signal.llmLeverage.toFixed(1)}x
                                          </p>
                                        </div>
                                      )}
                                      {signal.llmShouldTrade !== null && (
                                        <div className="border border-[var(--border)] p-1.5">
                                          <p className="data-label mb-0.5 text-[9px] sm:text-[10px]">TRADE</p>
                                          <p
                                            className={`text-[10px] sm:text-[11px] font-bold ${signal.llmShouldTrade
                                              ? "text-green-400"
                                              : "text-red-400"
                                              }`}
                                          >
                                            {signal.llmShouldTrade ? "YES" : "NO"}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                          {/* Right Column - EigenAI Signature for untraded signals */}
                          <div className="space-y-1.5 sm:space-y-2">
                            <p className="data-label mb-1 sm:mb-1.5 text-xs sm:text-sm">EIGENAI SIGNATURE</p>
                            {signal.signatureData ? (
                              <div className="border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-2 sm:p-3 space-y-2 sm:space-y-2.5">
                                <div>
                                  <p className="text-[9px] sm:text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5 sm:mb-1">
                                    ORIGINAL SIGNAL
                                  </p>
                                  <p className="text-[10px] sm:text-[11px] text-[var(--text-secondary)] italic break-words line-clamp-2">
                                    "
                                    {signal.signatureData.messageText}
                                    "
                                  </p>
                                </div>

                                {/* Compact Info Grid */}
                                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 border-t border-[var(--border)] pt-2">
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Alpha Trader</p>
                                    <p className="text-[10px] sm:text-[11px] font-mono truncate">
                                      @{signal.signatureData.telegramUsername}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Model</p>
                                    <p className="text-[10px] sm:text-[11px] font-mono truncate">
                                      {signal.signatureData.llmModelUsed}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Chain ID</p>
                                    <p className="text-[10px] sm:text-[11px] font-mono">
                                      {signal.signatureData.llmChainId}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5">Confidence</p>
                                    <p className="text-[11px] sm:text-xs font-bold text-[var(--accent)]">
                                      {(
                                        signal.signatureData.confidenceScore * 100
                                      ).toFixed(0)}%
                                    </p>
                                  </div>
                                </div>

                                <div className="py-1.5 sm:py-2 border-t border-[var(--border)]">
                                  <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] mb-0.5 sm:mb-1">
                                    Signature
                                  </p>
                                  <p className="text-[9px] sm:text-[10px] font-mono break-all text-[var(--accent)] leading-tight line-clamp-2">
                                    {formatAddress(
                                      signal.signatureData.llmSignature
                                    )}
                                  </p>
                                </div>

                                <button
                                  onClick={() => {
                                    setSelectedTrade(signal);
                                    setVerificationModalOpen(true);
                                    setVerificationResult(null);
                                    handleVerifySignature(signal);
                                  }}
                                  className="w-full py-1.5 sm:py-2 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-1.5 mt-1.5 text-[10px] sm:text-xs"
                                >
                                  <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                  VERIFY SIGNATURE
                                </button>
                              </div>
                            ) : (
                              <p className="text-[10px] sm:text-[11px] text-[var(--text-muted)]">
                                No EigenAI signature available for this signal.
                              </p>
                            )}
                          </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Verification Modal */}
      {verificationModalOpen && selectedTrade && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-hidden overscroll-contain"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setVerificationModalOpen(false);
            }
          }}
        >
          <div className="bg-[var(--bg-deep)] border border-[var(--border)] max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-[var(--border)] p-3 sm:p-4 md:p-6 sticky top-0 bg-[var(--bg-deep)] z-10">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)] flex-shrink-0" />
                  <div className="min-w-0">
                    <h2 className="font-display text-base sm:text-xl truncate">
                      SIGNATURE VERIFICATION
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {selectedTrade.tokenSymbol} {selectedTrade.side} Trade
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setVerificationModalOpen(false)}
                  className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              {verifying ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-16">
                  <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-[var(--accent)] mb-4" />
                  <p className="text-[var(--text-muted)] text-sm sm:text-base">
                    Verifying signature with EigenAI...
                  </p>
                </div>
              ) : verificationResult ? (
                <>
                  {/* Verification Result */}
                  <div
                    className={`border p-3 sm:p-4 md:p-6 ${verificationResult.isValid
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-red-500/50 bg-red-500/10"
                      }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      {verificationResult.isValid ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-sm sm:text-base md:text-lg">
                          {verificationResult.isValid
                            ? "✅ SIGNATURE VERIFIED"
                            : "❌ VERIFICATION FAILED"}
                        </h3>
                        <p className="text-[11px] sm:text-xs md:text-sm text-[var(--text-secondary)] break-words">
                          {verificationResult.message}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Backend Traces */}
                  <div className="border border-[var(--border)] bg-[var(--bg-surface)]">
                    <div className="border-b border-[var(--border)] p-2 sm:p-3 md:p-4">
                      <h4 className="font-display text-[10px] sm:text-xs md:text-sm">BACKEND TRACES</h4>
                    </div>
                    <div className="p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Step 1: Input Data */}
                      <div className="border border-[var(--border)] p-2 sm:p-3 md:p-4">
                        <p className="data-label mb-1 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">STEP 1: INPUT DATA</p>
                        <div className="space-y-1 sm:space-y-2 text-[11px] sm:text-xs font-mono">
                          <div>
                            <span className="text-[var(--text-muted)]">
                              Chain ID:
                            </span>{" "}
                            {verificationResult.details.chainId}
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">
                              Model:
                            </span>{" "}
                            {verificationResult.details.model}
                          </div>
                          <div>
                            <span className="text-[var(--text-muted)]">
                              Message Length:
                            </span>{" "}
                            {verificationResult.details.messageLength}{" "}
                            characters
                          </div>
                        </div>
                      </div>

                      {/* Step 2: Prompt Reconstruction */}
                      <div className="border border-[var(--border)] p-2 sm:p-3 md:p-4">
                        <p className="data-label mb-1 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">
                          STEP 2: PROMPT RECONSTRUCTION
                        </p>
                        <div className="bg-[var(--bg-elevated)] p-2 sm:p-3 text-[11px] sm:text-xs break-all">
                          <p className="text-[var(--text-muted)] mb-1 sm:mb-2">
                            Original Message:
                          </p>
                          <p className="text-[var(--text-secondary)] italic break-words">
                            "{selectedTrade.signatureData?.messageText}"
                          </p>
                        </div>
                      </div>

                      {/* Step 3: Message Construction */}
                      <div className="border border-[var(--border)] p-2 sm:p-3 md:p-4">
                        <p className="data-label mb-1 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">
                          STEP 3: MESSAGE CONSTRUCTION
                        </p>
                        <div className="text-[11px] sm:text-xs font-mono">
                          <p className="text-[var(--text-muted)]">
                            Format: chainId + modelId + prompt + output
                          </p>
                          <p className="text-[var(--accent)] mt-1 sm:mt-2">
                            ✅ Message constructed:{" "}
                            {verificationResult.details.messageLength}{" "}
                            characters
                          </p>
                        </div>
                      </div>

                      {/* Step 4: Signature Verification */}
                      <div className="border border-[var(--border)] p-2 sm:p-3 md:p-4">
                        <p className="data-label mb-1 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">
                          STEP 4: SIGNATURE VERIFICATION
                        </p>
                        <div className="space-y-2 sm:space-y-3 text-[11px] sm:text-xs">
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">
                              Expected Signer (EigenLabs):
                            </p>
                            <p className="font-mono bg-[var(--bg-elevated)] p-1.5 sm:p-2 break-all text-[9px] sm:text-[10px] md:text-xs">
                              {verificationResult.expectedAddress}
                            </p>
                          </div>
                          <div>
                            <p className="text-[var(--text-muted)] mb-1">
                              Recovered Signer:
                            </p>
                            <p
                              className={`font-mono bg-[var(--bg-elevated)] p-1.5 sm:p-2 break-all text-[9px] sm:text-[10px] md:text-xs ${verificationResult.isValid
                                ? "text-green-400"
                                : "text-red-400"
                                }`}
                            >
                              {verificationResult.recoveredAddress}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1.5 sm:gap-2 ${verificationResult.isValid
                              ? "text-green-400"
                              : "text-red-400"
                              }`}
                          >
                            {verificationResult.isValid ? (
                              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            )}
                            <span className="font-bold text-[10px] sm:text-xs">
                              {verificationResult.isValid
                                ? "ADDRESSES MATCH ✓"
                                : "ADDRESSES DO NOT MATCH ✗"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step 5: LLM Raw Output */}
                      <div className="border border-[var(--border)] p-2 sm:p-3 md:p-4">
                        <p className="data-label mb-1 sm:mb-2 md:mb-3 text-[10px] sm:text-xs">
                          STEP 5: LLM RAW OUTPUT
                        </p>
                        <div className="bg-[var(--bg-elevated)] p-2 sm:p-3 text-[10px] sm:text-[11px] md:text-xs font-mono max-h-24 sm:max-h-32 md:max-h-48 overflow-y-auto break-all">
                          {selectedTrade.signatureData?.llmRawOutput}
                        </div>
                      </div>

                      {/* Reasoning */}
                      {/* {selectedTrade.signatureData?.llmReasoning && (
                        <div className="border border-[var(--border)] p-4">
                          <p className="data-label mb-3">LLM REASONING</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {selectedTrade.signatureData.llmReasoning}
                          </p>
                        </div>
                      )} */}
                    </div>
                  </div>

                  {/* Documentation Link */}
                  <a
                    href="https://docs.eigencloud.xyz/eigenai/howto/verify-signature"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2 sm:py-3 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-[11px] sm:text-xs md:text-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-center">VIEW EIGENAI DOCUMENTATION</span>
                  </a>
                </>
              ) : (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No verification result
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
