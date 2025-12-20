import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

/**
 * Get the current lazy trading setup status for a user
 * Used to restore state when user refreshes the page
 * GET /api/lazy-trading/get-setup-status?userWallet=0x...
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userWallet } = req.query;

    if (!userWallet || typeof userWallet !== "string") {
      return res.status(400).json({ error: "userWallet is required" });
    }

    const normalizedWallet = userWallet.toLowerCase();

    // Find existing lazy trading agent for this wallet
    const existingAgent = await prisma.agents.findFirst({
      where: {
        creator_wallet: normalizedWallet,
        name: { startsWith: "Lazy Trader -" },
      },
      select: {
        id: true,
        name: true,
        venue: true,
        status: true,
        agent_telegram_users: {
          select: {
            telegram_alpha_users: {
              select: {
                id: true,
                telegram_user_id: true,
                telegram_username: true,
                first_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    // Get telegram user if linked via agent
    let telegramUser =
      existingAgent && existingAgent.agent_telegram_users.length > 0
        ? existingAgent.agent_telegram_users[0].telegram_alpha_users
        : null;

    // If no agent exists, check for lazy trader telegram user directly (before agent creation)
    if (!existingAgent) {
      const lazyTraderForWallet = await prisma.telegram_alpha_users.findFirst({
        where: {
          lazy_trader: true,
          user_wallet: normalizedWallet,
          // Not linked to any agent yet
          agent_telegram_users: {
            none: {},
          },
        },
        select: {
          id: true,
          telegram_user_id: true,
          telegram_username: true,
          first_name: true,
          last_name: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });

      if (lazyTraderForWallet) {
        // User has telegram connected but no agent yet
        telegramUser = lazyTraderForWallet;
        return res.status(200).json({
          success: true,
          hasSetup: true, // Has telegram connection, so has partial setup
          step: "preferences", // Can proceed to preferences
          agent: null,
          telegramUser: {
            id: telegramUser.id,
            telegram_user_id: telegramUser.telegram_user_id,
            telegram_username: telegramUser.telegram_username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
          },
          deployment: null,
          tradingPreferences: null,
          ostiumAgentAddress: null,
        });
      } else {
        // No lazy trading setup found at all
        return res.status(200).json({
          success: true,
          hasSetup: false,
          step: "wallet", // Start from beginning
        });
      }
    }

    // Get deployment and trading preferences separately
    const deployment = await prisma.agent_deployments.findFirst({
      where: {
        agent_id: existingAgent.id,
        user_wallet: normalizedWallet,
      },
      select: {
        id: true,
        status: true,
        enabled_venues: true,
        risk_tolerance: true,
        trade_frequency: true,
        social_sentiment_weight: true,
        price_momentum_focus: true,
        market_rank_priority: true,
      },
      orderBy: {
        sub_started_at: "desc",
      },
    });

    // Get Ostium agent address from user_agent_addresses
    const userAgentAddress = await prisma.user_agent_addresses.findUnique({
      where: { user_wallet: normalizedWallet },
      select: {
        ostium_agent_address: true,
      },
    });

    // Determine which step the user should be on
    let currentStep: string;

    if (!telegramUser) {
      currentStep = "telegram";
    } else if (!deployment) {
      currentStep = "preferences";
    } else {
      // If we have a deployment, user should be on ostium step to complete delegation/allowance
      // (they can check status there and complete if needed)
      currentStep = "ostium";
    }

    // Build trading preferences from deployment if exists
    const tradingPreferences = deployment
      ? {
          risk_tolerance: deployment.risk_tolerance,
          trade_frequency: deployment.trade_frequency,
          social_sentiment_weight: deployment.social_sentiment_weight,
          price_momentum_focus: deployment.price_momentum_focus,
          market_rank_priority: deployment.market_rank_priority,
        }
      : null;

    return res.status(200).json({
      success: true,
      hasSetup: true,
      step: currentStep,
      agent: {
        id: existingAgent.id,
        name: existingAgent.name,
        venue: existingAgent.venue,
        status: existingAgent.status,
      },
      telegramUser: telegramUser
        ? {
            id: telegramUser.id,
            telegram_user_id: telegramUser.telegram_user_id,
            telegram_username: telegramUser.telegram_username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
          }
        : null,
      deployment: deployment
        ? {
            id: deployment.id,
            status: deployment.status,
            enabled_venues: deployment.enabled_venues,
          }
        : null,
      tradingPreferences,
      ostiumAgentAddress: userAgentAddress?.ostium_agent_address || null,
    });
  } catch (error: any) {
    console.error("[API] Get lazy trading setup status error:", error);
    return res.status(500).json({
      error: "Failed to get setup status",
      message: error.message,
    });
  }
}
