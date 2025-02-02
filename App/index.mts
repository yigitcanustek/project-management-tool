import { serve } from "bun";

const server = serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response("Hello, Bun.js!");
    }

    if (url.pathname === "/json") {
      return new Response(JSON.stringify({ message: "Bun.js is fast!" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Bun server is running on http://localhost:${server.port}`);
