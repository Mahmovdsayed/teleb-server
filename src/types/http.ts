import type { Context, Input } from "hono";
import type { AppEnv } from "./app";

export type AppContext<I extends Input = {}> = Context<AppEnv, string, I>;