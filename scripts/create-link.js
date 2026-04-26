#!/usr/bin/env node
/**
 * בית אברהם — CLI: create a curated share link
 *
 * Usage:
 *   node scripts/create-link.js "שם מלא" "תפקיד" "טלפון/מייל" [whatsapp|email|in-person] [notes]
 *
 * Example:
 *   node scripts/create-link.js "הרב יוסי כהן" "רב קהילה" "+972501234567" whatsapp
 *
 * Requires .env with:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   SITE_BASE_URL  (optional — defaults to https://beit-avraham.site)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { customAlphabet } = require('nanoid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://beit-avraham.site';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error('Usage: node scripts/create-link.js "שם" ["תפקיד"] ["איש קשר"] [channel] [notes]');
  process.exit(1);
}

const [name, role, contact, channel, notes] = args;

const validChannels = ['whatsapp', 'email', 'in-person'];
if (channel && !validChannels.includes(channel)) {
  console.error(`Invalid channel "${channel}". Must be one of: ${validChannels.join(', ')}`);
  process.exit(1);
}

// URL-safe alphabet, 8 chars → ~218 trillion combinations, no ambiguous chars
const nano = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz', 8);

(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { schema: 'beit_avraham' },
    auth: { persistSession: false }
  });

  const short_code = nano();

  const { data, error } = await supabase
    .from('links')
    .insert({
      short_code,
      source_type: 'curated',
      curated_for_name: name,
      curated_for_role: role || null,
      curated_for_contact: contact || null,
      curated_channel: channel || null,
      notes: notes || null
    })
    .select()
    .single();

  if (error) {
    console.error('Insert failed:', error.message);
    process.exit(1);
  }

  const url = `${SITE_BASE_URL}/?r=${short_code}`;

  console.log('');
  console.log('✨ נוצר לינק חדש');
  console.log('───────────────────────────────────────────');
  console.log('  שם:     ', name);
  if (role) console.log('  תפקיד:  ', role);
  if (contact) console.log('  קשר:    ', contact);
  if (channel) console.log('  ערוץ:   ', channel);
  console.log('  קוד:    ', short_code);
  console.log('───────────────────────────────────────────');
  console.log('  ' + url);
  console.log('');
})();
