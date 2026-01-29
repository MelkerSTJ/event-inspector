(function () {
  // Läser writeKey från global (som vi redan visar i InstallSnippet)
  var WRITE_KEY = window.__EI_WRITE_KEY__;
  if (!WRITE_KEY) return;

  // Endpoint till din SaaS (just nu localhost, senare prod domän)
  var ENDPOINT = window.__EI_ENDPOINT__ || "/api/ingest";

  // Behöver finnas på alla GTM-sidor
  window.dataLayer = window.dataLayer || [];

  function safeString(v) {
    try {
      if (typeof v === "string") return v;
      return JSON.stringify(v);
    } catch (e) {
      return String(v);
    }
  }

  function send(payload) {
    try {
      payload.writeKey = WRITE_KEY;

      // use sendBeacon om möjligt (bra när man navigerar)
      var body = JSON.stringify(payload);

      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  function normalizeEvent(obj) {
    // dataLayer push brukar vara ett object med "event"
    // ex: { event: "add_to_cart", ecommerce: {...}, ... }
    var name = obj && obj.event ? String(obj.event) : "dataLayer_push";

    // bästa vi kan göra för URL
    var url = location && location.href ? location.href : "";

    // params = allt i obj, men vi tar bort event (och ev. stora grejer kan trimmas senare)
    var params = {};
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      if (k === "event") continue;
      params[k] = obj[k];
    }

    return { name: name, url: url, params: params };
  }

  // Hooka dataLayer.push
  var originalPush = window.dataLayer.push;
  window.dataLayer.push = function () {
    for (var i = 0; i < arguments.length; i++) {
      var item = arguments[i];

      // Bara objects är intressanta
      if (item && typeof item === "object") {
        var ev = normalizeEvent(item);

        // Skicka till ingest
        send({
          name: ev.name,
          url: ev.url,
          params: ev.params
        });
      } else {
        // om någon pushar string/annat
        send({
          name: "dataLayer_push",
          url: location.href,
          params: { value: safeString(item) }
        });
      }
    }

    return originalPush.apply(window.dataLayer, arguments);
  };

  // Optional: skicka page_view direkt när script laddar
  send({
    name: "page_view",
    url: location.href,
    params: { source: "ei.js" }
  });
})();
