import { sql } from "drizzle-orm";
import { db } from "../../database";
import {
  collectionTable,
  messageTable,
  offerTable,
  productTable,
} from "../../database/schemas";

export interface IAnalyticsService {
  getOverview(): Promise<AnalyticsOverview>;
}

export interface AnalyticsOverview {
  collections: {
    total: number;
  };
  offers: {
    total: number;
    currentlyActive: number;
  };
  products: {
    total: number;
    active: number;
  };
  messages: {
    total: number;
    unread: number;
    highPriority: number;
  };
  generatedAt: string;
}

interface AnalyticsRow {
  collections: number;
  offers: number;
  activeOffers: number;
  products: number;
  activeProducts: number;
  messages: number;
  unreadMessages: number;
  highPriorityMessages: number;
}

class AnalyticsService implements IAnalyticsService {
  public async getOverview(): Promise<AnalyticsOverview> {
    const now = new Date();

    const result = await db.execute(sql`
        SELECT
        (SELECT COUNT(*)::int FROM ${collectionTable}) AS collections,

        (SELECT COUNT(*)::int FROM ${offerTable}) AS offers,

        (
          SELECT COUNT(*)::int
          FROM ${offerTable}
          WHERE ${offerTable.isActive} = true
            AND ${offerTable.startDate} <= ${now}
            AND ${offerTable.endDate} >= ${now}
        ) AS "activeOffers",

        (SELECT COUNT(*)::int FROM ${productTable}) AS products,

        (
          SELECT COUNT(*)::int
          FROM ${productTable}
          WHERE ${productTable.status} = 'active'
        ) AS "activeProducts",

        (SELECT COUNT(*)::int FROM ${messageTable}) AS messages,

        (
          SELECT COUNT(*)::int
          FROM ${messageTable}
          WHERE ${messageTable.isViewed} = false
        ) AS "unreadMessages",

        (
          SELECT COUNT(*)::int
          FROM ${messageTable}
          WHERE ${messageTable.priority} = 'high'
        ) AS "highPriorityMessages"
    `);

    const stats = result.rows[0] as AnalyticsRow | undefined;
    
    if (!stats) {
      throw new Error("ANALYTICS_OVERVIEW_FAILED");
    }

    return {
      collections: {
        total: stats.collections,
      },
      offers: {
        total: stats.offers,
        currentlyActive: stats.activeOffers,
      },
      products: {
        total: stats.products,
        active: stats.activeProducts,
      },
      messages: {
        total: stats.messages,
        unread: stats.unreadMessages,
        highPriority: stats.highPriorityMessages,
      },
      generatedAt: now.toISOString(),
    };
  }
}

export const analyticsService = new AnalyticsService();
