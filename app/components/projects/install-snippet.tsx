"use client";

import { useMemo, useState } from "react";

export function InstallSnippet({
  writeKey,
  endpoint
}: {
  writeKey: string;
  endpoint: string;
}) {
  const snippet = useMemo(() => {
    // IMPORTANT:
    // - write key + endpoint set as globals
    // - then we load your hosted script /ei.js
    const safeWriteKey = writeKey.replace(/"/g, '\\"');
    const safeEndpoint = endpoint.replace(/"/g, '\\"');

    return `<script>
window.__EI_WRITE_KEY__ = "${safeWriteKey}";
window.__EI_ENDPOINT__ = "${safeEndpoint}";
</script>
<script async src="${new URL("/ei.js", endpoint).toString().replace("/api/ingest/ei.js", "/ei.js").replace("/api/ingest", "/ei.js")}"></script>`;
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
