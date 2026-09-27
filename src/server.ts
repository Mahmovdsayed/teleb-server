import { app } from "./index";

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
