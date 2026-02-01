"use client";

import { useMemo } from "react";

type InstallSnippetProps = {
  writeKey: string;
  appUrl: string; // <- NU finns den
  ingestEndpoint?: string; // valfritt men nice
};

export function InstallSnippet({
  writeKey,
  appUrl,
  ingestEndpoint = "/api/ingest",
}: InstallSnippetProps) {
  const snippet = useMemo(() => {
    const safeAppUrl = appUrl?.trim().replace(/\/$/, "");
    const safeIngest =
      ingestEndpoint.startsWith("http") ? ingestEndpoint : `${safeAppUrl}${ingestEndpoint}`;

    return `<!-- Event Inspector -->
<script>
  (function () {
    var EI_WRITE_KEY = ${JSON.stringify(writeKey)};
    var EI_INGEST = ${JSON.stringify(safeIngest)};

    function send(payload) {
      try {
        var body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
          navigator.sendBeacon(EI_INGEST, body);
          return;
        }
        fetch(EI_INGEST, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body,
          keepalive: true
        }).catch(function(){});
      } catch (e) {}
    }

    // basic page_view
    send({
      type: "event",
      writeKey: EI_WRITE_KEY,
      name: "page_view",
      url: location.href,
      timestamp: new Date().toISOString(),
      params: {
        page_title: document.title,
        referrer: document.referrer || null
      }
    });

    // basic click tracking
    document.addEventListener("click", function (e) {
      var el = e.target && e.target.closest ? e.target.closest("a,button") : null;
      if (!el) return;

      send({
        type: "event",
        writeKey: EI_WRITE_KEY,
        name: "click",
        url: location.href,
        timestamp: new Date().toISOString(),
        params: {
          tag: el.tagName,
          text: (el.innerText || "").slice(0, 120),
          href: el.getAttribute && el.getAttribute("href")
        }
      });
    }, { capture: true });
  })();
</script>`;
  }, [writeKey, appUrl, ingestEndpoint]);

  return (
    <div className="rounded-xl border bg-white p-5">
      <h3 className="font-semibold text-gray-900">Install snippet</h3>
      <p className="mt-1 text-sm text-gray-600">
        Paste this into the <span className="font-mono">{"<head>"}</span> of your site.
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">
        {snippet}
      </pre>
    </div>
  );
}
