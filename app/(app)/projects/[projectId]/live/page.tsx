import Link from "next/link";
import { getProjectById } from "app/lib/projects/mock";
import { LivePreviewPanel } from "app/components/live/live-preview-panel";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectLivePage({ params }: Props) {
  const { projectId } = await params;

  const project = getProjectById(projectId);

  if (!project) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Project not found</h2>
        <p className="mt-2 text-gray-600">
          Received projectId: <span className="font-mono">{projectId}</span>
        </p>
        <Link href="/projects" className="mt-6 inline-block underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const envs = project.environments.map((e) => ({
    id: e.id,
    name: e.name,
    status: e.status,
    writeKey: e.writeKey,
  }));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Live</h2>
          <p className="mt-2 text-sm text-gray-600">
            Project: <span className="font-mono">{project.id}</span> •{" "}
            {project.domain}
          </p>
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Back to project
        </Link>
      </div>

      <div className="mt-6">
        <LivePreviewPanel projectId={project.id} environments={envs} />
      </div>
    </div>
  );
}
