import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "../config/env";

const sql = neon(env.DATABASE_URL);
const db = drizzle({ client: sql });

export { db };
