(function () {
  try {
    var writeKey = window.__EI_WRITE_KEY__;
    var endpoint = window.__EI_ENDPOINT__ || "/api/ingest";

    if (!writeKey) {
      console.warn("[EI] Missing write key");
      return;
    }

    function randomId() {
      return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
    }

    function getSessionId() {
      try {
        var url = new URL(window.location.href);
        var q = url.searchParams.get("ei_session");
        if (q) {
          sessionStorage.setItem("__ei_session__", q);
          return q;
        }
        var stored = sessionStorage.getItem("__ei_session__");
        if (stored) return stored;

        var id = randomId();
        sessionStorage.setItem("__ei_session__", id);
        return id;
      } catch (e) {
        return randomId();
      }
    }

    var sessionId = getSessionId();

    function safeReadJson(res) {
      var ct = (res.headers && res.headers.get && res.headers.get("content-type")) || "";
      if (ct.indexOf("application/json") !== -1) return res.json();
      return res.text().then(function (t) {
        if (!t) return { ok: true };
        try {
          return JSON.parse(t);
        } catch (e) {
          return { ok: true, raw: t };
        }
      });
    }

    function send(name, params) {
      var payload = {
        writeKey: writeKey,
        name: name,
        url: window.location.href,
        params: params || {}
      };

      // ALWAYS include session
      payload.params.ei_session = sessionId;

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
    send("page_view", {
      title: document.title,
      referrer: document.referrer || null
    });

    // manual tracking
    window.__ei_track = function (name, params) {
      send(name, params || {});
    };

    console.debug("[EI] loaded", { endpoint: endpoint, sessionId: sessionId });
  } catch (e) {
    console.error("[EI] fatal error", e);
  }
})();
