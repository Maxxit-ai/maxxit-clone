import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { createTelegramBot } from "../../../lib/telegram-bot";

const bot = createTelegramBot();

/**
 * Generate a Telegram link code for lazy trading
 * Uses the main TELEGRAM_BOT_TOKEN
 * POST /api/lazy-trading/generate-telegram-link
 * Body: { userWallet: string }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userWallet } = req.body;

    if (!userWallet || typeof userWallet !== "string") {
      return res.status(400).json({ error: "userWallet is required" });
    }

    const normalizedWallet = userWallet.toLowerCase();

    // First check if user already has a telegram connected directly (via user_wallet)
    const existingTelegram = await prisma.telegram_alpha_users.findFirst({
      where: {
        user_wallet: normalizedWallet,
        lazy_trader: true,
        is_active: true,
      },
    });

    if (existingTelegram) {
      console.log(
        "[LazyTrading] User already has telegram connected:",
        existingTelegram.id
      );
      return res.status(200).json({
        success: true,
        alreadyLinked: true,
        telegramUser: {
          id: existingTelegram.id,
          telegram_user_id: existingTelegram.telegram_user_id,
          telegram_username: existingTelegram.telegram_username,
          first_name: existingTelegram.first_name,
        },
        agentId: null, // May or may not have agent yet
      });
    }

    // Also check if user already has a lazy trader telegram linked via agent_telegram_users
    // Find agents created by this wallet that are lazy traders
    const existingLazyAgent = await prisma.agents.findFirst({
      where: {
        creator_wallet: normalizedWallet,
        name: { startsWith: "Lazy Trader -" },
      },
      include: {
        agent_telegram_users: {
          include: {
            telegram_alpha_users: true,
          },
        },
      },
    });

    if (
      existingLazyAgent &&
      existingLazyAgent.agent_telegram_users.length > 0
    ) {
      const telegramUser =
        existingLazyAgent.agent_telegram_users[0].telegram_alpha_users;
      return res.status(200).json({
        success: true,
        alreadyLinked: true,
        telegramUser: {
          id: telegramUser.id,
          telegram_user_id: telegramUser.telegram_user_id,
          telegram_username: telegramUser.telegram_username,
          first_name: telegramUser.first_name,
        },
        agentId: existingLazyAgent.id,
      });
    }

    // Generate a unique link code with LT prefix for lazy trading
    const linkCode = `LT${bot.generateLinkCode()}`;

    // Store a temporary mapping of linkCode -> wallet in a simple cache table
    // This allows the webhook to know which wallet the telegram belongs to
    // We'll use a timestamp field to auto-expire old entries
    try {
      await prisma.$executeRaw`
        INSERT INTO lazy_trading_link_cache (link_code, user_wallet, expires_at)
        VALUES (${linkCode}, ${normalizedWallet}, NOW() + INTERVAL '10 minutes')
        ON CONFLICT (link_code) DO UPDATE SET user_wallet = ${normalizedWallet}, expires_at = NOW() + INTERVAL '10 minutes'
      `;
      console.log(
        `[LazyTrading] Stored link code mapping: ${linkCode} -> ${normalizedWallet}`
      );
    } catch (cacheError: any) {
      // If table doesn't exist, log warning but continue
      // The migration needs to be run first
      console.warn(
        "[LazyTrading] Could not store link code cache (run migration first):",
        cacheError.message
      );
    }

    // Get bot info
    const botInfo = await bot.getMe();
    console.log("[LazyTrading] Bot info:", JSON.stringify(botInfo, null, 2));
    console.log(
      "[LazyTrading] TELEGRAM_BOT_TOKEN set:",
      !!process.env.TELEGRAM_BOT_TOKEN
    );
    console.log(
      "[LazyTrading] TELEGRAM_BOT_USERNAME env:",
      process.env.TELEGRAM_BOT_USERNAME
    );

    const botUsername = botInfo?.username || "Prime_Alpha_bot"; // Use the correct default for the main trading bot

    // If botInfo doesn't have a username, there's likely an issue with the bot token
    if (!botInfo?.username) {
      console.warn(
        "[LazyTrading] Bot getMe() returned no username. Bot token might be incorrect."
      );
      console.warn(
        "[LazyTrading] Please check that TELEGRAM_BOT_TOKEN is set to the correct Prime_Alpha_bot token."
      );
    }

    console.log("[LazyTrading] Using bot username:", botUsername);

    // Create deep link URL - user clicks start with the code
    const deepLink = `https://t.me/${botUsername}?start=${linkCode}`;

    return res.status(200).json({
      success: true,
      alreadyLinked: false,
      linkCode,
      botUsername,
      deepLink,
      instructions: `Click the link to connect your Telegram as a signal source for Lazy Trading.`,
      expiresIn: 600, // 10 minutes
    });
  } catch (error: any) {
    console.error("[API] Generate lazy trading telegram link error:", error);
    return res.status(500).json({
      error: "Failed to generate link",
      message: error.message,
    });
  }
}
