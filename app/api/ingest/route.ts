import { NextResponse } from "next/server";
import { mockProjects } from "app/lib/projects/mock";
import { bus } from "app/lib/live/bus";

type IngestPayload = {
  writeKey: string;
  name: string;
  url: string;
  params?: Record<string, unknown>;
};

function findEnvByWriteKey(writeKey: string) {
  for (const p of mockProjects) {
    for (const e of p.environments) {
      if (e.writeKey === writeKey) return { projectId: p.id, envId: e.id };
    }
  }
  return null;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as IngestPayload;

    if (!body?.writeKey) {
      return NextResponse.json(
        { ok: false, error: "Missing writeKey" },
        { status: 400 }
      );
    }

    const found = findEnvByWriteKey(body.writeKey);
    if (!found) {
      return NextResponse.json(
        { ok: false, error: "Invalid writeKey" },
        { status: 401 }
      );
    }

    const evt = {
      id: crypto.randomUUID(),
      ts: Date.now(),
      name: body.name ?? "unknown",
      url: body.url ?? "",
      status: "ok" as const,
      params: body.params ?? {}
    };

    // broadcasta till streamen
    bus.publish(found.projectId, found.envId, evt);

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*" }
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "Bad JSON" },
      { status: 400 }
    );
  }
}
