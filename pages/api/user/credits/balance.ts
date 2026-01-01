import { NextApiRequest, NextApiResponse } from 'next';
import { CreditService } from '@lib/credit-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { wallet } = req.query;

    if (!wallet || typeof wallet !== 'string') {
        return res.status(400).json({ error: 'Missing wallet parameter' });
    }

    try {
        const balance = await CreditService.getBalance(wallet);
        res.status(200).json({ balance });
    } catch (error: any) {
        console.error('Error fetching credit balance:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
