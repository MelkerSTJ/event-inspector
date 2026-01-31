"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Modal } from "app/components/common/modal";
import { projects as mockProjects, type Project, type Environment } from "app/lib/projects/mock";
import { CreateProjectForm } from "app/components/projects/create-project-form";

export default function ProjectsPage() {
  const [open, setOpen] = useState(false);

  // I v1 lägger vi till nya projekt bara i minnet (state)
  const [localProjects, setLocalProjects] = useState<Project[]>([]);

  const projects = useMemo(() => [...mockProjects, ...localProjects], [localProjects]);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Projects</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sites you track. Each project can have multiple environments.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          New project
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{p.name}</div>
                <div className="mt-1 text-sm text-gray-600">{p.domain}</div>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                {p.environments?.length ?? 0} env
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(p.environments ?? []).map((env: Environment) => (
                <span
                  key={env.id}
                  className={[
                    "rounded-md border px-2 py-1 text-xs",
                    env.status === "live"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-gray-200 bg-gray-50 text-gray-700",
                  ].join(" ")}
                >
                  {env.name} • {env.status}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <Modal open={open} title="Create project" onClose={() => setOpen(false)}>
        <CreateProjectForm
          existingIds={projects.map((p) => p.id)}
          onCancel={() => setOpen(false)}
          onCreate={(project) => {
            setLocalProjects((prev) => [project, ...prev]);
            setOpen(false);
          }}
        />
      </Modal>
    </div>
  );
}
