import { validator } from "hono/validator";
import type { z } from "zod";
import { t, type Lang } from "../i18n";
import { localizedZodError } from "../i18n/zodMessages";

type Target = "json" | "query" | "param" | "header";

export function zValidate<S extends z.ZodTypeAny>(target: Target, schema: S) {
  return validator(target, (value, c) => {
    const lang = (c.get("lang") as Lang) ?? "en";
    const result = schema.safeParse(value, { error: localizedZodError(lang) });

    if (!result.success) {
      return c.json({
        success: false,
        message: t(c, "common.validationFailed"),
        errors: result.error.issues.map((iss) => ({
          path: iss.path.join("."),
          message: iss.message,
        })),
      });
    }

    return result.data;
  });
}
