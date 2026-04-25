/* =============================================================
   בית אברהם — Forms JavaScript
   Submits forms to Supabase via REST API.
   Configure SUPABASE_URL and SUPABASE_ANON_KEY below.
   ============================================================= */

// === CONFIGURATION — REPLACE THESE TWO LINES ===
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';
const SUPABASE_TABLE = 'beit_avraham_submissions';
// =================================================

/**
 * Wires up a form to submit to Supabase.
 * Pass an object with the IDs of form, submit button, success/error messages,
 * and the type of submission (e.g. 'share', 'professional', 'connection', 'partnership').
 */
function initForm({ formId, submitId, successId, errorId, type }) {
  const form = document.getElementById(formId);
  const submit = document.getElementById(submitId);
  const success = document.getElementById(successId);
  const error = document.getElementById(errorId);

  if (!form || !submit) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = collectFormData(form);

    const originalLabel = submit.textContent;
    submit.disabled = true;
    submit.textContent = 'שולח...';
    if (error) error.hidden = true;

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        throw new Error(`Submission failed: ${response.status}`);
      }

      form.style.display = 'none';
      if (success) success.hidden = false;
      success?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      console.error(err);
      submit.disabled = false;
      submit.textContent = originalLabel;
      if (error) error.hidden = false;
    }
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
