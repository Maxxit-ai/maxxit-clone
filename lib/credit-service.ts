import { prisma, withTransaction } from './prisma';
import { Decimal } from '@prisma/client/runtime/library';

export type CreditEntryType = 'PURCHASE' | 'USAGE' | 'REWARD' | 'ADJUSTMENT';

export class CreditService {
    /**
     * Mint credits to a user (PURCHASE or REWARD)
     * This follows double-entry logic: 
     * 1. Credit User Ledger
     * 2. Debit Treasury Ledger
     * 3. Update User Balance
     * 4. Update Treasury Stats
     */
    static async mintCredits(
        userWallet: string,
        amount: number | string,
        purpose: string,
        referenceId?: string,
        metadata?: any
    ) {
        const creditAmount = new Decimal(amount);

        return await withTransaction(async (tx) => {
            // 1. Check idempotency if referenceId is provided
            if (referenceId) {
                // @ts-ignore
                const existing = await tx.credit_ledger_entry.findUnique({
                    where: { reference_id: referenceId }
                });
                if (existing) return existing;
            }

            // 2. Record User Credit Entry
            // @ts-ignore
            const userEntry = await tx.credit_ledger_entry.create({
                data: {
                    user_wallet: userWallet,
                    amount: creditAmount,
                    entry_type: 'PURCHASE',
                    purpose,
                    reference_id: referenceId,
                    metadata
                }
            });

            // 3. Record Treasury Debit Entry (Double-Entry)
            // @ts-ignore
            await tx.credit_ledger_entry.create({
                data: {
                    user_wallet: 'SYSTEM_TREASURY',
                    amount: creditAmount.negated(),
                    entry_type: 'PURCHASE',
                    purpose: `MINT: ${purpose}`,
                    metadata: { target_wallet: userWallet, ...metadata }
                }
            });

            // 4. Update User Balance (Upsert)
            // @ts-ignore
            await tx.user_credit_balance.upsert({
                where: { user_wallet: userWallet },
                update: { balance: { increment: creditAmount } },
                create: { user_wallet: userWallet, balance: creditAmount }
            });

            // 5. Update Treasury Global Stats
            // @ts-ignore
            await tx.system_treasury.upsert({
                where: { id: 'GLOBAL_TREASURY' },
                update: { total_minted: { increment: creditAmount } },
                create: { id: 'GLOBAL_TREASURY', total_minted: creditAmount }
            });

            return userEntry;
        });
    }

    /**
     * Spend credits from a user (USAGE)
     */
    static async spendCredits(
        userWallet: string,
        amount: number | string,
        purpose: string,
        metadata?: any
    ) {
        const spendAmount = new Decimal(amount);

        return await withTransaction(async (tx) => {
            // 1. Check balance
            // @ts-ignore
            const balanceRecord = await tx.user_credit_balance.findUnique({
                where: { user_wallet: userWallet }
            });

            if (!balanceRecord || balanceRecord.balance.lt(spendAmount)) {
                throw new Error('Insufficient credit balance');
            }

            // 2. Record User Debit Entry
            // @ts-ignore
            const userEntry = await tx.credit_ledger_entry.create({
                data: {
                    user_wallet: userWallet,
                    amount: spendAmount.negated(),
                    entry_type: 'USAGE',
                    purpose,
                    metadata
                }
            });

            // 3. Record Treasury Credit Entry
            // @ts-ignore
            await tx.credit_ledger_entry.create({
                data: {
                    user_wallet: 'SYSTEM_TREASURY',
                    amount: spendAmount,
                    entry_type: 'USAGE',
                    purpose: `CONSUME: ${purpose}`,
                    metadata: { source_wallet: userWallet, ...metadata }
                }
            });

            // 4. Update User Balance
            // @ts-ignore
            await tx.user_credit_balance.update({
                where: { user_wallet: userWallet },
                data: { balance: { decrement: spendAmount } }
            });

            // 5. Update Treasury Global Stats
            // @ts-ignore
            await tx.system_treasury.upsert({
                where: { id: 'GLOBAL_TREASURY' },
                update: { total_consumed: { increment: spendAmount } },
                create: { id: 'GLOBAL_TREASURY', total_consumed: spendAmount }
            });

            return userEntry;
        });
    }

    static async getBalance(userWallet: string) {
        // @ts-ignore
        const record = await prisma.user_credit_balance.findUnique({
            where: { user_wallet: userWallet }
        });
        return record ? record.balance.toString() : '0';
    }

    static async getHistory(userWallet: string, limit = 50) {
        // @ts-ignore
        return await prisma.credit_ledger_entry.findMany({
            where: { user_wallet: userWallet },
            orderBy: { created_at: 'desc' },
            take: limit
        });
    }
}
