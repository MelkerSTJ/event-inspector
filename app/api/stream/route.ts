import { NextRequest } from "next/server";
import { bus } from "app/lib/live/bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LiveEvent = {
  name?: string;
  projectId?: string | null;
  params?: Record<string, unknown> | null;
  // tillåt extra fält utan att använda `any`
  [key: string]: unknown;
};

function isLiveEvent(value: unknown): value is LiveEvent {
  return typeof value === "object" && value !== null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get("session");
  const projectId = searchParams.get("projectId");

  console.log("[Stream] New connection:", { sessionId, projectId });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Initial "connected" message (SSE)
      const connectMsg = JSON.stringify({
        type: "connected",
        timestamp: new Date().toISOString(),
        session: sessionId,
        projectId,
      });

      controller.enqueue(encoder.encode(`data: ${connectMsg}\n\n`));

      const eventHandler = (payload: unknown) => {
        if (!isLiveEvent(payload)) return;

        const evt = payload;

        // Filter by session if specified
        const evtSession =
          typeof evt.params?.ei_session === "string" ? evt.params.ei_session : null;

        if (sessionId && evtSession !== sessionId) return;

        // Filter by project if specified
        if (projectId && evt.projectId !== projectId) return;

        const message = JSON.stringify({
          type: "event",
          evt,
        });

        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          const evtName = typeof evt.name === "string" ? evt.name : "unknown";
          console.log("[Stream] Sent event:", evtName);
        } catch (err) {
          console.error("[Stream] Error sending event:", err);
        }
      };

      // Subscribe
      bus.on("event", eventHandler);

      // Heartbeat (SSE comment line)
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      const cleanup = () => {
        console.log("[Stream] Connection closed:", { sessionId, projectId });
        bus.off("event", eventHandler);
        clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      // Cleanup on close
      request.signal.addEventListener("abort", cleanup, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
