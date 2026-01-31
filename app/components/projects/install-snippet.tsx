"use client";

import { useMemo, useState } from "react";

function toEiJsUrl(ingestEndpoint: string) {
  // ingestEndpoint förväntas vara typ: https://event-inspector-pi.vercel.app/api/ingest
  // Vi vill alltid ladda:               https://event-inspector-pi.vercel.app/ei.js
  try {
    const u = new URL(ingestEndpoint);
    u.pathname = "/ei.js";
    u.search = "";
    u.hash = "";
    return u.toString();
  } catch {
    // fallback: om någon råkar skicka "/api/ingest" relativt
    return "/ei.js";
  }
}

export function InstallSnippet({
  writeKey,
  endpoint
}: {
  writeKey: string;
  endpoint: string; // ingest endpoint
}) {
  const snippet = useMemo(() => {
    const safeWriteKey = String(writeKey).replace(/"/g, '\\"');
    const safeEndpoint = String(endpoint).replace(/"/g, '\\"');
    const eiJsUrl = toEiJsUrl(endpoint).replace(/"/g, '\\"');

    return `<script>
window.__EI_WRITE_KEY__ = "${safeWriteKey}";
window.__EI_ENDPOINT__ = "${safeEndpoint}";
</script>
<script async src="${eiJsUrl}"></script>`;
  }, [writeKey, endpoint]);

  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">Install</h3>
          <p className="mt-1 text-sm text-gray-600">
            Paste this into GTM (Custom HTML tag) or your CMS header.
          </p>
        </div>

        <button
          onClick={copy}
          className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
        {snippet}
      </pre>
    </div>
  );
}
