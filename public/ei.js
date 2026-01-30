(function () {
  try {
    var writeKey = window.__EI_WRITE_KEY__;
    var endpoint = window.__EI_ENDPOINT__ || "/api/ingest";

    if (!writeKey) {
      console.warn("[EI] Missing write key");
      return;
    }

    function getSessionId() {
      try {
        var url = new URL(window.location.href);
        var fromQuery = url.searchParams.get("ei_session");
        if (fromQuery) {
          sessionStorage.setItem("__ei_session__", fromQuery);
          return fromQuery;
        }

        var stored = sessionStorage.getItem("__ei_session__");
        if (stored) return stored;

        // simple random id
        var id =
          Math.random().toString(16).slice(2) +
          "-" +
          Date.now().toString(16);

        sessionStorage.setItem("__ei_session__", id);
        return id;
      } catch (e) {
        return "no-session";
      }
    }

    var sessionId = getSessionId();

    function safeReadJson(res) {
      // Some endpoints may return empty body. Avoid crashing.
      var ct = (res.headers && res.headers.get && res.headers.get("content-type")) || "";
      if (ct.indexOf("application/json") !== -1) return res.json();
      return res.text().then(function (t) {
        if (!t) return { ok: true };
        try {
          return JSON.parse(t);
        } catch {
          return { ok: true, raw: t };
        }
      });
    }

    function send(event) {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      })
        .then(function (res) {
          return safeReadJson(res);
        })
        .then(function (json) {
          console.debug("[EI] ingest response", json);
        })
        .catch(function (err) {
          console.error("[EI] ingest error", err);
        });
    }

    // auto page_view
    send({
      writeKey: writeKey,
      name: "page_view",
      url: location.href,
      params: {
        ei_session: sessionId,
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
        params: Object.assign({ ei_session: sessionId }, params || {})
      });
    };

    console.debug("[EI] loaded", { sessionId: sessionId, endpoint: endpoint });
  } catch (e) {
    console.error("[EI] fatal error", e);
  }
})();
