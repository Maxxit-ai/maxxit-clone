import React, { useState } from 'react';
import { X, Wallet, Shield, Loader2, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface Web3CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    tier: {
        name: string;
        price: string;
        credits: string;
    } | null;
    userWallet: string | undefined;
    onSuccess: (txHash: string) => void;
}

// NOTE: This modal now runs in pure simulation mode – no real Web3 or backend calls.
const SIMULATED_NETWORK_NAME = 'Arbitrum (Simulated)';

export function Web3CheckoutModal({
    isOpen,
    onClose,
    tier,
    userWallet,
    onSuccess
}: Web3CheckoutModalProps) {
    const [status, setStatus] = useState<'idle' | 'preparing' | 'signing' | 'pending' | 'verifying' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    if (!isOpen || !tier) return null;

    const handleConfirmPayment = () => {
        // Pure front-end simulation of a successful Web3 payment flow
        setError(null);
        setStatus('preparing');

        const simulatedTxHash = `0xSIMULATED_${tier.name}_${Date.now().toString(16)}`;

        // Step through the same statuses the real flow used
        setTimeout(() => {
            setStatus('signing');
            setTimeout(() => {
                setStatus('pending');
                setTxHash(simulatedTxHash);
                setTimeout(() => {
                    setStatus('verifying');
                    setTimeout(() => {
                        setStatus('success');
                        onSuccess(simulatedTxHash);
                    }, 800);
                }, 1000);
            }, 800);
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-[var(--bg-deep)]/90 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                            <Wallet className="h-5 w-5 text-[var(--accent)]" />
                        </div>
                        <h2 className="text-xl font-display uppercase tracking-tight">CRYPTO CHECKOUT</h2>
                    </div>
                    {status !== 'pending' && (
                        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            <X className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="p-8">
                    {status === 'idle' || status === 'error' ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-[var(--bg-deep)] border border-[var(--border)] space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
                                    <span>Plan</span>
                                    <span>Amount</span>
                                </div>
                                <div className="flex justify-between items-baseline font-display">
                                    <span className="text-xl">{tier.name}</span>
                                    <span className="text-2xl text-[var(--accent)]">{tier.price} USDC</span>
                                </div>
                                <div className="pt-2 border-t border-[var(--border)]/50">
                                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-tighter">
                                        NETWORK: {SIMULATED_NETWORK_NAME}
                                    </p>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                                    <p className="text-xs text-red-200 leading-relaxed">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleConfirmPayment}
                                className="w-full py-4 bg-[var(--accent)] text-[var(--bg-deep)] font-bold tracking-widest hover:bg-[var(--accent-dim)] transition-all flex items-center justify-center gap-2 group"
                            >
                                CONFIRM & SEND USDC
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </button>

                                <p className="text-[10px] text-center text-[var(--text-muted)] uppercase tracking-widest">
                                    Transaction simulated locally – no real funds are moved
                                </p>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center text-center space-y-6">
                            {status === 'success' ? (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full" />
                                    <CheckCircle2 className="h-20 w-20 text-[var(--accent)] relative" />
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute inset-0 bg-[var(--accent)]/10 blur-xl rounded-full animate-pulse" />
                                    <Loader2 className="h-20 w-20 text-[var(--accent)] animate-spin relative" />
                                </div>
                            )}

                            <div className="space-y-2">
                                <h3 className="text-xl font-display uppercase">
                                    {status === 'preparing' && 'PREPARING ASSETS'}
                                    {status === 'signing' && 'AWAITING SIMULATED SIGNATURE'}
                                    {status === 'pending' && 'SIMULATING PROTOCOL CONFIRMATION'}
                                    {status === 'verifying' && 'VERIFYING SIMULATED PAYMENT'}
                                    {status === 'success' && 'PAYMENT SIMULATED'}
                                </h3>
                                <p className="text-[var(--text-muted)] text-sm max-w-xs mx-auto">
                                    {status === 'preparing' && 'Initializing simulated transaction parameters...'}
                                    {status === 'signing' && 'Stepping through a mock wallet confirmation.'}
                                    {status === 'pending' && 'Simulating broadcast to Arbitrum network...'}
                                    {status === 'verifying' && 'Simulated backend is confirming payment and assigning credits...'}
                                    {status === 'success' && 'Demo credits have been added to your account (simulation only).'}
                                </p>
                            </div>

                            {txHash && (
                                <span className="text-[10px] break-all text-[var(--text-muted)] px-3 py-1 border border-[var(--border)]/60">
                                    TX (simulated): {txHash}
                                </span>
                            )}

                            {status === 'success' && (
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-deep)] font-bold text-sm"
                                >
                                    RETURN TO DASHBOARD
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Secure Badge */}
                <div className="p-6 bg-[var(--bg-elevated)]/30 border-t border-[var(--border)] flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4 text-[var(--text-muted)]" />
                    <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">SMART CONTRACT SECURED TRANSFERS</p>
                </div>
            </div>
        </div>
    );
}
