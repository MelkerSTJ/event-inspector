"use client";

import { useMemo, useState } from "react";
import { InstallSnippet } from "./install-snippet";

type Env = {
  id: string;
  name: string;
  status: "live" | "paused";
  writeKey: string;
};

type Project = {
  id: string;
  name: string;
  domain: string;
  environments: Env[];
};

export function ProjectInstallPanel({ project }: { project: Project }) {
  const [selectedEnvId, setSelectedEnvId] = useState<string>(
    project.environments[0]?.id ?? "prod"
  );

  const selectedEnv = useMemo(() => {
    return project.environments.find((e) => e.id === selectedEnvId) ?? project.environments[0];
  }, [project.environments, selectedEnvId]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5">
        <h3 className="text-sm font-semibold text-gray-900">Environment</h3>
        <p className="mt-1 text-sm text-gray-600">Välj vilken miljö du installerar mot.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          {project.environments.map((env) => {
            const isSelected = env.id === selectedEnvId;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => setSelectedEnvId(env.id)}
                className={[
                  "rounded-xl border px-4 py-3 text-left transition",
                  isSelected ? "border-black bg-gray-50" : "hover:bg-gray-50"
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">{env.name}</div>

                  <span
                    className={[
                      "rounded-md border px-2 py-0.5 text-xs font-semibold",
                      env.status === "live"
                        ? "border-green-200 bg-green-50 text-green-800"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    ].join(" ")}
                  >
                    {env.status}
                  </span>
                </div>

                {isSelected ? (
                  <div className="mt-2 text-xs font-semibold text-gray-900">Selected</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Här är fixen: InstallSnippet får writeKey från selectedEnv */}
      {selectedEnv ? <InstallSnippet writeKey={selectedEnv.writeKey} /> : null}
    </div>
  );
}
