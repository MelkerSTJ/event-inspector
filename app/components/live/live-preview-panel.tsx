"use client";

import { useMemo, useState } from "react";
import { LiveFeed } from "app/components/live/live-feed";

function randomSessionId() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function toHttpsUrl(domain: string) {
  const d = domain.trim();
  if (!d) return "";
  if (d.startsWith("http://") || d.startsWith("https://")) return d;
  return `https://${d}`;
}

export function LivePreviewPanel({
  projectId,
  projectDomain,
  environments
}: {
  projectId: string;
  projectDomain: string;
  environments: Array<{ id: string; name: string; status: "live" | "paused"; writeKey: string }>;
}) {
  const [sessionId, setSessionId] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const base = useMemo(() => toHttpsUrl(projectDomain), [projectDomain]);

  function start() {
    const sid = randomSessionId();
    setSessionId(sid);

    const url = `${base}/?ei_session=${encodeURIComponent(sid)}`;
    setPreviewUrl(url);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Live preview</div>
            <div className="mt-1 text-sm text-gray-600">
              Starts a session and opens the site in an iframe. Events are filtered by that session.
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={!base}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold text-white",
              base ? "bg-black hover:bg-black/90" : "bg-black/40 cursor-not-allowed"
            ].join(" ")}
          >
            Start live preview
          </button>
        </div>

        <div className="mt-3 text-xs text-gray-700">
          Target: <span className="font-mono">{base || "(missing domain)"}</span>
        </div>
        {sessionId ? (
          <div className="mt-2 text-xs text-gray-700">
            Session: <span className="font-mono">{sessionId}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="border-b p-3 text-sm font-semibold text-gray-900">Site</div>

          {previewUrl ? (
            <iframe
              title="Live preview"
              src={previewUrl}
              className="h-[75vh] w-full"
            />
          ) : (
            <div className="p-8 text-sm text-gray-600">
              Click <span className="font-semibold">Start live preview</span> to open the site.
            </div>
          )}
        </div>

        <div>
          <LiveFeed
            projectId={projectId}
            environments={environments}
            sessionFilter={sessionId}
            onSessionFilterChange={(v) => setSessionId(v)}
          />
        </div>
      </div>
    </div>
  );
}
