import { publish, type StreamEvent } from "app/lib/live/bus";
import { mockProjects } from "app/lib/projects/mock";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

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

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const writeKey = String(body?.writeKey ?? "");
    const name = String(body?.name ?? "");
    const url = String(body?.url ?? "");
    const params = (body?.params ?? {}) as Record<string, unknown>;

    if (!writeKey || !name || !url) {
      return json({ ok: false, error: "Missing writeKey, name or url" }, 400);
    }

    const found = findEnvByWriteKey(writeKey);
    if (!found) {
      return json({ ok: false, error: "Invalid writeKey" }, 401);
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

    return json({ ok: true }, 200);
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }
}
