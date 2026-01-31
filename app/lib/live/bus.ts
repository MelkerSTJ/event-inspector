// app/lib/live/bus.ts

export type LiveEvent = {
  id: string;
  ts: number;
  name: string;
  url: string;
  status: "ok" | "warn" | "error";
  message?: string;
  params: Record<string, unknown>;
};

type Handler = (evt: LiveEvent) => void;

function key(projectId: string, envId: string) {
  return `${projectId}:${envId}`;
}

const channels = new Map<string, Set<Handler>>();

export const bus = {
  publish(projectId: string, envId: string, evt: LiveEvent) {
    const k = key(projectId, envId);
    const subs = channels.get(k);
    if (!subs || subs.size === 0) return;
    subs.forEach((fn) => {
      try {
        fn(evt);
      } catch {
        // ignore subscriber errors
      }
    });
  },

  subscribe(projectId: string, envId: string, fn: Handler) {
    const k = key(projectId, envId);
    let set = channels.get(k);
    if (!set) {
      set = new Set();
      channels.set(k, set);
    }
    set.add(fn);

    return () => {
      const curr = channels.get(k);
      if (!curr) return;
      curr.delete(fn);
      if (curr.size === 0) channels.delete(k);
    };
  }
};
