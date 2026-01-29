"use client";

import { useMemo, useState } from "react";

export type LiveEvent = {
  id: string;
  ts: number; // epoch ms
  name: string;
  url: string;
  status: "ok" | "warn" | "error";
  message?: string;
  params: Record<string, unknown>;
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function badgeClasses(status: LiveEvent["status"]) {
  if (status === "ok") return "border-green-200 bg-green-50 text-green-800";
  if (status === "warn") return "border-yellow-200 bg-yellow-50 text-yellow-800";
  return "border-red-200 bg-red-50 text-red-800";
}

function randomId() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function sampleEvent(projectId: string, envId: string): LiveEvent {
  const urlPool = [
    "/",
    "/category/wintersale",
    "/product/jacson-jacket-123",
    "/cart",
    "/checkout"
  ];
  const names = ["page_view", "view_item", "add_to_cart", "begin_checkout", "purchase"];
  const name = names[Math.floor(Math.random() * names.length)];
  const url = urlPool[Math.floor(Math.random() * urlPool.length)];

  // lite “realistisk” statuslogik:
  let status: LiveEvent["status"] = "ok";
  let message: string | undefined;

  if (name === "add_to_cart") {
    // ibland saknar currency
    const missing = Math.random() < 0.35;
    status = missing ? "warn" : "ok";
    message = missing ? "Missing param: currency" : undefined;
  }
  if (name === "purchase") {
    // ibland error
    const bad = Math.random() < 0.25;
    status = bad ? "error" : "ok";
    message = bad ? "Missing param: transaction_id" : undefined;
  }

  return {
    id: randomId(),
    ts: Date.now(),
    name,
    url: `https://${projectId}.example.com${url}`,
    status,
    message,
    params: {
      projectId,
      envId,
      item_id: name === "view_item" || name === "add_to_cart" ? "sku_259686" : undefined,
      value: name === "purchase" ? 1299 : name === "add_to_cart" ? 649 : undefined,
      currency: status === "warn" ? undefined : "SEK"
    }
  };
}

export function LiveFeed({
  projectId,
  environments
}: {
  projectId: string;
  environments: Array<{ id: string; name: string; status: "live" | "paused" }>;
}) {
  const defaultEnv = environments[0]?.id ?? "prod";
  const [envId, setEnvId] = useState(defaultEnv);

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [selected, setSelected] = useState<LiveEvent | null>(null);

  const [nameFilter, setNameFilter] = useState("");
  const [urlFilter, setUrlFilter] = useState("");

  const filtered = useMemo(() => {
    const nf = nameFilter.trim().toLowerCase();
    const uf = urlFilter.trim().toLowerCase();

    return events.filter((e) => {
      const okName = !nf || e.name.toLowerCase().includes(nf);
      const okUrl = !uf || e.url.toLowerCase().includes(uf);
      return okName && okUrl;
    });
  }, [events, nameFilter, urlFilter]);

  function simulateOne() {
    const e = sampleEvent(projectId, envId);
    setEvents((prev) => [e, ...prev].slice(0, 200));
  }

  function clear() {
    setEvents([]);
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      {/* Top controls */}
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Environment</span>

            <div className="flex gap-2">
              {environments.map((env) => {
                const active = env.id === envId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setEnvId(env.id)}
                    className={[
                      "rounded-lg border px-3 py-1.5 text-sm font-semibold transition",
                      active ? "border-black bg-gray-50 text-gray-900" : "text-gray-700 hover:bg-gray-50"
                    ].join(" ")}
                  >
                    {env.name}
                    <span className="ml-2 text-xs font-semibold text-gray-500">
                      {env.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-800">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Connected
            </span>

            <button
              onClick={simulateOne}
              className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
            >
              Simulate event
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

      {/* Main */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Feed */}
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
                Click around on the site or use <span className="font-semibold">Simulate event</span>.
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
                          <span className={["rounded-md border px-2 py-0.5 text-xs font-semibold", badgeClasses(e.status)].join(" ")}>
                            {e.status.toUpperCase()}
                          </span>
                          {e.message ? (
                            <span className="text-xs font-semibold text-gray-600">
                              {e.message}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">{e.url}</div>
                      </div>

                      <div className="text-xs font-semibold text-gray-600">
                        {formatTime(e.ts)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Details */}
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
              <pre className="mt-1 max-h-[320px] overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                {JSON.stringify(selected.params, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-600">
              No event selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
