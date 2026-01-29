"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type LiveEvent = {
  id: string;
  ts: number;
  name: string;
  url: string;
  status: "ok" | "warn" | "error";
  message?: string;
  params: Record<string, unknown>;
};

type IngestPayload = {
  writeKey: string;
  name: string;
  url: string;
  params: Record<string, unknown>;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function badgeClasses(status: LiveEvent["status"]) {
  if (status === "ok") return "border-green-200 bg-green-50 text-green-800";
  if (status === "warn") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function buildSamplePayload(projectId: string, envId: string): Omit<IngestPayload, "writeKey"> {
  const urlPool = ["/", "/category/wintersale", "/product/jacket-123", "/cart", "/checkout"] as const;
  const names = ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"] as const;

  const name = names[Math.floor(Math.random() * names.length)];
  const path = urlPool[Math.floor(Math.random() * urlPool.length)];

  const params: Record<string, unknown> = {
    projectId,
    envId,
    item_id: name === "view_item" || name === "add_to_cart" ? "sku_259686" : undefined,
    value: name === "purchase" ? 1299 : name === "add_to_cart" ? 649 : undefined
  };

  // medvetet “ibland fel” så du ser warn/error
  if (name === "add_to_cart") {
    if (Math.random() < 0.4) params.currency = undefined; // warn
    else params.currency = "SEK";
  } else if (name === "purchase") {
    params.currency = "SEK";
    if (Math.random() < 0.3) params.transaction_id = undefined; // error
    else params.transaction_id = "t_" + Date.now();
  } else {
    params.currency = "SEK";
  }

  return {
    name,
    url: `https://${projectId}.example.com${path}`,
    params
  };
}

export function LiveFeed({
  projectId,
  environments
}: {
  projectId: string;
  environments: Array<{
    id: string;
    name: string;
    status: "live" | "paused";
    writeKey: string;
  }>;
}) {
  const defaultEnvId = environments[0]?.id ?? "prod";
  const [envId, setEnvId] = useState(defaultEnvId);

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selected, setSelected] = useState<LiveEvent | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  const env = useMemo(
    () => environments.find((e) => e.id === envId) ?? environments[0],
    [environments, envId]
  );

  // SSE: koppla upp vid envId
  useEffect(() => {
  // stäng tidigare stream om den finns
  esRef.current?.close();

  const es = new EventSource(`/api/stream?projectId=${projectId}&envId=${envId}`);
  esRef.current = es;

  es.onopen = () => setConnected(true);

  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      if (data?.type === "event" && data?.evt) {
        const evt = data.evt as LiveEvent;
        setEvents((prev) => [evt, ...prev].slice(0, 200));
      }
    } catch {
      // ignore
    }
  };

  es.onerror = () => setConnected(false);

  return () => {
    es.close();
  };
}, [projectId, envId]);


  const filtered = useMemo(() => {
    const nf = nameFilter.trim().toLowerCase();
    const uf = urlFilter.trim().toLowerCase();

    return events.filter((e) => {
      const okName = !nf || e.name.toLowerCase().includes(nf);
      const okUrl = !uf || e.url.toLowerCase().includes(uf);
      return okName && okUrl;
    });
  }, [events, nameFilter, urlFilter]);

  async function sendTestEvent() {
    const base = buildSamplePayload(projectId, envId);

    const payload: IngestPayload = {
      writeKey: env.writeKey,
      ...base
    };

    await fetch("/api/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  function clear() {
    setEvents([]);
    setSelected(null);
  }

  function changeEnv(nextEnvId: string) {
    // reset sker här istället för i useEffect (eslint blir glad)
    setEvents([]);
    setSelected(null);
    setEnvId(nextEnvId);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Environment</span>

            <div className="flex gap-2">
              {environments.map((e) => {
                const active = e.id === envId;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => changeEnv(e.id)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                      active
                        ? "border-black bg-gray-50 text-gray-900"
                        : "text-gray-700 hover:bg-gray-50"
                    ].join(" ")}
                  >
                    {e.name}
                    <span className="ml-2 text-xs font-semibold text-gray-500">
                      {e.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  connected ? "bg-green-500" : "bg-gray-400"
                ].join(" ")}
              />
              {connected ? "Connected" : "Connecting…"}
            </span>

            <button
              onClick={sendTestEvent}
              className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
            >
              Send test event
            </button>

            <button
              onClick={clear}
              className="rounded-lg border px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-gray-700">Filter by event name</div>
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              placeholder="e.g. add_to_cart"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-700">Filter by URL contains</div>
            <input
              value={urlFilter}
              onChange={(e) => setUrlFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              placeholder="e.g. /checkout"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border bg-white">
          <div className="flex items-center justify-between border-b p-4">
            <div>
              <div className="text-sm font-semibold text-gray-900">Live events</div>
              <div className="mt-1 text-sm text-gray-600">
                Showing {filtered.length} of {events.length} (latest first)
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-lg font-semibold text-gray-900">Waiting for events</div>
              <div className="mt-2 text-sm text-gray-600">
                Use <span className="font-semibold">Send test event</span> to verify the pipeline.
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((e) => {
                const active = selected?.id === e.id;
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelected(e)}
                    className={[
                      "w-full text-left p-4 transition",
                      active ? "bg-gray-50" : "hover:bg-gray-50"
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{e.name}</span>
                          <span
                            className={[
                              "rounded-md border px-2 py-0.5 text-xs font-semibold",
                              badgeClasses(e.status)
                            ].join(" ")}
                          >
                            {e.status.toUpperCase()}
                          </span>
                          {e.message ? (
                            <span className="text-xs font-semibold text-gray-600">{e.message}</span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">{e.url}</div>
                      </div>

                      <div className="text-xs font-semibold text-gray-600">{formatTime(e.ts)}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white">
          <div className="border-b p-4">
            <div className="text-sm font-semibold text-gray-900">Event details</div>
            <div className="mt-1 text-sm text-gray-600">
              {selected ? "Inspect payload and params." : "Select an event from the feed."}
            </div>
          </div>

          {selected ? (
            <div className="p-4">
              <div className="text-xs font-semibold text-gray-700">Name</div>
              <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900">
                {selected.name}
              </div>

              <div className="mt-4 text-xs font-semibold text-gray-700">URL</div>
              <div className="mt-1 rounded-lg border bg-gray-50 px-3 py-2 font-mono text-xs text-gray-900 break-all">
                {selected.url}
              </div>

              <div className="mt-4 text-xs font-semibold text-gray-700">Params</div>
              <pre className="mt-1 max-h-80 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                {JSON.stringify(selected.params, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-600">No event selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}
