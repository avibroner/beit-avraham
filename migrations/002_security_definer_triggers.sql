-- =============================================================
-- בית אברהם — Fix: triggers must run with elevated privileges
-- =============================================================
-- Problem: anon role can INSERT into visits/submissions, but the
-- BEFORE/AFTER triggers SELECT/UPDATE beit_avraham.links — and anon
-- has no rights on links. Result: every ?r=<code> insert failed with
-- 401 "permission denied for table links", silently swallowed by
-- tracking.js. visit_count stayed at 0 across all curated links.
--
-- Fix: mark trigger functions as SECURITY DEFINER so they run with
-- the function owner's rights (postgres), and pin search_path.
-- Anon still cannot read links directly — only via these triggers.
-- =============================================================

create or replace function beit_avraham.fill_link_id()
returns trigger
language plpgsql
security definer
set search_path = beit_avraham, public
as $$
begin
  if new.short_code is not null and new.short_code <> '' and new.link_id is null then
    select id into new.link_id from beit_avraham.links where short_code = new.short_code;
  end if;
  return new;
end $$;

create or replace function beit_avraham.bump_visit()
returns trigger
language plpgsql
security definer
set search_path = beit_avraham, public
as $$
begin
  if new.link_id is not null then
    update beit_avraham.links set
      visit_count = visit_count + 1,
      last_visit_at = new.visited_at,
      first_visit_at = coalesce(first_visit_at, new.visited_at)
    where id = new.link_id;
  end if;
  return new;
end $$;

create or replace function beit_avraham.bump_submission()
returns trigger
language plpgsql
security definer
set search_path = beit_avraham, public
as $$
begin
  if new.link_id is not null then
    update beit_avraham.links set submission_count = submission_count + 1
    where id = new.link_id;
  end if;
  return new;
end $$;
