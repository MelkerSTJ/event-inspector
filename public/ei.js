/**
 * Event Inspector Tracking Script (ei.js)
 * Loads via GTM or direct script tag
 * Sends events to Event Inspector backend
 */
(function () {
  'use strict';

  // === Configuration ===
  var writeKey = window.__EI_WRITE_KEY__;
  var endpoint = window.__EI_ENDPOINT__ || 'https://event-inspector-pi.vercel.app/api/ingest';

  // === Debug logging ===
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

  // === Validate configuration ===
  if (!writeKey) {
    log('error', 'Missing writeKey! Set window.__EI_WRITE_KEY__ before loading ei.js');
    log('error', 'Current values:', {
      writeKey: writeKey,
      endpoint: endpoint
    });
    return;
  }

  log('info', 'Initialized with writeKey:', writeKey.substring(0, 8) + '...');
  log('info', 'Endpoint:', endpoint);

  // === Get session ID from URL ===
  function getSessionId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('ei_session') || null;
  }

  // === Generate event ID ===
  function generateEventId() {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }

  // === Track function ===
  function track(eventName, eventParams) {
    var sessionId = getSessionId();
    
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

    log('info', 'Tracking event:', eventName, payload);

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            log('error', 'Ingest failed (' + response.status + '):', text);
            if (response.status === 401) {
              log('error', 'WriteKey validation failed. Check that writeKey matches your project configuration.');
            }
          });
        } else {
          log('info', 'Event sent successfully:', eventName);
        }
      })
      .catch(function (error) {
        log('error', 'Network error:', error.message);
      });
  }

  // === Expose global track function ===
  window._ei_track = track;
  log('info', 'window._ei_track is now available');

  // === Auto-track page views ===
  function trackPageView() {
    track('page_view', {
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    });
  }

  // === SPA route change detection ===
  var lastUrl = window.location.href;

  function checkUrlChange() {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      log('info', 'SPA route change detected');
      trackPageView();
    }
  }

  // Listen for popstate (back/forward navigation)
  window.addEventListener('popstate', function () {
    setTimeout(checkUrlChange, 0);
  });

  // Intercept pushState and replaceState
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

  // Fallback: poll for URL changes (some SPAs use hash routing)
  setInterval(checkUrlChange, 1000);

  // === Initial page view ===
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }

  log('info', 'Event Inspector tracking active');
})();

