/* =============================================================
   בית אברהם — Share
   Wires up any [data-share-trigger] button. On click:
   1. Calls Supabase RPC create_self_link → returns a fresh short_code.
   2. Builds the URL and copies it to the clipboard.
   3. Shows a toast confirming the copy.
   ============================================================= */
(function () {
  const cfg = window.BV_CONFIG || {};
  const SITE_BASE = cfg.SITE_BASE_URL || location.origin;

  let inFlight = null;
  let cachedUrl = null;
  try { cachedUrl = sessionStorage.getItem('bv_share_url') || null; } catch (_) {}

  function ensureToastRoot() {
    let el = document.getElementById('bv-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bv-toast';
      el.className = 'bv-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    return el;
  }

  function showToast(message) {
    const el = ensureToastRoot();
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(el._hideTimer);
    el._hideTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  async function createShareLink() {
    if (cachedUrl) return cachedUrl;
    if (inFlight) return inFlight;
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      throw new Error('Supabase not configured');
    }

    const ctx = window.bvCtx || {};
    const url = `${cfg.SUPABASE_URL}/rest/v1/rpc/create_self_link`;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Profile': cfg.SUPABASE_SCHEMA || 'beit_avraham',
      'apikey': cfg.SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY
    };
    const body = JSON.stringify({
      p_session_id: ctx.session_id || null,
      p_current_short_code: ctx.short_code || null,
      p_name: null
    });

    inFlight = (async () => {
      try {
        const res = await fetch(url, { method: 'POST', headers, body });
        if (!res.ok) throw new Error('RPC failed: ' + res.status + ' ' + (await res.text()));
        const rows = await res.json();
        const code = Array.isArray(rows) ? rows[0]?.out_short_code : rows?.out_short_code;
        if (!code) throw new Error('No short_code returned');
        const shareUrl = `${SITE_BASE}/?r=${code}`;
        cachedUrl = shareUrl;
        try { sessionStorage.setItem('bv_share_url', shareUrl); } catch (_) {}
        return shareUrl;
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  }

  async function handleShareClick(button) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'יוצר לינק…';
    try {
      const url = await createShareLink();
      const copied = await copyToClipboard(url);
      if (copied) {
        showToast('הלינק הועתק ✨ שתפו עם מי שזה ידבר אליו');
      } else {
        showToast('הלינק שלכם: ' + url);
      }
    } catch (err) {
      console.error(err);
      showToast('משהו השתבש. נסו שוב או שלחו ל-avi@futureflow.co.il');
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function init() {
    const triggers = document.querySelectorAll('[data-share-trigger]');
    triggers.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleShareClick(btn);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
