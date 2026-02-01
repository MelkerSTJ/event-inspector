import { Redis } from '@upstash/redis';

// Skapa Redis-klient
// Upstash REST API fungerar perfekt med serverless!
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const CHANNEL = 'ei:events';
const EVENT_TTL = 60; // Events lever i 60 sekunder i Redis

// === Publicera event ===
// Anropas av /api/ingest
export async function publishEvent(event: unknown): Promise<void> {
  const eventId = (event as { id?: string })?.id || `evt_${Date.now()}`;
  const key = `${CHANNEL}:${eventId}`;
  
  // Spara event i Redis med TTL
  await redis.set(key, JSON.stringify(event), { ex: EVENT_TTL });
  
  // Pusha event-ID till en lista (för polling)
  await redis.lpush(`${CHANNEL}:queue`, eventId);
  await redis.ltrim(`${CHANNEL}:queue`, 0, 999); // Max 1000 events
  
  console.log('[Redis] Event published:', eventId);
}

// === Hämta nya events ===
// Anropas av /api/stream för att polla nya events
export async function pollEvents(since: number): Promise<unknown[]> {
  // Hämta senaste event-IDs
  const eventIds = await redis.lrange(`${CHANNEL}:queue`, 0, 49);
  
  const events: unknown[] = [];
  
  for (const eventId of eventIds) {
    const key = `${CHANNEL}:${eventId}`;
    const eventData = await redis.get(key);
    
    if (eventData) {
      const event = typeof eventData === 'string' 
        ? JSON.parse(eventData) 
        : eventData;
      
      // Filtrera på timestamp
      const eventTime = new Date(event.timestamp || 0).getTime();
      if (eventTime > since) {
        events.push(event);
      }
    }
  }
  
  return events;
}

// === Hjälpare för att testa anslutning ===
export async function testConnection(): Promise<boolean> {
  try {
    await redis.ping();
    console.log('[Redis] Connection OK');
    return true;
  } catch (error) {
    console.error('[Redis] Connection failed:', error);
    return false;
  }
}
