(function () {
  try {
    var writeKey = window.__EI_WRITE_KEY__;
    var endpoint = window.__EI_ENDPOINT__ || "/api/ingest";

    if (!writeKey) {
      console.warn("[EI] Missing write key");
      return;
    }

    function send(event) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      })
        .then(function (res) { return res.json(); })
        .then(function (json) { console.debug("[EI] ingest response", json); })
        .catch(function (err) { console.error("[EI] ingest error", err); });
    }

    // auto page_view
    send({
      writeKey: writeKey,
      name: "page_view",
      url: location.href,
      params: {
        title: document.title,
        referrer: document.referrer || null
      }
    });

    // helper for manual testing
    window.__ei_track = function (name, params) {
      send({
        writeKey: writeKey,
        name: name,
        url: location.href,
        params: params || {}
      });
    };

    console.debug("[EI] loaded");
  } catch (e) {
    console.error("[EI] fatal error", e);
  }
})();
