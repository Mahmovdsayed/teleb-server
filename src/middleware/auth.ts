import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { t, type Lang } from "../i18n";
import { tokenService } from "../infrastructure/auth/token";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

declare module "hono" {
  interface ContextVariableMap {
    user: User;
  }
}

export const requireAuth = (): MiddlewareHandler<{Variables: { lang: Lang }}> => {
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

      const user: User = {
        id: payload.id,
        name: payload.name,
        email: payload.email,
        role: payload.role,
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
