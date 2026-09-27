import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    success: true,
  });
});

Bun.serve({
  // port: process.env.NODE_ENV === "development" ? 3000 : undefined,
  fetch: app.fetch,
});
