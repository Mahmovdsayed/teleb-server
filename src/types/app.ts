import type { Lang } from "../i18n";
import type { User } from "./user";
export type AppEnv = { Variables: { lang: Lang; user: User } };