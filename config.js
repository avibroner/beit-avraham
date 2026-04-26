/* =============================================================
   בית אברהם — Site config
   The site writes directly to Supabase (anon key).
   A DB trigger forwards form submissions to n8n for WhatsApp/Email alerts.
   ============================================================= */
window.BV_CONFIG = {
  SUPABASE_URL: 'https://cofaavvzzszsltuwaagx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZmFhdnZ6enN6c2x0dXdhYWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODQ4MDAsImV4cCI6MjA4ODM2MDgwMH0.cL1Q4k1CzY5S2cPlqwNQaM3A7P5lJp2mnmekaX1opnI',
  SUPABASE_SCHEMA: 'beit_avraham',
  SITE_BASE_URL: 'https://beit-avraham.site'
};

window.bvIsEnglish = function () {
  return (document.documentElement.lang || '').toLowerCase().startsWith('en');
};
