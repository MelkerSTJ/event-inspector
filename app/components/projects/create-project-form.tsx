"use client";

import { useMemo, useState } from "react";
import type { Project } from "app/lib/projects/mock"

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/\/.*$/g, "");
}

function looksLikeDomain(domain: string) {
  return domain.includes(".") && !domain.includes(" ");
}

function Field({
  label,
  hint,
  error,
  children
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-semibold text-gray-900">{label}</label>
        {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
      {error ? <div className="mt-2 text-sm text-red-600">{error}</div> : null}
    </div>
  );
}

export function CreateProjectForm({
  existingIds,
  onCreate,
  onCancel
}: {
  existingIds: string[];
  onCreate: (project: Project) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [includeStaging, setIncludeStaging] = useState(true);

  const [touched, setTouched] = useState<{ name: boolean; domain: boolean }>({
    name: false,
    domain: false
  });

  const computedId = useMemo(() => slugify(name) || "new-project", [name]);

  const errors = useMemo(() => {
    const e: { name?: string; domain?: string; id?: string } = {};

    if (!name.trim()) e.name = "Project name is required.";

    const nd = normalizeDomain(domain);
    if (!nd) e.domain = "Domain is required.";
    else if (!looksLikeDomain(nd)) e.domain = "Enter a valid domain (e.g. jacson.se).";

    if (existingIds.includes(computedId)) {
      e.id = "A project with this id already exists. Try a different name.";
    }

    return e;
  }, [name, domain, computedId, existingIds]);

  const canSubmit = Object.keys(errors).length === 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, domain: true });
    if (!canSubmit) return;

    const envs: Project["environments"] = [
      { id: "prod", name: "Production", status: "live" }
    ];
    if (includeStaging) envs.push({ id: "stage", name: "Staging", status: "paused" });

    const project: Project = {
      id: computedId,
      name: name.trim(),
      domain: normalizeDomain(domain),
      environments: envs
    };

    onCreate(project);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field
        label="Project name"
        hint="Shown in the UI"
        error={touched.name ? errors.name : undefined}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
          placeholder="e.g. Jacson"
        />
      </Field>

      <Field
        label="Domain"
        hint="No https://"
        error={touched.domain ? errors.domain : undefined}
      >
        <input
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, domain: true }))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
          placeholder="e.g. jacson.se"
        />
      </Field>

      <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3">
        <input
          id="staging"
          type="checkbox"
          checked={includeStaging}
          onChange={(e) => setIncludeStaging(e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="staging" className="text-sm font-medium text-gray-900">
          Include Staging environment
        </label>
        <span className="ml-auto text-xs text-gray-600">
          (recommended)
        </span>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="text-xs font-semibold text-gray-700">Generated project id</div>
        <div className="mt-2 rounded-lg bg-gray-900 px-3 py-2 font-mono text-sm text-gray-100">
          {computedId}
        </div>
        {errors.id ? <div className="mt-2 text-sm text-red-600">{errors.id}</div> : null}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          className={[
            "rounded-lg px-4 py-2 text-sm font-semibold text-white",
            canSubmit ? "bg-black hover:bg-black/90" : "bg-black/40 cursor-not-allowed"
          ].join(" ")}
        >
          Create
        </button>
      </div>
    </form>
  );
}
