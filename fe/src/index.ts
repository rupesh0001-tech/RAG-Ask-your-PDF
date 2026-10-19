import { serve } from "bun";
import index from "./index.html";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8080";
const PORT = Number(process.env.PORT) || 3000;

const server = serve({
  port: PORT,
  routes: {
    // Backend health / connectivity probe
    "/api/health": {
      async GET() {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1500);
          
          let reachable = false;
          let pingTime = 0;
          const startTime = performance.now();
          
          try {
            const res = await fetch(`${BACKEND_URL}/health`, { signal: controller.signal });
            reachable = res.ok || res.status === 404; // if 404, server is still alive
            pingTime = Math.round(performance.now() - startTime);
          } catch {
            // Try fallback root GET
            try {
              const res2 = await fetch(`${BACKEND_URL}/`, { signal: controller.signal });
              reachable = res2.ok || res2.status === 404;
              pingTime = Math.round(performance.now() - startTime);
            } catch {
              reachable = false;
            }
          } finally {
            clearTimeout(timeout);
          }

          return Response.json({
            status: "ok",
            backendUrl: BACKEND_URL,
            backendReachable: reachable,
            pingMs: pingTime,
          });
        } catch (err: any) {
          return Response.json({
            status: "ok",
            backendUrl: BACKEND_URL,
            backendReachable: false,
            error: err?.message,
          });
        }
      },
    },

    // Proxy POST /api/upload to Backend POST /upload
    "/api/upload": {
      async POST(req) {
        try {
          const contentType = req.headers.get("content-type") || "";
          const bodyBuffer = await req.arrayBuffer();

          const backendRes = await fetch(`${BACKEND_URL}/upload`, {
            method: "POST",
            headers: {
              "content-type": contentType,
            },
            body: bodyBuffer,
          });

          const data = await backendRes.text();
          return new Response(data, {
            status: backendRes.status,
            headers: {
              "content-type": backendRes.headers.get("content-type") || "application/json",
            },
          });
        } catch (err: any) {
          return Response.json(
            {
              message: "Unable to reach Backend server at " + BACKEND_URL,
              error: err?.message || String(err),
            },
            { status: 502 }
          );
        }
      },
    },

    // Proxy POST /api/chat to Backend POST /chat
    "/api/chat": {
      async POST(req) {
        try {
          const bodyText = await req.text();

          const backendRes = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: bodyText,
          });

          const data = await backendRes.text();
          return new Response(data, {
            status: backendRes.status,
            headers: {
              "content-type": backendRes.headers.get("content-type") || "application/json",
            },
          });
        } catch (err: any) {
          return Response.json(
            {
              message: "Unable to reach Backend server at " + BACKEND_URL,
              error: err?.message || String(err),
            },
            { status: 502 }
          );
        }
      },
    },

    // Fallback: serve frontend index.html for all other routes
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 NexusDoc Frontend server running at ${server.url}`);
