"use client";

import { useMemo, useState } from "react";

export function InstallSnippet({ writeKey }: { writeKey: string }) {
  const snippet = useMemo(() => {
    const APP_URL =
      process.env.NEXT_PUBLIC_EI_APP_URL?.replace(/\/$/, "") ||
      "http://localhost:3000";

    return `<script>
window.__EI_WRITE_KEY__ = "${writeKey}";
window.__EI_ENDPOINT__ = "${APP_URL}/api/ingest";
</script>
<script async src="${APP_URL}/ei.js"></script>`;
  }, [writeKey]);

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
            Paste this into GTM (Custom HTML tag) or your site header.
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
