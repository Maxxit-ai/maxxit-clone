import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Bot,
  Rocket,
  TrendingUp,
  DollarSign,
  Plus,
  Activity,
  BarChart3,
  CheckCircle,
  Pause,
  Zap,
} from "lucide-react";
import { Header } from "@components/Header";
import { useToast } from "@/hooks/use-toast";
import { MultiVenueSelector } from "@components/MultiVenueSelector";
import { Settings } from "lucide-react";
import agentsJson from "../json/agents.json";
import { UNIVERSAL_OSTIUM_AGENT_ADDRESS } from "../json/addresses";

// Minimal local simulation types (frontend-only)
type Agent = {
  id: string;
  name: string;
  venue: string;
  status: "PUBLIC" | "PRIVATE" | "DRAFT" | string;
  apr30d: number | null;
};

type AgentDeployment = {
  id: string;
  agentId: string;
  status: "ACTIVE" | "INACTIVE" | string;
  safeWallet: string;
  subActive: boolean;
};

type Position = {
  id: string;
  tokenSymbol: string;
  venue: string;
  side: string;
  status: "OPEN" | "CLOSED" | string;
  entryPrice: string;
  pnl?: string | null;
};

type BillingEvent = {
  id: string;
  kind: string;
  amount: string;
};

export default function Creator() {
  const router = useRouter();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [deployments, setDeployments] = useState<AgentDeployment[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatingAgentId, setActivatingAgentId] = useState<string | null>(
    null
  );
  const [deactivatingAgentId, setDeactivatingAgentId] = useState<string | null>(
    null
  );
  const [deployingAgent, setDeployingAgent] = useState<Agent | null>(null);
  const [showDeploymentModal, setShowDeploymentModal] = useState(false);
  const [userAgentAddresses, setUserAgentAddresses] = useState<{
    hyperliquid?: string | null;
    ostium?: string | null;
  } | null>(null);

  useEffect(() => {
    // Frontend-only: initialize dashboard with simulated data from local JSON
    try {
      const staticAgents = (agentsJson as any[]).map((a) => ({
        id: a.id,
        name: a.name,
        venue: a.venue,
        status: "PUBLIC" as const,
        apr30d: a.apr30d ?? null,
      })) as Agent[];

      setAgents(staticAgents);

      // Simulated user agent addresses: use universal Ostium agent for this demo
      setUserAgentAddresses({
        hyperliquid: null,
        ostium: UNIVERSAL_OSTIUM_AGENT_ADDRESS,
      });

      // Simple simulated deployments, positions, and billing events
      const simulatedDeployments: AgentDeployment[] = staticAgents.slice(0, 2).map((agent, idx) => ({
        id: `deployment-${idx + 1}`,
        agentId: agent.id,
        status: "ACTIVE",
        safeWallet: `0xSAFEWALLET${idx + 1}000000000000000000000000000000`,
        subActive: true,
      }));

      setDeployments(simulatedDeployments);

      const simulatedPositions: Position[] = simulatedDeployments.map((d, idx) => ({
        id: `position-${idx + 1}`,
        tokenSymbol: idx % 2 === 0 ? "ETH" : "BTC",
        venue: "OSTIUM",
        side: idx % 2 === 0 ? "LONG" : "SHORT",
        status: "OPEN",
        entryPrice: idx % 2 === 0 ? "3200" : "65000",
        pnl: idx % 2 === 0 ? "125.50" : "-42.10",
      }));

      setPositions(simulatedPositions);

      const simulatedBilling: BillingEvent[] = [
        {
          id: "billing-1",
          kind: "PROFIT_SHARE",
          amount: "152.34",
        },
        {
          id: "billing-2",
          kind: "INFRA_FEE",
          amount: "23.45",
        },
      ];

      setBillingEvents(simulatedBilling);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to initialize dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  async function activateAgent(agentId: string) {
    setActivatingAgentId(agentId);
    try {
      // Frontend-only: just update local state and show toast
      setAgents(
        agents.map((a) =>
          a.id === agentId ? { ...a, status: "PUBLIC" as const } : a
        )
      );

      toast({
        title: "Agent Activated (simulation)",
        description: "Your agent is now live on the marketplace (demo data).",
      });
    } catch (err: any) {
      toast({
        title: "Activation Failed",
        description: err.message || "Failed to activate agent",
        variant: "destructive",
      });
    } finally {
      setActivatingAgentId(null);
    }
  }

  async function deactivateAgent(agentId: string) {
    setDeactivatingAgentId(agentId);
    try {
      // Frontend-only: just update local state and show toast
      setAgents(
        agents.map((a) =>
          a.id === agentId ? { ...a, status: "PRIVATE" as const } : a
        )
      );

      toast({
        title: "Agent Deactivated (simulation)",
        description:
          "Your agent has been paused in this demo and is no longer active on the marketplace.",
      });
    } catch (err: any) {
      toast({
        title: "Deactivation Failed",
        description: err.message || "Failed to deactivate agent",
        variant: "destructive",
      });
    } finally {
      setDeactivatingAgentId(null);
    }
  }

  const handleEditAgent = (agentId: string) => {
    router.push(`/edit-agent/${agentId}`);
  };

  function handleDeployAgent(agent: Agent) {
    setDeployingAgent(agent);
    setShowDeploymentModal(true);
  }

  async function handleDeploymentComplete() {
    setShowDeploymentModal(false);
    setDeployingAgent(null);

    // Show success toast (simulation)
    toast({
      title: "Deployment Successful (simulation)",
      description: "Your agent has been deployed in this demo environment.",
    });
  }

  // Calculate totals
  const totalRevenue = billingEvents
    .filter((e) => e.kind === "PROFIT_SHARE")
    .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

  const totalFees = billingEvents
    .filter((e) => e.kind === "INFRA_FEE")
    .reduce((sum, e) => sum + parseFloat(e.amount || "0"), 0);

  const activeDeploymentCount = deployments.filter(
    (d) => d.status === "ACTIVE"
  ).length;
  const openPositionsCount = positions.filter(
    (p) => p.status === "OPEN"
  ).length;

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-96 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background border border-[var(--border)]">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="font-display text-5xl font-bold text-foreground mb-8 uppercase">
            Creator Dashboard
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="h-4 bg-muted rounded mb-3 w-1/2 animate-pulse" />
                <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-6"
              >
                <div className="h-6 bg-muted rounded mb-4 w-1/3 animate-pulse" />
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div
                      key={j}
                      className="h-20 bg-muted rounded animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background border border-[var(--border)]">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1
              className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent mb-2"
              data-testid="text-title"
            >
              CREATOR DASHBOARD
            </h1>
            <p className="text-muted-foreground">
              Monitor your agents' performance and earnings
            </p>
          </div>
          <Link
            href="/create-agent"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
            data-testid="link-create-agent"
          >
            <Plus className="h-5 w-5" />
            Create Agent
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-destructive/10 border border-destructive rounded-md">
            <p className="text-destructive text-sm">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Make sure NEON_REST_URL and NEON_REST_TOKEN are configured
            </p>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">Total Agents</h3>
            <p
              className="text-3xl font-bold text-foreground"
              data-testid="text-total-agents"
            >
              {agents.length}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">
              Active Deployments
            </h3>
            <p
              className="text-3xl font-bold text-foreground"
              data-testid="text-active-deployments"
            >
              {activeDeploymentCount}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">
              Open Positions
            </h3>
            <p
              className="text-3xl font-bold text-foreground"
              data-testid="text-open-positions"
            >
              {openPositionsCount}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
            <h3 className="text-sm text-muted-foreground mb-1">
              Profit Share Earned
            </h3>
            <p
              className="text-3xl font-bold text-primary"
              data-testid="text-profit-share"
            >
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
              <Bot className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              No Agents Yet
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first autonomous trading agent to start earning from
              crypto Twitter signals and technical indicators
            </p>
            <Link
              href="/create-agent"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Widget 1: My Agents */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  My Agents
                </h2>
              </div>
              <div className="space-y-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 bg-background border border-border rounded-md hover:border-primary transition-colors"
                    data-testid={`card-agent-${agent.id}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {agent.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {agent.venue}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${agent.status === "PUBLIC"
                            ? "bg-primary/20 text-primary"
                            : agent.status === "PRIVATE"
                              ? "bg-yellow-500/20 text-yellow-500"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {agent.status}
                        </span>

                        {/* Edit button */}
                        <button
                          onClick={() => handleEditAgent(agent.id)}
                          className="flex items-center gap-1 px-3 py-1 border border-border text-xs rounded-md hover:border-primary transition-all"
                          data-testid={`button-edit-${agent.id}`}
                        >
                          <Settings className="h-3 w-3" />
                          Edit
                        </button>

                        {/* Deploy button - available for all agent statuses */}
                        <button
                          onClick={() => handleDeployAgent(agent)}
                          className="flex items-center gap-1 px-3 py-1 bg-[var(--accent)] text-[var(--bg-deep)] text-xs rounded-md hover:bg-[var(--accent-dim)] transition-all font-bold"
                          data-testid={`button-deploy-${agent.id}`}
                        >
                          <Zap className="h-3 w-3" />
                          Deploy
                        </button>

                        {/* Status toggle buttons */}
                        {agent.status === "PUBLIC" ? (
                          <button
                            onClick={() => deactivateAgent(agent.id)}
                            disabled={deactivatingAgentId === agent.id}
                            className="flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-xs rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <Pause className="h-3 w-3" />
                            {deactivatingAgentId === agent.id ? "Switching..." : "Private"}
                          </button>
                        ) : (
                          <button
                            onClick={() => activateAgent(agent.id)}
                            disabled={activatingAgentId === agent.id}
                            className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground text-xs rounded-md hover-elevate disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <CheckCircle className="h-3 w-3" />
                            {activatingAgentId === agent.id ? "Switching..." : "Public"}
                          </button>
                        )}
                      </div>
                    </div>
                    {agent.apr30d !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          APR (30d):
                        </span>
                        <span className="font-semibold text-foreground">
                          {agent.apr30d.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Active Deployments */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Active Deployments
                </h2>
              </div>
              {deployments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No deployments yet
                </p>
              ) : (
                <div className="space-y-4">
                  {deployments.slice(0, 5).map((deployment) => {
                    const agent = agents.find(
                      (a) => a.id === deployment.agentId
                    );
                    return (
                      <div
                        key={deployment.id}
                        className="p-4 bg-background border border-border rounded-md"
                        data-testid={`card-deployment-${deployment.id}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {agent?.name || "Unknown Agent"}
                            </h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              {deployment.safeWallet.slice(0, 10)}...
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-md ${deployment.status === "ACTIVE"
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {deployment.status}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Subscription:
                          </span>
                          <span className="text-foreground">
                            {deployment.subActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Widget 3: Recent Positions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Recent Positions
                </h2>
              </div>
              {positions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No positions yet
                </p>
              ) : (
                <div className="space-y-4">
                  {positions.slice(0, 5).map((position) => (
                    <div
                      key={position.id}
                      className="p-4 bg-background border border-border rounded-md"
                      data-testid={`card-position-${position.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {position.tokenSymbol}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {position.venue} • {position.side}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-md ${position.status === "OPEN"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {position.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Entry:</span>
                          <span className="ml-2 text-foreground font-mono">
                            ${parseFloat(position.entryPrice).toFixed(2)}
                          </span>
                        </div>
                        {position.pnl && (
                          <div>
                            <span className="text-muted-foreground">PnL:</span>
                            <span
                              className={`ml-2 font-semibold ${parseFloat(position.pnl) >= 0
                                ? "text-primary"
                                : "text-destructive"
                                }`}
                            >
                              ${parseFloat(position.pnl).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Widget 4: Billing Summary */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Billing Summary
                </h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-background border border-border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Total Fees Paid
                    </span>
                    <span
                      className="text-lg font-semibold text-foreground"
                      data-testid="text-total-fees"
                    >
                      ${totalFees.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-background border border-border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Profit Share Earned
                    </span>
                    <span className="text-lg font-semibold text-primary">
                      ${totalRevenue.toFixed(2)}
                    </span>
                  </div>
                </div>
                {billingEvents.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-foreground mb-2">
                      Recent Events
                    </h3>
                    <div className="space-y-2">
                      {billingEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="flex justify-between text-xs"
                          data-testid={`billing-event-${event.id}`}
                        >
                          <span className="text-muted-foreground">
                            {event.kind}
                          </span>
                          <span className="text-foreground font-mono">
                            ${parseFloat(event.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deployment Modal */}
      {showDeploymentModal && deployingAgent && (
        <MultiVenueSelector
          agentId={deployingAgent.id}
          agentName={deployingAgent.name}
          onClose={() => {
            setShowDeploymentModal(false);
            setDeployingAgent(null);
          }}
          onComplete={handleDeploymentComplete}
          userAgentAddresses={userAgentAddresses}
        />
      )}
    </div>
  );
}
