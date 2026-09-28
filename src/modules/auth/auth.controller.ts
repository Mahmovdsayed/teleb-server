import { authService } from "./auth.service";
import type { SignUpInput } from "./auth.schemas";
import type { AppContext } from "../../types/http";
import { t } from "../../i18n";

type SignUpContext = AppContext<{ out: { json: SignUpInput } }>;

export const signUpController = async (c: SignUpContext) => {
  try {
    const input = c.req.valid("json");
    const user = await authService.signUp(input);

    return c.json({
      success: true,
      message: t(c, "auth.signupSuccess"),
      data: user,
    });

  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
      return c.json({
        success: false,
        message: t(c, "auth.emailAlreadyExists"),
      });
    }

    throw error;
  }
};
