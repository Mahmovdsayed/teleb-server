import { authService } from "./auth.service";
import type { SignInInput, SignUpInput } from "./auth.schemas";
import type { AppContext } from "../../types/http";
import { t } from "../../i18n";
import { tokenService } from "../../infrastructure/auth/token";
import { deleteCookie, setCookie } from "hono/cookie";
import { env } from "../../config/env";

type SignUpContext = AppContext<{ out: { json: SignUpInput } }>;
type SignInContext = AppContext<{ out: { json: SignInInput } }>;

const isProduction = env.NODE_ENV === "production";
const cookieDomain = env.COOKIE_DOMAIN || (isProduction ? ".teleb-furniture.com" : undefined);

export const signUpController = async (c: SignUpContext) => {
  try {
    const input = c.req.valid("json");
    const user = await authService.signUp(input);

    return c.json({ success: true, message: t(c, "auth.signupSuccess"), data: user });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return c.json({ success: false, message: t(c, "auth.emailAlreadyExists") }, 409);
    }
    throw error;
  }
};

export const signInController = async (c: SignInContext) => {
  try {
    const input = c.req.valid("json");
    const user = await authService.signIn(input);
    const token = await tokenService.create({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    setCookie(c, "access_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      ...(cookieDomain ? { domain: cookieDomain } : {}),
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.json({
      success: true,
      message: t(c, "auth.signinSuccess"),
      data: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
      return c.json({ success: false, message: t(c, "auth.invalidCredentials") }, 401);
    }

    throw error;
  }
};

export const logOutController = async (c: AppContext) => {
  deleteCookie(c, "access_token", {
    path: "/",
    ...(cookieDomain ? { domain: cookieDomain } : {}),
  });

  return c.json({ success: true, message: t(c, "auth.logoutSuccess") });
};
