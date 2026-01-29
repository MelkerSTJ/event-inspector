import Link from "next/link";
import { getProjectById } from "app/lib/projects/mock";
import { ProjectInstallPanel } from "app/components/projects/project-install-panel";


export default async function ProjectPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = getProjectById(projectId);

  if (!project) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Project not found</h2>
        <p className="mt-2 text-gray-600">
          We couldn’t find a project with id: <span className="font-mono">{projectId}</span>
        </p>
        <Link href="/projects" className="mt-6 inline-block underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">{project.name}</h2>
          <p className="mt-2 text-sm text-gray-600">{project.domain}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.environments.map((env) => (
              <span
                key={env.id}
                className={[
                  "rounded-md border px-2 py-1 text-xs",
                  env.status === "live"
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-gray-200 bg-gray-50 text-gray-700"
                ].join(" ")}
              >
                {env.name} • {env.status}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/projects/${project.id}/live`}
          className="rounded-md bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
        >
          Open Live
        </Link>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-gray-900">Environments</h3>
          <p className="mt-1 text-sm text-gray-600">
            Each environment has its own write key.
          </p>

          <div className="mt-4 space-y-2">
            {project.environments.map((env) => (
              <div
                key={env.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">{env.name}</div>
                  <div className="text-xs text-gray-600">Status: {env.status}</div>
                  <div className="mt-2 font-mono text-xs text-gray-800">
                    {env.writeKey}
                  </div>
                </div>

                <button className="rounded-md border px-3 py-1 text-xs font-semibold hover:bg-gray-50">
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
  <ProjectInstallPanel project={project} />
</div>

      </div>
    </div>
  );
}
