import { subscribe } from "app/lib/live/bus";

export const runtime = "nodejs";

/**
 * Format data as Server-Sent Event
 */
function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const projectId = searchParams.get("projectId");
  const envId = searchParams.get("envId");

  if (!projectId || !envId) {
    return new Response("Missing projectId or envId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Initial hello message (client knows stream is alive)
      controller.enqueue(
        encoder.encode(sse({ type: "hello", projectId, envId }))
      );

      const unsubscribe = subscribe(projectId, envId, (evt) => {
        controller.enqueue(
          encoder.encode(sse({ type: "event", evt }))
        );
      });

      // Keep-alive ping (important for proxies / browsers)
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(": keep-alive\n\n"));
      }, 15000);

      const abort = () => {
        clearInterval(keepAlive);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      req.signal?.addEventListener("abort", abort);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
