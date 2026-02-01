import { NextRequest, NextResponse } from 'next/server';
import { bus } from 'app/lib/live/bus';
import { projects } from 'app/lib/projects/mock';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { writeKey, name, url, params } = body;

    // === Validate writeKey ===
    if (!writeKey) {
      console.error('[Ingest] Missing writeKey in request');
      return NextResponse.json(
        { error: 'Missing writeKey' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find project by writeKey
    const project = projects.find((p) => p.writeKey === writeKey);
    
    if (!project) {
      // Log detailed error for debugging
      const validWriteKeys = projects.map((p) => ({
        projectId: p.id,
        writeKey: p.writeKey.substring(0, 12) + '...',
      }));
      
      console.error('[Ingest] Invalid writeKey:', {
        received: writeKey.substring(0, 12) + '...',
        validKeys: validWriteKeys,
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid writeKey',
          hint: 'Check that your writeKey matches your project configuration',
          received: writeKey.substring(0, 12) + '...'
        },
        { status: 401, headers: corsHeaders }
      );
    }

    // === Build event object ===
    const event = {
      id: params?.event_id || `evt_${Date.now()}`,
      projectId: project.id,
      name: name || 'unknown',
      url: url || '',
      timestamp: params?.timestamp || new Date().toISOString(),
      params: {
        ...params,
        // Ensure session is always included
        ei_session: params?.ei_session || null,
      },
    };

    console.log('[Ingest] Event received:', {
      projectId: project.id,
      eventName: name,
      session: params?.ei_session,
    });

    // === Push to SSE bus ===
    bus.emit('event', event);

    return NextResponse.json(
      { success: true, eventId: event.id },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Ingest] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

