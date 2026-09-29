import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { t, type Lang } from "../i18n";
import { tokenService } from "../infrastructure/auth/token";
import type { User } from "../types/user";
import type { AppEnv } from "../types/app";
import { userTable } from "../database/schemas";
import { db } from "../database";
import { eq } from "drizzle-orm";

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}

export const requireAuth = (): MiddlewareHandler<AppEnv> => {
  return async (c, next) => {
    const token = getCookie(c, "access_token");

    if (!token) {
      return c.json({
        success: false,
        message: t(c, "common.unauthorized"),
      });
    }

    try {
      const payload = await tokenService.verify(token);

      const [current] = await db
        .select({
          id: userTable.id,
          name: userTable.name,
          email: userTable.email,
          role: userTable.role,
        })
        .from(userTable)
        .where(eq(userTable.id, payload.id))
        .limit(1);

      if (!current) {
        return c.json({
          success: false,
          message: t(c, "common.unauthorized"),
        });
      }
      
      if (current.role !== "admin") {
        return c.json({
          success: false,
          message: t(c, "common.forbidden"),
        });
      }

      const user: User = {
        id: current.id,
        name: current.name,
        email: current.email,
        role: current.role,
      };

      c.set("user", user);

      await next();
    } catch {
      return c.json({
        success: false,
        message: t(c, "common.unauthorized"),
      });
    }
  };
};
