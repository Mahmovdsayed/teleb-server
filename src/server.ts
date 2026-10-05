import app from "./index";
import { env } from "./config/env";

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`🚀 Teleb server running on port ${env.PORT} [${env.NODE_ENV}]`);