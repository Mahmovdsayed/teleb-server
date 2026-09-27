import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => {
  return c.json({
    success: true,
  });
});

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
