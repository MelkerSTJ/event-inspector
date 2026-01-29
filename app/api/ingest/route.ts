import { publish, type StreamEvent } from "app/lib/live/bus";
import { mockProjects } from "app/lib/projects/mock";

function randomId() {
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

function findEnvByWriteKey(writeKey: string) {
  for (const p of mockProjects) {
    for (const env of p.environments) {
      if (env.writeKey === writeKey) {
        return { project: p, env };
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const writeKey = String(body?.writeKey ?? "");
    const name = String(body?.name ?? "");
    const url = String(body?.url ?? "");
    const params = (body?.params ?? {}) as Record<string, unknown>;

    if (!writeKey || !name || !url) {
      return Response.json(
        { ok: false, error: "Missing writeKey, name or url" },
        { status: 400 }
      );
    }

    const found = findEnvByWriteKey(writeKey);
    if (!found) {
      return Response.json({ ok: false, error: "Invalid writeKey" }, { status: 401 });
    }

    // superenkel v1 “validering”
    let status: StreamEvent["status"] = "ok";
    let message: string | undefined;

    if (name === "add_to_cart" && params?.currency == null) {
      status = "warn";
      message = "Missing param: currency";
    }
    if (name === "purchase" && params?.transaction_id == null) {
      status = "error";
      message = "Missing param: transaction_id";
    }

    const evt: StreamEvent = {
      id: randomId(),
      ts: Date.now(),
      projectId: found.project.id,
      envId: found.env.id,
      name,
      url,
      status,
      message,
      params
    };

    publish(evt);

    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
}
