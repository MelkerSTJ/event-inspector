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
        body: JSON.stringify(event),
        keepalive: true,
      })
        .then(function (res) {
          // vissa miljöer kan returnera tom body - skydda oss
          return res
            .json()
            .catch(function () {
              return { ok: res.ok };
            });
        })
        .then(function (json) {
          console.debug("[EI] ingest response", json);
        })
        .catch(function (err) {
          console.error("[EI] ingest error", err);
        });
    }

    function pageView() {
      send({
        writeKey: writeKey,
        name: "page_view",
        url: location.href,
        params: {
          title: document.title,
          referrer: document.referrer || null,
        },
      });
    }

    // ---- SPA route change support ----
    var lastUrl = location.href;
    function onUrlMaybeChanged() {
      if (location.href === lastUrl) return;
      lastUrl = location.href;
      pageView();
    }

    // patch pushState / replaceState
    var _pushState = history.pushState;
    history.pushState = function () {
      _pushState.apply(this, arguments);
      onUrlMaybeChanged();
    };

    var _replaceState = history.replaceState;
    history.replaceState = function () {
      _replaceState.apply(this, arguments);
      onUrlMaybeChanged();
    };

    window.addEventListener("popstate", onUrlMaybeChanged);

    // initial page_view
    pageView();

    // helper för manuell testning
    window.__ei_track = function (name, params) {
      send({
        writeKey: writeKey,
        name: name,
        url: location.href,
        params: params || {},
      });
    };

    console.debug("[EI] loaded");
  } catch (e) {
    console.error("[EI] fatal error", e);
  }
})();
