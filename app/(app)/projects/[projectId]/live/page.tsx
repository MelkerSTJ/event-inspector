import Link from "next/link";

export default async function ProjectLivePage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Live</h2>
          <p className="mt-2 text-muted-foreground">
            Project: <span className="font-mono">{projectId}</span>
          </p>
        </div>

        <Link href={`/projects/${projectId}`} className="underline">
          Back
        </Link>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-5">
        <p className="text-sm text-muted-foreground">
          Next step: stream incoming events here (SSE). For now this is a placeholder.
        </p>
      </div>
    </div>
  );
}
