/* =============================================================
   בית אברהם — Tracking
   - Reads ?r= short_code from URL (if present), persists to localStorage.
   - Generates a stable session UUID per browser, persists to localStorage.
   - Writes a page-view row directly to Supabase (anon insert).
   - Exposes window.bvCtx = { short_code, session_id } for other scripts.

   Note: silent catch (_) blocks below — localStorage and fetch may
   throw in Safari private mode or locked-down browsers. Tracking must
   never break the site, so failures are swallowed.
   ============================================================= */
(function () {
  const cfg = window.BV_CONFIG || {};

  // Capture incoming short_code from URL — sticky across navigation
  const params = new URLSearchParams(location.search);
  const incoming = params.get('r');
  if (incoming) {
    try { localStorage.setItem('bv_ref', incoming); } catch (_) {}
  }

  let ref = null;
  let sid = null;
  try {
    ref = localStorage.getItem('bv_ref');
    sid = localStorage.getItem('bv_sid');
    if (!sid) {
      sid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem('bv_sid', sid);
    }
  } catch (_) {
    sid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
  }

  window.bvCtx = { short_code: ref || null, session_id: sid };

  // Direct insert to Supabase visits table
  if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY) {
    const url = `${cfg.SUPABASE_URL}/rest/v1/visits`;
    const payload = JSON.stringify({
      short_code: ref || null,
      session_id: sid,
      page: location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Profile': cfg.SUPABASE_SCHEMA || 'beit_avraham',
      'apikey': cfg.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
      'Prefer': 'return=minimal'
    };

    try {
      // sendBeacon doesn't support custom headers → use fetch with keepalive
      fetch(url, { method: 'POST', headers, body: payload, keepalive: true }).catch(() => {});
    } catch (_) {
      // Tracking must never break the site
    }
  }
})();
