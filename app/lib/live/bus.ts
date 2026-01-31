export type StreamEvent = {
  id: string;
  ts: number;
  projectId: string;
  envId: string;
  name: string;
  url: string;
  status: "ok" | "warn" | "error";
  message?: string;
  params: Record<string, unknown>;
};

type Subscriber = (evt: StreamEvent) => void;

const channels = new Map<string, Set<Subscriber>>();

export function channelKey(projectId: string, envId: string) {
  return `${projectId}:${envId}`;
}

export function subscribe(projectId: string, envId: string, fn: Subscriber) {
  const key = channelKey(projectId, envId);
  if (!channels.has(key)) channels.set(key, new Set());
  channels.get(key)!.add(fn);

  console.log(`[BUS] ✅ New subscriber for ${key}. Total: ${channels.get(key)!.size}`);

  return () => {
    channels.get(key)?.delete(fn);
    if (channels.get(key)?.size === 0) channels.delete(key);
    console.log(`[BUS] ❌ Unsubscribed from ${key}`);
  };
}

export function publish(evt: StreamEvent) {
  const key = channelKey(evt.projectId, evt.envId);
  const subs = channels.get(key);
  
  console.log(`[BUS] 📢 Publishing to ${key}. Subscribers: ${subs?.size || 0}`, {
    name: evt.name,
    url: evt.url,
    status: evt.status
  });

  if (!subs) {
    console.warn(`[BUS] ⚠️ No subscribers for ${key}`);
    return;
  }

  for (const fn of subs) fn(evt);
}