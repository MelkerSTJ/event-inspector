/**
 * Event Inspector Tracking Script (ei.js)
 * v2.0 - Fixed initialization order
 */
(function () {
  'use strict';

  // === STEG 1: Skapa en event-kö DIREKT ===
  // Detta garanterar att window._ei_track alltid existerar,
  // även om config inte är satt än
  var eventQueue = [];
  var isInitialized = false;

  // Stub-funktion som köar events
  window._ei_track = function(eventName, eventParams) {
    if (isInitialized) {
      // Om initierad, skicka direkt
      sendEvent(eventName, eventParams);
    } else {
      // Annars, lägg i kö
      eventQueue.push({ name: eventName, params: eventParams });
      console.log('[EI.js] Queued event (waiting for init):', eventName);
    }
  };

  console.log('[EI.js] window._ei_track stub created');

  // === STEG 2: Läs config ===
  var writeKey = window.__EI_WRITE_KEY__;
  var endpoint = window.__EI_ENDPOINT__ || 'https://event-inspector-pi.vercel.app/api/ingest';

  // === Hjälpfunktioner ===
  function log(level, message, data) {
    var prefix = '[EI.js]';
    if (level === 'error') {
      console.error(prefix, message, data || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(prefix, message, data || '');
    }
  }

  function getSessionId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('ei_session') || null;
  }

  function generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // === STEG 3: Validera config ===
  if (!writeKey) {
    log('error', 'Missing writeKey! Set window.__EI_WRITE_KEY__ before loading ei.js');
    log('error', 'Events will be queued but NOT sent until writeKey is set.');
    // NOTERA: Vi gör INTE return här längre!
    // window._ei_track finns redan och köar events
    return;
  }

  log('info', 'Initialized with writeKey:', writeKey.substring(0, 8) + '...');
  log('info', 'Endpoint:', endpoint);

  // === STEG 4: Faktisk send-funktion ===
  function sendEvent(eventName, eventParams) {
    var sessionId = getSessionId();

    if (!sessionId) {
      log('warn', 'No ei_session in URL, skipping event:', eventName);
      return;
    }

    var payload = {
      writeKey: writeKey,
      name: eventName,
      url: window.location.href,
      params: Object.assign({}, eventParams || {}, {
        ei_session: sessionId,
        page_title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        event_id: generateEventId(),
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      })
    };

    log('info', 'Sending event:', eventName);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors'
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            log('error', 'Ingest failed (' + response.status + '):', text);
          });
        } else {
          log('info', 'Event sent successfully:', eventName);
        }
      })
      .catch(function (error) {
        log('error', 'Network error:', error.message);
      });
  }

  // === STEG 5: Markera som initierad och töm kön ===
  isInitialized = true;
  
  // Ersätt stub med riktig funktion
  window._ei_track = function(eventName, eventParams) {
    sendEvent(eventName, eventParams);
  };

  // Skicka köade events
  log('info', 'Processing queued events:', eventQueue.length);
  eventQueue.forEach(function(item) {
    sendEvent(item.name, item.params);
  });
  eventQueue = [];

  // === STEG 6: Auto-track page views ===
  function trackPageView() {
    window._ei_track('page_view', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
  }

  // SPA-stöd
  var lastUrl = window.location.href;

  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      log('info', 'SPA route change detected');
      trackPageView();
    }
  }

  window.addEventListener('popstate', function () {
    setTimeout(checkUrlChange, 0);
  });

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    setTimeout(checkUrlChange, 0);
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    setTimeout(checkUrlChange, 0);
  };

  setInterval(checkUrlChange, 1000);

  // Initial page view
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }

  log('info', 'Event Inspector tracking active');
})();
