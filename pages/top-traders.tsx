"use client";

import { useState, useEffect, Suspense } from "react";
import { Header } from "@components/Header";
import { TraderTable } from "@components/top-traders/TraderTable";
import { Trader } from "@components/top-traders/TraderCard";
import { Trophy, TrendingUp, Users, Zap } from "lucide-react";
import simulationDataJson from "../json/simulation-data.json";

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-[var(--bg-surface)] border border-[var(--border)] hover-lift">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-[var(--accent-glow)] flex-shrink-0">
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="text-[10px] sm:text-xs uppercase tracking-wide text-[var(--text-muted)]">
                    {label}
                </div>
                <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)] font-display truncate">
                    {value}
                </div>
            </div>
        </div>
    );
}

function TopTradersContent() {
    const [traders, setTraders] = useState<Trader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Frontend-only: load top traders from local simulation JSON
        try {
            const { topTraders } = simulationDataJson as any;
            if (Array.isArray(topTraders)) {
                // Convert the simulation data format to match the expected Trader format
                // Note: totalPnl, totalVolume need to be converted to string format with proper decimals
                const formattedTraders: Trader[] = topTraders.map((trader: any, index: number) => ({
                    id: trader.id,
                    rank: index + 1,
                    walletAddress: trader.walletAddress,
                    totalVolume: typeof trader.totalVolume === 'string' 
                        ? (parseFloat(trader.totalVolume) * 1e6).toString() 
                        : (trader.totalVolume * 1e6).toString(),
                    totalClosedVolume: typeof trader.totalClosedVolume === 'string'
                        ? (parseFloat(trader.totalClosedVolume) * 1e6).toString()
                        : (trader.totalClosedVolume * 1e6).toString(),
                    totalPnl: typeof trader.totalPnl === 'string'
                        ? (parseFloat(trader.totalPnl) * 1e6).toString()
                        : (trader.totalPnl * 1e6).toString(),
                    totalProfitTrades: trader.totalProfitTrades,
                    totalLossTrades: trader.totalLossTrades,
                    totalTrades: trader.totalTrades,
                    lastActiveAt: trader.lastActiveAt,
                    edgeScore: trader.edgeScore,
                    consistencyScore: trader.consistencyScore,
                    stakeScore: trader.stakeScore,
                    freshnessScore: trader.freshnessScore,
                    impactFactor: trader.impactFactor,
                }));
                setTraders(formattedTraders);
            } else {
                setTraders([]);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Calculate aggregate stats
    const totalPnl = traders.reduce((sum, t) => sum + parseFloat(t.totalPnl) / 1e6, 0);
    const totalTrades = traders.reduce((sum, t) => sum + t.totalTrades, 0);
    const avgImpact = traders.length > 0
        ? traders.reduce((sum, t) => sum + t.impactFactor, 0) / traders.length
        : 0;

    return (
        <div className="min-h-screen bg-[var(--bg-deep)]">
            <Header />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
                {/* Page Header */}
                <div className="text-center mb-8 sm:mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-[var(--text-primary)] font-display">
                        Top Traders
                    </h1>
                    <p className="text-base sm:text-lg max-w-2xl mx-auto text-[var(--text-secondary)] font-medium-sans">
                        Discover the most successful traders on Maxxit, ranked by their impact factor score —
                        a metric combining edge, consistency, stake, and freshness.
                    </p>
                </div>

                {/* Stats Overview */}
                {!isLoading && !error && traders.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-12">
                        <StatCard icon={Users} label="Top Traders" value={traders.length.toString()} />
                        <StatCard
                            icon={TrendingUp}
                            label="Combined PnL"
                            value={totalPnl >= 1e6 
                                ? `$${(totalPnl / 1e6).toFixed(1)}M` 
                                : totalPnl >= 1e3 
                                    ? `$${(totalPnl / 1e3).toFixed(1)}K` 
                                    : `$${totalPnl.toFixed(0)}`}
                        />
                        <StatCard icon={Zap} label="Total Trades" value={totalTrades.toLocaleString()} />
                        <StatCard icon={Trophy} label="Avg Impact" value={avgImpact.toFixed(1)} />
                    </div>
                )}

                {/* Trader Table */}
                <TraderTable traders={traders} isLoading={isLoading} error={error} />
            </main>

            {/* Footer */}
            <footer className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center">
                        <p className="text-sm text-[var(--text-muted)]">
                            © 2024 Maxxit. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default function TopTradersPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[var(--bg-deep)]">
                    <Header />
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="w-8 h-8 border-2 border-[var(--border)] border-t-accent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-[var(--text-muted)] font-medium-sans">Loading...</p>
                        </div>
                    </div>
                </div>
            }
        >
            <TopTradersContent />
        </Suspense>
    );
}