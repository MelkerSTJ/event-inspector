import { NextRequest, NextResponse } from 'next/server';
import { projects, type Project } from 'app/lib/projects/mock';
import { publishEvent } from 'app/lib/live/redis-bus';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function findProjectByWriteKey(writeKey: string): Project | null {
  for (const project of projects) {
    if (project.writeKey === writeKey) {
      return project;
    }
    for (const env of project.environments || []) {
      if (env.writeKey === writeKey) {
        return project;
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  console.log('[Ingest] === New request ===');
  
  try {
    const body = await request.json();
    const { writeKey, name, url, params } = body;

    console.log('[Ingest] Received:', {
      writeKey: writeKey ? writeKey.substring(0, 15) + '...' : 'MISSING',
      name,
      session: params?.ei_session,
    });

    if (!writeKey) {
      return NextResponse.json(
        { error: 'Missing writeKey' },
        { status: 400, headers: corsHeaders }
      );
    }

    const project = findProjectByWriteKey(writeKey);

    if (!project) {
      console.error('[Ingest] Invalid writeKey:', writeKey.substring(0, 15) + '...');
      return NextResponse.json(
        { error: 'Invalid writeKey' },
        { status: 401, headers: corsHeaders }
      );
    }

    const event = {
      id: params?.event_id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      projectId: project.id,
      name: name || 'unknown',
      url: url || '',
      timestamp: params?.timestamp || new Date().toISOString(),
      params: {
        ...params,
        ei_session: params?.ei_session || null,
      },
    };

    console.log('[Ingest] Event created:', event.id);

    // === REDIS PUBLISH ===
    await publishEvent(event);
    console.log('[Ingest] Event published to Redis');

    return NextResponse.json(
      { success: true, eventId: event.id },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('[Ingest] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
