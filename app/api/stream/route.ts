import { NextRequest } from 'next/server';
import { bus } from 'app/lib/live/bus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface EventData {
  params?: {
    ei_session?: string;
  };
  projectId?: string;
  name?: string;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sessionId = searchParams.get('session');
  const projectId = searchParams.get('projectId');

  console.log('[Stream] New connection:', { sessionId, projectId });

  const encoder = new TextEncoder();
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectMsg = JSON.stringify({
        type: 'connected',
        timestamp: new Date().toISOString(),
        session: sessionId,
      });
      controller.enqueue(encoder.encode(`data: ${connectMsg}\n\n`));

      // Handler for incoming events
      const eventHandler = (event: EventData) => {
        // Filter by session if specified
        if (sessionId && event.params?.ei_session !== sessionId) {
          return;
        }

        // Filter by project if specified
        if (projectId && event.projectId !== projectId) {
          return;
        }

        const message = JSON.stringify({
          type: 'event',
          evt: event,
        });

        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          console.log('[Stream] Sent event:', event.name);
        } catch (e) {
          console.error('[Stream] Error sending event:', e);
        }
      };

      // Subscribe to events
      bus.on('event', eventHandler);

      // Heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch (e) {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 30000);
    },
    cancel() {
      console.log('[Stream] Connection closed:', { sessionId });
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}