"use client";

import { useMemo, useState } from "react";
import type { Project } from "app/lib/projects/mock";
import { InstallSnippet } from "app/components/projects/install-snippet";

const EI_INGEST_ENDPOINT = "https://event-inspector-pi.vercel.app/api/ingest";

export function ProjectInstallPanel({ project }: { project: Project }) {
  const defaultEnvId = project.environments[0]?.id ?? "prod";
  const [selectedEnvId, setSelectedEnvId] = useState(defaultEnvId);

  const selectedEnv = useMemo(() => {
    return (
      project.environments.find((e) => e.id === selectedEnvId) ??
      project.environments[0] ??
      null
    );
  }, [project.environments, selectedEnvId]);

  const appUrl = useMemo(() => {
    // NEXT_PUBLIC_EI_APP_URL kan du sätta i .env.local / Vercel
    const fromEnv = process.env.NEXT_PUBLIC_EI_APP_URL?.trim();
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    // fallback för dev
    return "http://localhost:3000";
  }, []);

  if (!selectedEnv) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border bg-white p-5">
        <h3 className="font-semibold text-gray-900">Environments</h3>
        <p className="mt-1 text-sm text-gray-600">
          Pick an environment to view its write key and install snippet.
        </p>

        <div className="mt-4 space-y-2">
          {project.environments.map((env) => {
            const isSelected = env.id === selectedEnvId;

            return (
              <button
                key={env.id}
                type="button"
                onClick={() => setSelectedEnvId(env.id)}
                className={[
                  "w-full rounded-lg border p-3 text-left transition",
                  isSelected ? "border-black bg-gray-50" : "hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {env.name}
                    </div>
                    <div className="text-xs text-gray-600">
                      Status: {env.status}
                    </div>
                    <div className="mt-2 font-mono text-xs text-gray-800">
                      {env.writeKey}
                    </div>
                  </div>

                  <span
                    className={[
                      "rounded-md border px-2 py-1 text-xs font-semibold",
                      env.status === "live"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-gray-200 bg-gray-50 text-gray-700",
                    ].join(" ")}
                  >
                    {env.status}
                  </span>
                </div>

                {isSelected ? (
                  <div className="mt-3 text-xs font-semibold text-gray-900">
                    Selected
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <InstallSnippet
        writeKey={selectedEnv.writeKey}
        appUrl={appUrl}
        ingestEndpoint={EI_INGEST_ENDPOINT}
      />
    </div>
  );
}
