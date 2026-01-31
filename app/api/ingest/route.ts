import { NextResponse } from "next/server";
import { mockProjects } from "app/lib/projects/mock";

type IngestPayload = {
  writeKey: string;
  name: string;
  url: string;
  params?: Record<string, unknown>;
};

function isValidWriteKey(writeKey: string) {
  for (const p of mockProjects) {
    for (const env of p.environments) {
      if (env.writeKey === writeKey) return { projectId: p.id, envId: env.id };
    }
  }
  return null;
}

export async function POST(req: Request) {
  let body: IngestPayload | null = null;

  try {
    body = (await req.json()) as IngestPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const writeKey = (body?.writeKey || "").trim();
  const name = (body?.name || "").trim();
  const url = (body?.url || "").trim();

  if (!writeKey || !name || !url) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const match = isValidWriteKey(writeKey);
  if (!match) {
    return NextResponse.json({ ok: false, error: "Invalid writeKey" }, { status: 401 });
  }

  // ✅ här kan du “broadcasta” till din SSE stream om du redan har det i minnet
  // Jag antar att du redan har stream-store i /api/stream.
  // Om du har en "publishEvent" funktion, kalla den här.

  return new NextResponse(null, { status: 204 });
}
