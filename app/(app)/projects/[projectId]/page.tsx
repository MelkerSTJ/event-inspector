import Link from "next/link";
import { getProjectById } from "app/lib/projects/mock";

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
        <p className="mt-2 text-sm text-gray-600">
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
        </div>

        <Link
          href={`/projects/${project.id}/live`}
          className="rounded-md bg-black px-4 py-2 text-sm text-white"
        >
          Open Live
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Environments</h3>
          <div className="mt-3 space-y-2">
            {project.environments.map((env) => (
              <div key={env.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">{env.name}</div>
                  <div className="text-xs text-gray-600">Status: {env.status}</div>
                </div>

                <button className="rounded-md border px-3 py-1 text-xs hover:bg-gray-50">
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">Install</h3>
          <p className="mt-2 text-sm text-gray-600">
            Later this page will show your install snippet and environment write keys.
          </p>

          <pre className="mt-4 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
{`<script>
  window.__EI_WRITE_KEY__ = "wk_${project.id}_prod_xxx";
</script>
<script async src="https://cdn.eventinspector.io/ei.js"></script>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
