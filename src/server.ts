import app from "./index";

const isDevelopment = Bun.env.NODE_ENV === "development";

Bun.serve({
  ...(isDevelopment ? { port: 3000 } : {}),
  fetch: app.fetch,
});