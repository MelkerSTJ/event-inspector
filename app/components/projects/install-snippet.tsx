"use client";

import { useState } from "react";

export function InstallSnippet({ writeKey }: { writeKey: string }) {
  const [copied, setCopied] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const snippet = `<script>
  window.__EI_WRITE_KEY__ = "${writeKey}";
  window.__EI_ENDPOINT__ = "${baseUrl}/api/ingest";
</script>
<script async src="${baseUrl}/ei.js"></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Install (GTM)</h3>
          <p className="mt-1 text-sm text-gray-600">
            Klistra in i <b>GTM → Tag → Custom HTML</b> och trigga på <b>All Pages</b>.
          </p>
        </div>

        <button
          onClick={copy}
          className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <pre className="mt-4 overflow-auto rounded-xl bg-gray-900 p-4 text-xs text-gray-100">
        {snippet}
      </pre>

      <p className="mt-3 text-xs text-gray-500">
        Just nu använder vi {baseUrl}. När du deployar byter du bara NEXT_PUBLIC_APP_URL.
      </p>
    </div>
  );
}
