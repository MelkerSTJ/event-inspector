(function () {
  var WRITE_KEY = window.__EI_WRITE_KEY__;
  var ENDPOINT = window.__EI_ENDPOINT__;

  if (!WRITE_KEY || !ENDPOINT) return;

  function getSession() {
    try {
      return new URL(location.href).searchParams.get("ei_session") || "";
    } catch {
      return "";
    }
  }

  function send(name, params) {
    try {
      var payload = {
        writeKey: WRITE_KEY,
        name: name,
        url: location.href,
        params: params || {}
      };

      // koppla session om den finns
      var sid = getSession();
      if (sid) payload.params.ei_session = sid;

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function () {});
    } catch {}
  }

  // Exponera global
  window.ei_track = function (name, params) {
    send(name, params);
  };

  // auto page_view
  send("page_view", {});

  // SPA navigation hooks
  function hookHistory(fnName) {
    var orig = history[fnName];
    history[fnName] = function () {
      var res = orig.apply(this, arguments);
      send("page_view", { navigation: fnName });
      return res;
    };
  }

  hookHistory("pushState");
  hookHistory("replaceState");
  window.addEventListener("popstate", function () {
    send("page_view", { navigation: "popstate" });
  });
})();
