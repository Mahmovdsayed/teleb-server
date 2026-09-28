import type { MiddlewareHandler } from "hono";
import { t, type Lang } from "../i18n";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

declare module "hono" {
  interface ContextVariableMap {
    authUser: AuthUser;
  }
}

const getCookieValue = (cookieHeader: string, name: string): string | undefined => {
  const pairs = cookieHeader.split(";").map((c) => c.trim().split("=", 2));
  const match = pairs.find(([k]) => k === name);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};


export const requireAuth: MiddlewareHandler<{Variables: { lang: Lang }}> = async (c, next) => {
  const token = c.req.header("authorization");
  if (!token) return c.json({ success: false, message: t(c, "common.unauthorized")});
  
  await next();
};
