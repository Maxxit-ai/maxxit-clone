/**
 * Lazy Trading - Simplified agent setup for casual traders
 *
 * A streamlined 4-step flow:
 * 1. Connect Wallet
 * 2. Ostium Setup (Delegation + Allowance)
 * 3. Trading Preferences
 * 4. Connect Telegram (as signal source)
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Header } from "@components/Header";
import {
  TradingPreferencesForm,
  TradingPreferences,
} from "@components/TradingPreferencesModal";
import {
  Wallet,
  Send,
  Sliders,
  Shield,
  Check,
  ChevronRight,
  ExternalLink,
  Activity,
  AlertCircle,
  Copy,
  CheckCircle,
  Zap,
} from "lucide-react";
import simulationDataJson from "../json/simulation-data.json";
import {
  UNIVERSAL_WALLET_ADDRESS,
  UNIVERSAL_OSTIUM_AGENT_ADDRESS,
  UNIVERSAL_DELEGATION_ADDRESS,
} from "../json/addresses";

// Frontend-only: Simulated blockchain addresses (not used for actual transactions)
const OSTIUM_TRADING_CONTRACT = "0xSIMULATEDTRADING0000000000000000000001";
const USDC_TOKEN = "0xSIMULATEDUSDC0000000000000000000000000001";
const OSTIUM_STORAGE = "0xSIMULATEDSTORAGE0000000000000000000000001";

type Step = "wallet" | "telegram" | "preferences" | "ostium" | "complete";

interface TelegramUser {
  id: string;
  telegram_user_id: string;
  telegram_username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export default function LazyTrading() {
  const router = useRouter();
  // Frontend-only: simulate authentication state
  const authenticated = true;
  const simulatedUserWallet = UNIVERSAL_WALLET_ADDRESS;

  // Redirect to external URL when page is accessed directly
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     window.location.href = 'https://ostium.maxxit.ai/lazy-trading';
  //   }
  // }, []);

  const [step, setStep] = useState<Step>("wallet");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Separate loading states for delegation and USDC approval
  const [delegationLoading, setDelegationLoading] = useState(false);
  const [allowanceLoading, setAllowanceLoading] = useState(false);
  const [checkingOstiumStatus, setCheckingOstiumStatus] = useState(false);
  const [enablingTrading, setEnablingTrading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

  // Telegram state
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [linkCode, setLinkCode] = useState<string>("");
  const [botUsername, setBotUsername] = useState<string>("");
  const [deepLink, setDeepLink] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [checkingTelegram, setCheckingTelegram] = useState(false);

  // Trading preferences
  const [tradingPreferences, setTradingPreferences] =
    useState<TradingPreferences | null>(null);

  // Ostium state
  const [ostiumAgentAddress, setOstiumAgentAddress] = useState<string>("");
  const [hyperliquidAgentAddress, setHyperliquidAgentAddress] = useState<string>("");
  const [delegationComplete, setDelegationComplete] = useState(false);
  const [allowanceComplete, setAllowanceComplete] = useState(false);
  const [delegationTxHash, setDelegationTxHash] = useState<string | null>(null);
  const [allowanceTxHash, setAllowanceTxHash] = useState<string | null>(null);

  // ETH sending state (for funding agent address)
  const [ethAmount, setEthAmount] = useState<string>("0.005");
  const [sendingEth, setSendingEth] = useState(false);
  const [ethTxHash, setEthTxHash] = useState<string | null>(null);
  const [ethError, setEthError] = useState<string | null>(null);

  // Agent state
  const [agentId, setAgentId] = useState<string>("");
  const [deploymentId, setDeploymentId] = useState<string>("");
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load existing setup status when wallet is connected
  useEffect(() => {
    if (authenticated && !initialLoadDone) {
      loadExistingSetup();
    }
  }, [authenticated, initialLoadDone]);

  const loadExistingSetup = async () => {
    if (!authenticated) return;

    try {
      // Frontend-only: use simulation data from JSON
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API delay

      const { lazyTradingSetup, ostiumStatus } = simulationDataJson as any;
      const data = lazyTradingSetup || {};

      if (data.hasSetup) {
        // Restore state from existing setup
        if (data.agent) {
          setAgentId(data.agent.id);
        }
        if (data.telegramUser) {
          setTelegramUser(data.telegramUser);
        }
        if (data.deployment) {
          setDeploymentId(data.deployment.id);
        }
        if (data.tradingPreferences) {
          setTradingPreferences(data.tradingPreferences);
        }
        if (data.ostiumAgentAddress) {
          setOstiumAgentAddress(data.ostiumAgentAddress);
        } else {
          // Use universal address if not set
          setOstiumAgentAddress(UNIVERSAL_OSTIUM_AGENT_ADDRESS);
        }
        if (data.hyperliquidAgentAddress) {
          setHyperliquidAgentAddress(data.hyperliquidAgentAddress);
        }

        // For simulation: always take the user through the Ostium step
        // regardless of any pre-existing delegation/approval flags
        setDelegationComplete(false);
        setAllowanceComplete(false);
      } else {
        // No existing setup, start fresh
        // Use universal address as default for simulation
        setOstiumAgentAddress(UNIVERSAL_OSTIUM_AGENT_ADDRESS);
        // Always start with delegation/allowance as incomplete so user sees the Ostium step
        setDelegationComplete(false);
        setAllowanceComplete(false);
        if (data.hyperliquidAgentAddress) {
          setHyperliquidAgentAddress(data.hyperliquidAgentAddress);
        }
      }
    } catch (err) {
      console.error("Error loading existing setup:", err);
    } finally {
      setInitialLoadDone(true);
    }
  };

  // Poll for telegram connection
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (step === "telegram" && linkCode && !telegramUser) {
      interval = setInterval(() => {
        checkTelegramStatus();
      }, 3000); // Check every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, linkCode, telegramUser]);

  // Check Ostium status when on ostium step and agent address is available
  useEffect(() => {
    if (step === "ostium" && authenticated && ostiumAgentAddress) {
      console.log(
        "[Ostium] Agent address available, checking delegation status..."
      );
      checkOstiumStatus();
    }
  }, [step, authenticated, ostiumAgentAddress]);

  const checkTelegramStatus = async () => {
    if (!authenticated) {
      console.log("[Telegram] Cannot check status: not authenticated");
      return;
    }

    setCheckingTelegram(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      console.log(
        "[Telegram] Checking connection status for wallet:",
        simulatedUserWallet
      );

      // Frontend-only: use simulation data from JSON
      const { telegramUser: telegramUserData, telegramStatus } = simulationDataJson as any;

      // Simulate connection: if linkCode exists, assume connection after delay
      // In real app, this would check backend for connection status
      if (linkCode && telegramUserData) {
        console.log(
          "[Telegram] ✅ Telegram connected:",
          telegramUserData.telegram_username || telegramUserData.first_name
        );
        setTelegramUser(telegramUserData);
        setLinkCode("");
        setStep("telegram");
      } else if (telegramStatus?.connected && telegramUserData) {
        // Already connected
        setTelegramUser(telegramUserData);
        setLinkCode("");
        setStep("telegram");
      } else {
        // Still waiting for connection
        console.log("[Telegram] ⏳ Still waiting for connection...");
        setStep("telegram");
      }
    } catch (err) {
      console.error("[Telegram] ❌ Error checking telegram status:", err);
      setStep("telegram");
    } finally {
      setCheckingTelegram(false);
    }
  };

  const generateTelegramLink = async () => {
    if (!authenticated) return;

    setLoading(true);
    setError("");

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Frontend-only: simulate Telegram link generation
      const { telegramUser: telegramUserData } = simulationDataJson as any;

      // Simulate already linked check
      if (telegramUserData) {
        setTelegramUser(telegramUserData);
      } else {
        // Generate simulated link code
        const simulatedLinkCode = `LINK${Date.now().toString(36).toUpperCase().slice(-8)}`;
        const simulatedBotUsername = "maxxit_trading_bot";
        const simulatedDeepLink = `https://t.me/${simulatedBotUsername}?start=${simulatedLinkCode}`;

        setLinkCode(simulatedLinkCode);
        setBotUsername(simulatedBotUsername);
        setDeepLink(simulatedDeepLink);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(linkCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePreferencesSave = (prefs: TradingPreferences) => {
    setTradingPreferences(prefs);
    // Move to telegram step after preferences are saved
    setStep("telegram");
  };

  const createAgentAndProceed = async () => {
    if (!authenticated || !telegramUser || !tradingPreferences) return;

    // Check if agent already exists - prevent duplicate creation
    if (agentId) {
      console.log("[LazyTrading] Agent already exists, skipping creation");
      setStep("complete");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Frontend-only: simulate agent creation
      const simulatedAgentId = `lazy-agent-${Date.now()}`;
      const simulatedDeploymentId = `deployment-${Date.now()}`;

      setAgentId(simulatedAgentId);
      setDeploymentId(simulatedDeploymentId);

      // Use universal Ostium agent address
      setOstiumAgentAddress(UNIVERSAL_OSTIUM_AGENT_ADDRESS);

      // Move to complete step
      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  const generateOstiumAddress = async () => {
    if (!authenticated) return;

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Frontend-only: use universal Ostium agent address
      setOstiumAgentAddress(UNIVERSAL_OSTIUM_AGENT_ADDRESS);
    } catch (err) {
      console.error("Error generating Ostium address:", err);
    }
  };

  const checkOstiumStatus = async () => {
    if (!authenticated) {
      console.log("[Ostium] Cannot check status: not authenticated");
      return;
    }

    if (!ostiumAgentAddress) {
      console.log("[Ostium] Cannot check status: no agent address yet");
      return;
    }

    setCheckingOstiumStatus(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      console.log(
        "[Ostium] Checking delegation status for:",
        simulatedUserWallet,
        "->",
        ostiumAgentAddress
      );

      // Simulation: do not auto-complete delegation/allowance here.
      // We keep the current state so the user must click the buttons.
      console.log("[Ostium] Simulation status check - leaving delegation/allowance unchanged");
    } catch (err) {
      console.error("[Ostium] Error checking Ostium status:", err);
    } finally {
      setCheckingOstiumStatus(false);
    }
  };

  const approveDelegation = async (skipLoading = false) => {
    if (!authenticated) {
      setError("Please connect your wallet first");
      return;
    }

    if (!ostiumAgentAddress) {
      setError("Agent address not found. Please refresh the page.");
      return;
    }

    if (!skipLoading) {
      setDelegationLoading(true);
    }
    setError("");

    try {
      // Frontend-only: simulate blockchain transaction
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate transaction hash
      const simulatedTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setDelegationTxHash(simulatedTxHash);
      console.log("[Delegation] Transaction submitted:", simulatedTxHash);

      // Simulate transaction confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("[Delegation] Setting delegate to:", ostiumAgentAddress);

      setDelegationComplete(true);
      setDelegationTxHash(null);
    } catch (err: any) {
      console.error("Delegation error:", err);
      if (err.code === 4001) {
        setError("Transaction rejected");
        throw err; // Re-throw to stop the flow
      } else if (err.code === -32603) {
        setError("Transaction failed. Please check your wallet balance.");
        throw err;
      } else {
        setError(err.message || "Failed to approve delegation");
        throw err;
      }
    } finally {
      if (!skipLoading) {
        setDelegationLoading(false);
      }
    }
  };

  const approveUsdc = async (skipLoading = false) => {
    if (!authenticated) return;

    if (!skipLoading) {
      setAllowanceLoading(true);
    }
    setError("");

    try {
      // Frontend-only: simulate blockchain transaction
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate transaction hash
      const simulatedTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setAllowanceTxHash(simulatedTxHash);
      console.log("[USDC Approval] Transaction submitted:", simulatedTxHash);

      // Simulate transaction confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setAllowanceComplete(true);
      setAllowanceTxHash(null);
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes("rejected")) {
        setError("Transaction rejected");
        throw err; // Re-throw to stop the flow
      } else {
        setError(err.message || "Failed to approve USDC");
        throw err;
      }
    } finally {
      if (!skipLoading) {
        setAllowanceLoading(false);
      }
    }
  };

  // Combined function to enable 1-click trading
  const enableOneClickTrading = async () => {
    if (!authenticated) {
      setError("Please connect your wallet first");
      return;
    }

    if (!ostiumAgentAddress) {
      setError("Agent address not found. Please refresh the page.");
      return;
    }

    setEnablingTrading(true);
    setError("");
    setCurrentAction("");

    try {
      // Perform both steps sequentially without showing intermediate loaders
      // Step 1: Delegation
      if (!delegationComplete) {
        setCurrentAction("Setting delegation...");
        await approveDelegation(true); // Skip individual loading state
        // Small delay for state update
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Step 2: USDC Allowance
      if (!allowanceComplete) {
        setCurrentAction("Approving USDC allowance...");
        await approveUsdc(true); // Skip individual loading state
        // Small delay for state update
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Both steps complete
      setCurrentAction("");
    } catch (err: any) {
      // Error is already set in approveDelegation or approveUsdc
      console.error("Error enabling 1-click trading:", err);
      setCurrentAction("");
    } finally {
      setEnablingTrading(false);
    }
  };

  // Handle sending ETH to agent address for gas fees
  const handleSendETH = async () => {
    if (!ostiumAgentAddress || !ethAmount || parseFloat(ethAmount) <= 0) {
      setEthError("Please enter a valid ETH amount");
      return;
    }

    setSendingEth(true);
    setEthError(null);
    setEthTxHash(null);

    try {
      // Frontend-only: simulate blockchain transaction
      // Simulate transaction delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate transaction hash
      const simulatedTxHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`;

      setEthTxHash(simulatedTxHash);

      // Simulate transaction confirmation delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("[LazyTrading] ETH sent successfully:", simulatedTxHash);
    } catch (err: any) {
      if (err.code === 4001 || err.message?.includes("rejected")) {
        setEthError("Transaction rejected");
      } else {
        setEthError(err.message || "Failed to send ETH");
      }
    } finally {
      setSendingEth(false);
    }
  };

  // Removed automatic step progression - user must manually click to proceed

  const steps = [
    { id: "wallet", label: "WALLET", icon: Wallet },
    { id: "ostium", label: "OSTIUM", icon: Shield },
    { id: "preferences", label: "PREFERENCES", icon: Sliders },
    { id: "telegram", label: "TELEGRAM", icon: Send },
    { id: "complete", label: "COMPLETE", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--accent)] bg-[var(--accent)]/10 mb-4">
            <Zap className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm font-bold text-[var(--accent)]">
              LAZY TRADING
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl mb-4">
            QUICK SETUP
          </h1>
          <p className="text-[var(--text-secondary)]">
            Connect, configure, and start trading in minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="relative px-4">
            {/* Background line - spans full width between first and last step */}
            <div
              className="absolute top-6 h-0.5 bg-[var(--border)]"
              style={{
                left: '48px', // Half of step indicator width (24px)
                right: '48px',
              }}
            />
            {/* Progress line - animates smoothly */}
            <div
              className="absolute top-6 h-0.5 bg-[var(--accent)] transition-all duration-700 ease-out"
              style={{
                left: '48px',
                width: currentStepIndex === 0
                  ? '0px'
                  : `calc((100% - 96px) * ${currentStepIndex / (steps.length - 1)})`,
              }}
            />
            <div className="relative flex justify-between items-start">
              {steps.map((s, index) => {
                const Icon = s.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = s.id === step;
                const isUpcoming = index > currentStepIndex;

                return (
                  <div key={s.id} className="flex flex-col items-center flex-1 relative z-10">
                    {/* Step indicator */}
                    <div
                      className={`relative w-12 h-12 flex items-center justify-center transition-all duration-300 rounded-full border-2 ${isCompleted
                        ? "bg-[var(--accent)] border-[var(--accent)] text-[var(--bg-deep)] shadow-lg shadow-[var(--accent)]/30 scale-110"
                        : isCurrent
                          ? "border-[var(--accent)] bg-[var(--bg-surface)] text-[var(--accent)] shadow-md shadow-[var(--accent)]/20 scale-105 ring-2 ring-[var(--accent)]/20"
                          : "border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-60"
                        }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 stroke-[2.5]" />
                      ) : (
                        <Icon className={`h-6 w-6 ${isCurrent ? "stroke-[2]" : "stroke-[1.5]"}`} />
                      )}
                      {/* Pulse animation for current step */}
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-ping" />
                      )}
                    </div>
                    {/* Step label */}
                    <span
                      className={`mt-3 text-[11px] font-bold text-center max-w-[90px] leading-tight transition-colors duration-300 ${isCurrent
                        ? "text-[var(--accent)]"
                        : isCompleted
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-muted)]"
                        }`}
                    >
                      {s.label}
                    </span>
                    {/* Step number badge for upcoming steps */}
                    {isUpcoming && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[8px] font-bold rounded-full bg-[var(--bg-deep)] border border-[var(--border)] text-[var(--text-muted)]">
                        {index + 1}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 border border-[var(--danger)] bg-[var(--danger)]/10 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--danger)] flex-shrink-0 mt-0.5" />
            <p className="text-[var(--danger)] text-sm">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-8">
          {/* Step 1: Connect Wallet */}
          {step === "wallet" && (
            <div className="text-center space-y-6 py-8">
              <div className="w-20 h-20 mx-auto border-2 border-[var(--accent)] flex items-center justify-center">
                <Wallet className="w-10 h-10 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="font-display text-2xl mb-2">CONNECT WALLET</h2>
                <p className="text-[var(--text-secondary)]">
                  Connect your wallet to start setting up lazy trading
                </p>
              </div>

              {authenticated ? (
                <div className="space-y-4">
                  <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-4">
                    <p className="text-sm text-[var(--accent)] mb-2">
                      CONNECTED
                    </p>
                    <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                      {simulatedUserWallet}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep("ostium")}
                    className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-2"
                  >
                    CONTINUE
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {/* Simulated - already authenticated */ }}
                  className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  CONNECT WALLET
                </button>
              )}
            </div>
          )}

          {/* Step 2: Connect Telegram */}
          {step === "telegram" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto border-2 border-[var(--accent)] flex items-center justify-center mb-4">
                  <Send className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <h2 className="font-display text-2xl mb-2">CONNECT TELEGRAM</h2>
                <p className="text-[var(--text-secondary)]">
                  Link your Telegram to send trading signals
                </p>
              </div>

              {telegramUser ? (
                <div className="space-y-4">
                  <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-[var(--accent)] mx-auto mb-3" />
                    <p className="font-bold text-lg text-[var(--text-primary)]">
                      TELEGRAM CONNECTED
                    </p>
                    <p className="text-[var(--accent)] mt-2">
                      {telegramUser.telegram_username
                        ? `@${telegramUser.telegram_username}`
                        : telegramUser.first_name || "Connected"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={createAgentAndProceed}
                      disabled={loading || !tradingPreferences}
                      className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Activity className="w-5 h-5 animate-pulse" />
                          CREATING AGENT...
                        </>
                      ) : (
                        <>
                          COMPLETE SETUP
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    {!tradingPreferences && (
                      <p className="text-xs text-center text-[var(--text-muted)]">
                        Please configure trading preferences first
                      </p>
                    )}

                    {/* Manual Refresh Button */}
                    <button
                      onClick={checkTelegramStatus}
                      disabled={checkingTelegram || !authenticated}
                      className="w-full py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {checkingTelegram ? (
                        <>
                          <Activity className="w-4 h-4 animate-pulse" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <Activity className="w-4 h-4" />
                          Refresh Connection Status
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : linkCode ? (
                <div className="space-y-4">
                  {/* Step 1: Copy Code */}
                  <div className="border border-[var(--border)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold">
                        Step 1: Copy Code
                      </span>
                      <span className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)]">
                        1 of 3
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-[var(--bg-deep)] px-4 py-3 font-mono text-xl tracking-wider text-center text-[var(--accent)]">
                        {linkCode}
                      </code>
                      <button
                        onClick={copyCode}
                        className="p-3 border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Open Bot */}
                  <div className="border border-[var(--border)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold">
                        Step 2: Open Bot
                      </span>
                      <span className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)]">
                        2 of 3
                      </span>
                    </div>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 border border-[var(--accent)] text-[var(--accent)] font-bold hover:bg-[var(--accent)]/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Open @{botUsername}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Step 3: Start Bot */}
                  <div className="border border-[var(--border)] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold">
                        Step 3: Start Bot
                      </span>
                      <span className="text-xs px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)]">
                        3 of 3
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Click "Start" in Telegram to complete the connection. This
                      page will update automatically.
                    </p>
                  </div>

                  <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[var(--accent)] animate-pulse flex-shrink-0" />
                    <p className="text-sm text-[var(--text-secondary)] flex-1">
                      Waiting for Telegram connection...
                    </p>
                  </div>

                  {/* Manual Refresh Button */}
                  <button
                    onClick={checkTelegramStatus}
                    disabled={checkingTelegram || !authenticated}
                    className="w-full py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {checkingTelegram ? (
                      <>
                        <Activity className="w-4 h-4 animate-pulse" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Activity className="w-4 h-4" />
                        Refresh Connection Status
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateTelegramLink}
                  disabled={loading}
                  className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Activity className="w-5 h-5 animate-pulse" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      GENERATE TELEGRAM LINK
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Step 3: Trading Preferences */}
          {step === "preferences" && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl mb-2">
                  TRADING PREFERENCES
                </h2>
                <p className="text-[var(--text-secondary)]">
                  Configure how your agent should trade
                </p>
              </div>

              <TradingPreferencesForm
                userWallet={simulatedUserWallet}
                onClose={() => router.push("/")}
                onBack={() => setStep("ostium")}
                localOnly={true}
                onSaveLocal={handlePreferencesSave}
                initialPreferences={tradingPreferences || undefined}
                primaryLabel="Save & Continue to Telegram"
              />
            </div>
          )}

          {/* Step 2: Ostium Setup */}
          {step === "ostium" && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto border-2 border-[var(--accent)] flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-[var(--accent)]" />
                </div>
                <h2 className="font-display text-2xl mb-2">OSTIUM SETUP</h2>
                <p className="text-[var(--text-secondary)]">
                  Enable 1-click trading authorization
                </p>
              </div>

              {/* Agent Address */}
              {ostiumAgentAddress && (
                <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-4">
                  <p className="text-sm text-[var(--accent)] mb-2">
                    AGENT ADDRESS
                  </p>
                  <p className="font-mono text-xs text-[var(--text-primary)] break-all">
                    {ostiumAgentAddress}
                  </p>
                </div>
              )}

              {/* Status Check Loader */}
              {checkingOstiumStatus && (
                <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4 flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[var(--accent)] animate-pulse flex-shrink-0" />
                  <p className="text-sm text-[var(--text-secondary)] flex-1">
                    Checking authorization status...
                  </p>
                </div>
              )}

              {/* Status Display */}
              {!checkingOstiumStatus && (
                <div className="space-y-3">
                  {/* Delegation Status */}
                  <div
                    className={`border p-4 rounded ${delegationComplete
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)]"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {delegationComplete ? (
                          <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-[var(--border)] rounded-full" />
                        )}
                        <div>
                          <p className="font-bold text-sm">Delegation</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Allow agent to trade on your behalf
                          </p>
                        </div>
                      </div>
                      {delegationComplete && (
                        <span className="text-xs px-2 py-1 bg-[var(--accent)] text-[var(--bg-deep)] font-bold">
                          DONE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Allowance Status */}
                  <div
                    className={`border p-4 rounded ${allowanceComplete
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-[var(--border)]"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {allowanceComplete ? (
                          <CheckCircle className="w-5 h-5 text-[var(--accent)]" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-[var(--border)] rounded-full" />
                        )}
                        <div>
                          <p className="font-bold text-sm">USDC Allowance</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            Approve USDC spending for trades
                          </p>
                        </div>
                      </div>
                      {allowanceComplete && (
                        <span className="text-xs px-2 py-1 bg-[var(--accent)] text-[var(--bg-deep)] font-bold">
                          DONE
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              {!checkingOstiumStatus && (
                <div className="space-y-3">
                  {delegationComplete && allowanceComplete ? (
                    <div className="space-y-3">
                      <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-center">
                        <CheckCircle className="w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
                        <p className="font-bold text-[var(--accent)] mb-1">
                          AUTHORIZATION COMPLETE
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Both delegation and allowance are set up
                        </p>
                      </div>
                      <button
                        onClick={() => setStep("preferences")}
                        className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors flex items-center justify-center gap-2"
                      >
                        CONTINUE TO PREFERENCES
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={enableOneClickTrading}
                        disabled={enablingTrading || delegationLoading || allowanceLoading || !ostiumAgentAddress}
                        className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {enablingTrading || delegationLoading || allowanceLoading ? (
                          <>
                            <Activity className="w-5 h-5 animate-pulse" />
                            {currentAction || "ENABLING 1-CLICK TRADING..."}
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5" />
                            ENABLE 1-CT
                          </>
                        )}
                      </button>
                      {ostiumAgentAddress && (
                        <button
                          onClick={checkOstiumStatus}
                          disabled={delegationLoading || allowanceLoading || enablingTrading}
                          className="w-full py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                          Refresh Status
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delegation Transaction Hash */}
              {delegationTxHash && (
                <div className="mt-3 border border-[var(--accent)] bg-[var(--accent)]/5 p-3">
                  <p className="text-[var(--accent)] text-xs mb-1">
                    Delegation transaction submitted
                  </p>
                  <a
                    href={`https://arbiscan.io/tx/${delegationTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1 font-mono"
                  >
                    {delegationTxHash.slice(0, 20)}... <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* USDC Approval Transaction Hash */}
              {allowanceTxHash && (
                <div className="mt-3 border border-[var(--accent)] bg-[var(--accent)]/5 p-3">
                  <p className="text-[var(--accent)] text-xs mb-1">
                    USDC approval transaction submitted
                  </p>
                  <a
                    href={`https://arbiscan.io/tx/${allowanceTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] flex items-center gap-1 font-mono"
                  >
                    {allowanceTxHash.slice(0, 20)}... <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Info Box */}
              <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)] mb-2">
                  🔐 Security Note
                </p>
                <ul className="space-y-1 text-xs">
                  <li>• Agent can only trade - cannot withdraw funds</li>
                  <li>• You can revoke access anytime</li>
                  <li>• Funds remain in your wallet</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {step === "complete" && (
            <div className="space-y-6 py-4">
              {/* Success Header */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto border-2 border-[var(--accent)] bg-[var(--accent)] flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-[var(--bg-deep)]" />
                </div>
                <h2 className="font-display text-2xl mb-2">YOU'RE ALL SET!</h2>
                <p className="text-[var(--text-secondary)]">
                  Your Lazy Trading agent is ready to execute trades
                </p>
              </div>

              {/* Checklist */}
              <div className="border border-[var(--accent)] bg-[var(--accent)]/10 p-4 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm">Wallet connected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm">Telegram linked as signal source</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm">Trading preferences configured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm">Ostium delegation approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm">USDC spending approved</span>
                </div>
              </div>

              {/* Agent Address Display */}
              {ostiumAgentAddress && (
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-4">
                  <p className="text-xs font-bold text-[var(--text-secondary)] mb-2">
                    YOUR OSTIUM TRADING ADDRESS
                  </p>
                  <div className="flex items-center gap-2 bg-[var(--bg-deep)] p-3 border border-[var(--border)]">
                    <code className="flex-1 text-xs font-mono text-[var(--text-primary)] break-all">
                      {ostiumAgentAddress}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ostiumAgentAddress);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 hover:bg-[var(--bg-elevated)] transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-[var(--accent)]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* ETH Funding Section */}
              {ostiumAgentAddress && (
                <div className="border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-4">
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
                      placeholder="0.005"
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
                      TX: <a
                        href={`https://arbiscan.io/tx/${ethTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {ethTxHash.slice(0, 20)}...
                      </a>
                    </p>
                  )}
                  {ethError && (
                    <p className="text-xs text-red-500 mt-2">
                      {ethError}
                    </p>
                  )}
                </div>
              )}

              {/* Ostium Registration */}
              <div className="border border-[var(--border)] p-4">
                <p className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--accent)]" />
                  Register on Ostium Platform
                </p>
                <p className="text-xs text-[var(--text-secondary)] mb-3">
                  To enable trading, you need to register on the Ostium platform and deposit USDC:
                </p>
                <ol className="space-y-1 text-xs text-[var(--text-secondary)] ml-4 list-decimal mb-3">
                  <li>
                    Visit{' '}
                    <a
                      href="https://app.ostium.com/trade"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] hover:underline"
                    >
                      app.ostium.com/trade
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--bg-deep)] font-bold text-xs hover:bg-[var(--accent-dim)] transition-colors"
                >
                  Open Ostium Platform
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* How to Send Signals */}
              <div className="border border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)] mb-2">
                  📱 How to Send Signals
                </p>
                <p className="text-xs">
                  Send trading signals to the Telegram bot, and your agent will
                  execute them automatically.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/my-deployments")}
                  className="flex-1 py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold hover:bg-[var(--accent-dim)] transition-colors"
                >
                  VIEW MY DEPLOYMENTS
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 py-4 border border-[var(--border)] font-bold hover:border-[var(--accent)] transition-colors"
                >
                  BACK TO HOME
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}
