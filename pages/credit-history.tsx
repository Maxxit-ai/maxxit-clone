import { Header } from '@components/Header';
import FooterSection from '@components/home/FooterSection';
import { usePrivy } from '@privy-io/react-auth';
import {
    History,
    ArrowLeft,
    Download,
    Filter,
    CreditCard,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    ChevronLeft,
    ChevronRight,
    Plus
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const usageHistory = [
    { id: "TX-9402", agent: "Alpha Whale", action: "Subscription Fee", credits: -500, date: "2025-12-30", type: "USAGE" },
    { id: "TX-9401", agent: "System", action: "Credit Purchase", credits: 5000, date: "2025-12-28", type: "PURCHASE" },
    { id: "TX-9399", agent: "Sniper Bot", action: "Deployment Cost", credits: -200, date: "2025-12-25", type: "USAGE" },
    { id: "TX-9395", agent: "Alpha Whale", action: "Bot Optimization", credits: -50, date: "2025-12-22", type: "USAGE" },
    { id: "TX-9390", agent: "BTC Scalper", action: "Signal Execution", credits: -10, date: "2025-12-21", type: "USAGE" },
    { id: "TX-9388", agent: "BTC Scalper", action: "Signal Execution", credits: -10, date: "2025-12-21", type: "USAGE" },
    { id: "TX-9385", agent: "System", action: "Credit Purchase", credits: 1000, date: "2025-12-15", type: "PURCHASE" },
    { id: "TX-9380", agent: "Sniper Bot", action: "Signal Execution", credits: -15, date: "2025-12-14", type: "USAGE" },
];

export default function CreditHistory() {
    const { authenticated } = usePrivy();
    const [filter, setFilter] = useState('ALL');

    return (
        <div className="min-h-screen bg-[var(--bg-deep)] text-[var(--text-primary)] font-mono">
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Breadcrumbs & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="space-y-2">
                        <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--accent)] text-xs font-bold hover:gap-3 transition-all">
                            <ArrowLeft className="h-4 w-4" /> BACK TO DASHBOARD
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-display uppercase tracking-tight flex items-center gap-3">
                            CREDIT <span className="text-[var(--accent)]">HISTORY</span>
                        </h1>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 border border-[var(--border)] hover:border-[var(--accent)] transition-colors text-xs font-bold">
                            <Download className="h-4 w-4" /> EXPORT CSV
                        </button>
                        <Link href="/pricing" className="flex-1 md:flex-none">
                            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--bg-deep)] hover:bg-[var(--accent-dim)] transition-colors text-xs font-bold">
                                <Plus className="h-4 w-4" /> TOP UP
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Overview Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 relative overflow-hidden group">
                        <p className="data-label mb-1">TOTAL CREDITS BOUGHT</p>
                        <p className="text-3xl font-display">15,000</p>
                        <ArrowUpRight className="absolute top-4 right-4 h-5 w-5 text-green-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 relative overflow-hidden group">
                        <p className="data-label mb-1">TOTAL CREDITS USED</p>
                        <p className="text-3xl font-display">6,750</p>
                        <ArrowDownLeft className="absolute top-4 right-4 h-5 w-5 text-red-400 opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="border border-[var(--border)] bg-[var(--bg-surface)] p-6 relative overflow-hidden group border-b-2 border-b-[var(--accent)]">
                        <p className="data-label mb-1">CURRENT BALANCE</p>
                        <p className="text-3xl font-display text-[var(--accent)]">8,250</p>
                        <CreditCard className="absolute top-4 right-4 h-5 w-5 text-[var(--accent)] opacity-20 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* History Table Container */}
                <div className="border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
                    {/* Table Filters */}
                    <div className="border-b border-[var(--border)] p-4 bg-[var(--bg-deep)]/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex gap-2 w-full md:w-auto">
                            {['ALL', 'PURCHASE', 'USAGE'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-1.5 text-[10px] font-bold tracking-widest border transition-all ${filter === f
                                        ? 'bg-[var(--accent)] text-[var(--bg-deep)] border-[var(--accent)]'
                                        : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                            <input
                                type="text"
                                placeholder="SEARCH TRANSACTIONS..."
                                className="w-full bg-[var(--bg-deep)] border border-[var(--border)] pl-10 pr-4 py-2 text-[10px] focus:outline-none focus:border-[var(--accent)] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-tighter">
                                <tr>
                                    <th className="p-4 font-normal">TRANSACTION ID</th>
                                    <th className="p-4 font-normal">DATE</th>
                                    <th className="p-4 font-normal">SOURCE / AGENT</th>
                                    <th className="p-4 font-normal">ACTION</th>
                                    <th className="p-4 font-normal text-right">AMOUNT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]/50">
                                {usageHistory
                                    .filter(item => filter === 'ALL' || item.type === filter)
                                    .map((item, i) => (
                                        <tr key={i} className="hover:bg-[var(--bg-elevated)]/30 transition-colors group">
                                            <td className="p-4 font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">{item.id}</td>
                                            <td className="p-4 text-[var(--text-secondary)]">{item.date}</td>
                                            <td className="p-4">
                                                <span className="font-bold">{item.agent}</span>
                                            </td>
                                            <td className="p-4 text-[var(--text-muted)] uppercase text-[10px] tracking-wider">{item.action}</td>
                                            <td className={`p-4 text-right font-display text-base ${item.credits > 0 ? 'text-green-400' : 'text-[var(--text-primary)]'}`}>
                                                {item.credits > 0 ? `+${item.credits}` : item.credits}
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t border-[var(--border)] p-4 flex justify-between items-center text-[10px] font-bold text-[var(--text-muted)]">
                        <span>SHOWING 1-8 OF 24 TRANSACTIONS</span>
                        <div className="flex gap-2">
                            <button className="p-2 border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-30 transition-colors" disabled>
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button className="p-2 border border-[var(--border)] hover:border-[var(--accent)] transition-colors">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <FooterSection />
        </div>
    );
}


