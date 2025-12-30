import { Header } from '@components/Header';
import FooterSection from '@components/home/FooterSection';
import { Check, Shield, Zap, Sparkles, Orbit } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const pricingTiers = [
    {
        name: "FREE",
        price: "$0",
        credits: "0 Credits",
        description: "Explorer plan for those starting their trading journey.",
        features: [
            "Access to basic agents",
            "Manual trading dashboard",
            "Standard support",
            "Public community access"
        ],
        accent: "var(--text-muted)",
        buttonText: "CURRENT PLAN",
        popular: false
    },
    {
        name: "STARTER",
        price: "$19",
        credits: "1,000 Credits",
        description: "Kickstart your automated trading with essential credits.",
        features: [
            "1,000 Trading Credits",
            "Priority agent access",
            "Advanced analytics",
            "Email support"
        ],
        accent: "var(--accent)",
        buttonText: "BUY CREDITS",
        popular: false
    },
    {
        name: "PRO",
        price: "$49",
        credits: "5,000 Credits",
        description: "The sweet spot for active traders seeking efficiency.",
        features: [
            "5,000 Trading Credits",
            "Custom agent deployment",
            "Early access to new features",
            "Priority support"
        ],
        accent: "var(--accent)",
        buttonText: "BUY CREDITS",
        popular: true
    },
    {
        name: "WHALE",
        price: "$99",
        credits: "15,000 Credits",
        description: "Maximum power for serious institutional-grade trading.",
        features: [
            "15,000 Trading Credits",
            "Lowest cost per credit",
            "Dedicated account manager",
            "Custom API access"
        ],
        accent: "#ffaa00",
        buttonText: "BUY CREDITS",
        popular: false
    }
];

export default function Pricing() {
    const { login, authenticated } = usePrivy();

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] font-mono">
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--accent)] text-[var(--accent)] text-xs font-bold tracking-widest mb-4">
                        <Orbit className="h-4 w-4 animate-spin-slow" />
                        PROTOCOL FUEL
                    </div>
                    <h1 className="text-4xl md:text-6xl font-display uppercase tracking-tight">
                        Power Your <span className="text-[var(--accent)]">Agents</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
                        Credits are the lifeblood of the Maxxit ecosystem. Use them to deploy, maintain, and boost your automated trading agents across multiple venues.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pricingTiers.map((tier, index) => (
                        <div
                            key={index}
                            className={`relative border-box p-8 flex flex-col h-full bg-[var(--bg-surface)] transition-all duration-300 hover:-translate-y-2 group ${tier.popular ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/30' : 'border-[var(--border)]'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent)] text-[var(--bg-deep)] text-[10px] font-bold tracking-tighter uppercase">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className="mb-8">
                                <p className="data-label mb-2" style={{ color: tier.accent }}>{tier.name}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-display">{tier.price}</span>
                                    <span className="text-[var(--text-muted)] text-xs">ONE-TIME</span>
                                </div>
                                <div className="mt-4 p-3 bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-colors">
                                    <p className="text-[var(--accent)] font-bold text-xl">{tier.credits}</p>
                                    <p className="text-[var(--text-muted)] text-[10px] uppercase tracking-wider">Deposit into wallet</p>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed h-12">
                                {tier.description}
                            </p>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {tier.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-start gap-3 text-xs text-[var(--text-secondary)]">
                                        <Check className="h-4 w-4 text-[var(--accent)] shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => !authenticated && login()}
                                className={`w-full py-4 text-sm font-bold tracking-widest transition-all duration-300 ${tier.name === "FREE"
                                        ? 'border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
                                        : 'bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-dim)] shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:shadow-[0_0_30px_rgba(0,255,136,0.4)]'
                                    }`}
                            >
                                {authenticated ? tier.buttonText : "CONNECT WALLET"}
                            </button>
                        </div>
                    ))}
                </div>

                <section className="mt-32 p-12 bg-grid-pattern border border-[var(--border)] relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <h2 className="text-2xl font-display uppercase mb-4">Enterprise Solutions</h2>
                            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                                Need more than 50,000 credits? Searching for custom agent architectures? Our enterprise team provides bespoke infrastructure for high-frequency trading groups.
                            </p>
                        </div>
                        <button className="px-8 py-3 border border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-deep)] transition-all font-bold text-sm tracking-widest">
                            CONTACT SALES
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Shield className="h-64 w-64" />
                    </div>
                </section>
            </main>

            <FooterSection />

            <style jsx>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
