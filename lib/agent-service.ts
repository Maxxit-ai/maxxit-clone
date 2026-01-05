import { prisma } from "./prisma";

export interface AgentLinkingData {
  ctAccountIds?: string[];
  researchInstituteIds?: string[];
  telegramAlphaUserIds?: string[];
  topTraderIds?: string[];
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);

  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      result[snakeKey] = convertKeysToSnakeCase(obj[key]);
    }
  }
  return result;
}

export class AgentService {
  /**
   * Creates an agent and all its associated links in a single operation.
   * Can be used within an existing Prisma transaction by passing the transaction client.
   *
   * @param tx Prisma client or transaction client
   * @param agentData Data for agents.create (camelCase allowed)
   * @param linkingData Arrays of IDs to link (CT accounts, Research Institutes, Telegram Users)
   */
  static async createAgentCompletely(
    tx: any,
    agentData: any,
    linkingData: AgentLinkingData
  ) {
    const db = tx || prisma;

    // 1. Create the base agent record (transform camelCase to snake_case)
    const snakeAgentData = convertKeysToSnakeCase(agentData);

    const agent = await db.agents.create({
      data: {
        ...snakeAgentData,
      },
    });

    const agentId = agent.id;

    // 2. Link CT accounts (agent_accounts table)
    if (linkingData.ctAccountIds && linkingData.ctAccountIds.length > 0) {
      await db.agent_accounts.createMany({
        data: linkingData.ctAccountIds.map((ctAccountId: string) => ({
          agent_id: agentId,
          ct_account_id: ctAccountId,
        })),
        skipDuplicates: true,
      });
    }

    // 3. Link Research Institutes (agent_research_institutes table)
    if (
      linkingData.researchInstituteIds &&
      linkingData.researchInstituteIds.length > 0
    ) {
      await db.agent_research_institutes.createMany({
        data: linkingData.researchInstituteIds.map((instituteId: string) => ({
          agent_id: agentId,
          institute_id: instituteId,
        })),
        skipDuplicates: true,
      });
    }

    // 4. Link Telegram Alpha Users (agent_telegram_users table)
    if (
      linkingData.telegramAlphaUserIds &&
      linkingData.telegramAlphaUserIds.length > 0
    ) {
      await db.agent_telegram_users.createMany({
        data: linkingData.telegramAlphaUserIds.map((telegramAlphaUserId: string) => ({
          agent_id: agentId,
          telegram_alpha_user_id: telegramAlphaUserId,
        })),
        skipDuplicates: true,
      });
    }

    // 5. Link Top Traders (agent_top_traders table)
    if (linkingData.topTraderIds && linkingData.topTraderIds.length > 0) {
      await db.agent_top_traders.createMany({
        data: linkingData.topTraderIds.map((topTraderId: string) => ({
          agent_id: agentId,
          top_trader_id: topTraderId,
          is_active: true,
        })),
        skipDuplicates: true,
      });
    }

    return agent;
  }
}
