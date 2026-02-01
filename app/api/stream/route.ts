import { NextRequest } from 'next/server';
import { pollEvents } from 'app/lib/live/redis-bus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type LiveEvent = {
  name?: string;
  projectId?: string | null;
  params?: Record<string, unknown> | null;
  timestamp?: string;
  [key: string]: unknown;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session');
  const projectId = searchParams.get('projectId');

  console.log('[Stream] New SSE connection:', { sessionId, projectId });

  const encoder = new TextEncoder();
  let lastPollTime = Date.now();
  let isAborted = false;

  // Lyssna på abort
  request.signal.addEventListener('abort', () => {
    isAborted = true;
    console.log('[Stream] Connection aborted');
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Skicka connected-meddelande
      const connectMsg = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        session: sessionId,
        projectId,
      });
      controller.enqueue(encoder.encode(`data: ${connectMsg}\n\n`));
      console.log('[Stream] Client connected');

      // Polling-loop
      const pollInterval = setInterval(async () => {
        if (isAborted) {
          clearInterval(pollInterval);
          return;
        }

        try {
          const events = await pollEvents(lastPollTime);
          
          for (const evt of events as LiveEvent[]) {
            // Filtrera på session
            const evtSession = evt.params?.ei_session as string | null;
            if (sessionId && evtSession !== sessionId) continue;

            // Filtrera på project
            if (projectId && evt.projectId !== projectId) continue;

            const message = JSON.stringify({ type: 'event', evt });
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            console.log('[Stream] Sent event:', evt.name);
          }

          lastPollTime = Date.now();
        } catch (err) {
          console.error('[Stream] Poll error:', err);
        }
      }, 1000); // Polla varje sekund

      // Heartbeat
      const heartbeatInterval = setInterval(() => {
        if (isAborted) {
          clearInterval(heartbeatInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 30000);

      // Cleanup
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
