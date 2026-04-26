/* =============================================================
   בית אברהם — Forms JavaScript
   Submits directly to Supabase (anon insert into beit_avraham.submissions).
   A DB trigger forwards the submission to n8n which sends WhatsApp + Email alerts.
   ============================================================= */

function initForm({ formId, submitId, successId, errorId, type }) {
  const form = document.getElementById(formId);
  const submit = document.getElementById(submitId);
  const success = document.getElementById(successId);
  const error = document.getElementById(errorId);

  if (!form || !submit) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = collectFormData(form);
    const ctx = window.bvCtx || {};
    const cfg = window.BV_CONFIG || {};

    if (error) error.hidden = true;

    // Optimistic UI: show success immediately. Send in the background.
    form.style.display = 'none';
    if (success) success.hidden = false;
    success?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const payload = {
      type,
      data,
      short_code: ctx.short_code || null,
      session_id: ctx.session_id || null,
      user_agent: navigator.userAgent
    };

    const url = `${cfg.SUPABASE_URL}/rest/v1/submissions`;
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Profile': cfg.SUPABASE_SCHEMA || 'beit_avraham',
        'apikey': cfg.SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + cfg.SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
    }).catch((err) => {
      console.error('Submission failed:', err);
      // Revert optimistic UI and show error
      if (success) success.hidden = true;
      form.style.display = '';
      if (error) error.hidden = false;
    });
  });
}

/**
 * Collects all named form fields into a plain object.
 * Handles inputs, textareas, selects, and radio button groups.
 */
function collectFormData(form) {
  const data = {};
  const formData = new FormData(form);
  for (const [key, value] of formData.entries()) {
    if (value !== '') data[key] = value;
  }
  return data;
}

/**
 * Wires up tab switching for the contact page.
 * Tab buttons must have data-tab="..." matching tab content data-tab-content="...".
 */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');
  const tabsContainer = document.querySelector('.tabs');
  const pageLede = document.querySelector('.page-hero .lede');

  function activate(target) {
    buttons.forEach((b) => {
      const isActive = b.getAttribute('data-tab') === target;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    contents.forEach((c) => {
      c.classList.toggle('active', c.getAttribute('data-tab-content') === target);
    });
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activate(btn.getAttribute('data-tab'));
    });
  });

  // Direct landing via URL hash — hide tabs, show only the relevant form.
  const hash = window.location.hash.replace('#', '');
  if (hash && document.querySelector(`[data-tab-content="${hash}"]`)) {
    activate(hash);
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (pageLede) {
      pageLede.innerHTML =
        'אם המסלול שלפניך לא מתאים, אפשר <a href="contact.html">לראות את כל המסלולים</a> או לשלוח אימייל ישיר ל־<a href="mailto:avi@futureflow.co.il">avi@futureflow.co.il</a>.';
    }
  }
}

/**
 * Wires up FAQ accordion. Items must use [data-faq-item] with [data-faq-trigger] and [data-faq-content].
 */
function initFAQ() {
  const triggers = document.querySelectorAll('[data-faq-trigger]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('[data-faq-item]');
      if (!item) return;
      const isOpen = item.classList.contains('open');
      item.classList.toggle('open', !isOpen);
      trigger.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });
}

/**
 * Mobile hamburger menu — auto-runs on every page that loads forms.js.
 */
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.querySelector('.hamburger');
  const nav = document.querySelector('.topnav');
  if (!hamburger || !nav) return;

  function toggleNav(open) {
    hamburger.classList.toggle('open', open);
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  hamburger.addEventListener('click', () => {
    toggleNav(!hamburger.classList.contains('open'));
  });

  // Close menu when a nav link is clicked (relevant for in-page anchors)
  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => toggleNav(false));
  });

  // Close menu when window is resized to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) toggleNav(false);
  });
});
