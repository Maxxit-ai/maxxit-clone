import { useCallback, useEffect, useState } from 'react';
import { AgentDrawer } from '@components/AgentDrawer';
import { HyperliquidConnect } from '@components/HyperliquidConnect';
import { MultiVenueSelector } from '@components/MultiVenueSelector';
import { Header } from '@components/Header';
import HeroSection from '@components/home/HeroSection';
import ArchitectureSection from '@components/home/ArchitectureSection';
import CreateAgentSection from '@components/home/CreateAgentSection';
import EconomySection from '@components/home/EconomySection';
import StatsSection from '@components/home/StatsSection';
import AgentsSection from '@components/home/AgentsSection';
import CTASection from '@components/home/CTASection';
import FooterSection from '@components/home/FooterSection';
import { AgentSummary } from '@components/home/types';
import simulationDataJson from '../json/simulation-data.json';
import {
  UNIVERSAL_WALLET_ADDRESS,
  UNIVERSAL_OSTIUM_AGENT_ADDRESS,
  UNIVERSAL_DELEGATION_ADDRESS,
} from '../json/addresses';

export default function Home() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentSummary | null>(null);
  const [hyperliquidModalOpen, setHyperliquidModalOpen] = useState(false);
  const [hyperliquidAgentId, setHyperliquidAgentId] = useState<string>('');
  const [hyperliquidAgentName, setHyperliquidAgentName] = useState<string>('');
  const [hyperliquidAgentVenue, setHyperliquidAgentVenue] = useState<string>('');
  const [multiVenueSelectorOpen, setMultiVenueSelectorOpen] = useState(false);
  const [multiVenueAgent, setMultiVenueAgent] = useState<{ id: string; name: string; description: string | null } | null>(null);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [userAgentAddresses, setUserAgentAddresses] = useState<{
    hyperliquid?: string | null;
    ostium?: string | null;
  } | null>(null);
  const [agentDeployments, setAgentDeployments] = useState<Record<string, string[]>>({}); // agentId -> enabled_venues[]
  const [ostiumDelegationStatus, setOstiumDelegationStatus] = useState<{
    hasDelegation: boolean;
    delegatedAddress: string;
    isDelegatedToAgent: boolean;
  } | null>(null);
  const [ostiumUsdcAllowance, setOstiumUsdcAllowance] = useState<{
    usdcAllowance: number;
    hasApproval: boolean;
  } | null>(null);

  useEffect(() => {
    // Use local JSON data instead of backend/db and API calls
    try {
      const { agents: staticAgents, ostiumStatus } = simulationDataJson as any;
      setAgents(staticAgents || []);

      // Use universal addresses for the demo user
      // Connected wallet is the user's wallet (simulates Privy)
      // Ostium agent address is the trading wallet for Ostium
      setUserAgentAddresses({
        hyperliquid: null,
        ostium: UNIVERSAL_OSTIUM_AGENT_ADDRESS,
      });

      // Map deployments, delegation status, and USDC allowance from JSON
      const {
        agentDeployments: deploymentsFromJson,
        delegationStatus,
        usdcAllowance,
      } = ostiumStatus || {};

      setAgentDeployments(deploymentsFromJson || {});

      if (delegationStatus) {
        setOstiumDelegationStatus({
          hasDelegation: Boolean(delegationStatus.hasDelegation),
          delegatedAddress: UNIVERSAL_DELEGATION_ADDRESS,
          isDelegatedToAgent: Boolean(delegationStatus.isDelegatedToAgent),
        });
      }

      if (usdcAllowance) {
        setOstiumUsdcAllowance({
          usdcAllowance: Number(usdcAllowance.usdcAllowance ?? 0),
          hasApproval: Boolean(usdcAllowance.hasApproval),
        });
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  const scrollToSection = useCallback((targetId: string) => {
    const element = document.getElementById(targetId);
    if (!element) {
      console.error(`${targetId} section not found`);
      return;
    }
    const headerOffset = 100;
    const elementTop = element.offsetTop;
    window.scrollTo({
      top: elementTop - headerOffset,
      behavior: 'smooth',
    });
  }, []);

  const handleAgentClick = useCallback((agent: AgentSummary) => {
    if (agent.venue === 'MULTI') {
      setMultiVenueAgent({ id: agent.id, name: agent.name, description: agent.description });
      setMultiVenueSelectorOpen(true);
    } else {
      setSelectedAgent(agent);
    }
  }, []);

  const handleDeployClick = useCallback((agent: AgentSummary) => {
    if (agent.venue === 'MULTI') {
      setMultiVenueAgent({ id: agent.id, name: agent.name, description: agent.description });
      setMultiVenueSelectorOpen(true);
      return;
    }
    setHyperliquidAgentId(agent.id);
    setHyperliquidAgentName(agent.name);
    setHyperliquidAgentVenue(agent.venue);
    setHyperliquidModalOpen(true);
  }, []);

  return (
    <div className="min-h-screen border border-[var(--border)] bg-[var(--bg-deep)] text-[var(--text-primary)] ">
      <div className="min-h-svh flex flex-col">
        <Header />
        <HeroSection
          onDeployScroll={() => scrollToSection('agents')}
          onLearnMoreScroll={() => scrollToSection('architecture')}
        />
      </div>

      <ArchitectureSection activeAgent={activeAgent} onHover={setActiveAgent} />
      <CreateAgentSection />
      <EconomySection />
      <StatsSection />
      <AgentsSection
        agents={agents}
        loading={loading}
        error={error}
        onCardClick={handleAgentClick}
        onDeployClick={handleDeployClick}
        userAgentAddresses={userAgentAddresses}
        agentDeployments={agentDeployments}
        ostiumDelegationStatus={ostiumDelegationStatus}
        ostiumUsdcAllowance={ostiumUsdcAllowance}
      />
      <CTASection />
      <FooterSection />

      {selectedAgent && (
        <AgentDrawer
          agentId={selectedAgent.id}
          agentName={selectedAgent.name}
          agentVenue={selectedAgent.venue}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {hyperliquidModalOpen && (
        <HyperliquidConnect
          agentId={hyperliquidAgentId}
          agentName={hyperliquidAgentName}
          agentVenue={hyperliquidAgentVenue || 'HYPERLIQUID'}
          onClose={() => setHyperliquidModalOpen(false)}
          onSuccess={() => console.log('Setup complete')}
        />
      )}

      {multiVenueSelectorOpen && multiVenueAgent && (
        <MultiVenueSelector
          agentId={multiVenueAgent.id}
          agentName={multiVenueAgent.name}
          agentDescription={multiVenueAgent.description}
          onClose={() => {
            setMultiVenueSelectorOpen(false);
            setMultiVenueAgent(null);
          }}
          onComplete={() => {
            // In this demo setup we just close the selector; deployments come from static JSON.
            setMultiVenueSelectorOpen(false);
            setMultiVenueAgent(null);
          }}
          userAgentAddresses={userAgentAddresses}
          agentDeployments={agentDeployments}
        />
      )}
    </div>
  );
}

