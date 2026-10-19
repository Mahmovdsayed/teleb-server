import type { AppContext } from "../../types/http";
import { t } from "../../i18n";
import { analyticsService } from "./analytics.service";

export const getAnalyticsController = async (c: AppContext) => {
  try {
    const analytics = await analyticsService.getOverview();

    return c.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "ANALYTICS_OVERVIEW_FAILED"
    ) {
      return c.json(
        {
          success: false,
          message: t(c, "analytics.overviewFailed"),
        },
        500,
      );
    }

    throw error;
  }
};
