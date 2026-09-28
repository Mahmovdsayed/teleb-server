import type { Context, MiddlewareHandler } from "hono";
import { en as enErrors, ar as arErrors } from "zod/locales";
import { en } from "./locales/en";
import { ar } from "./locales/ar";

export const SUPPORTED_LANGS = ["en", "ar"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const DEFAULT_LANG: Lang = "en";

const dictionaries = { en, ar };

export const zodErrorMaps = {
  en: enErrors().localeError,
  ar: arErrors().localeError,
};

function isLang(v: string | undefined): v is Lang {
  return !!v && (SUPPORTED_LANGS as readonly string[]).includes(v);
}

function fromAcceptLanguage(header: string | undefined): Lang | undefined {
  const primary = header?.split(",")[0]?.split(";")[0]?.split("-")[0];
  return isLang(primary) ? primary : undefined;
}

export function resolveLang(c: Context): Lang {
  const q = c.req.query("lang");
  const h = c.req.header("x-lang");
  if (isLang(q)) return q;
  if (isLang(h)) return h;
  return fromAcceptLanguage(c.req.header("accept-language")) ?? DEFAULT_LANG;
}

export const i18nMiddleware: MiddlewareHandler<{Variables: { lang: Lang } }> = async (c, next) => {
  const lang = resolveLang(c);
  c.set("lang", lang);
  return next();
};

type DotPaths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends Record<string, unknown>
    ? DotPaths<T[K], `${P}${K}.`>
    : `${P}${K}`;
}[keyof T & string];
type TranslationKey = DotPaths<typeof en>;

export function t(c: Context, key: TranslationKey, vars?: Record<string, string | number>): string {
  const lang = (c.get("lang") as Lang) ?? DEFAULT_LANG;
  const raw = key.split(".").reduce<any>((acc, part) => acc?.[part], dictionaries[lang]);
  if (!vars) return raw ?? key;
  return Object.entries(vars).reduce((str, [k, v]) => str.replaceAll(`{{${k}}}`, String(v)), raw ?? key);
}
