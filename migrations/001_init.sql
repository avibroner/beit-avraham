-- =============================================================
-- בית אברהם — Initial schema
-- Schema: beit_avraham
-- Tables: links, visits, submissions
-- =============================================================

create schema if not exists beit_avraham;

-- 1. Links — curated (Avi creates) + self (visitor shared)
create table if not exists beit_avraham.links (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  source_type text not null check (source_type in ('curated','self')),

  -- curated fields
  curated_for_name text,
  curated_for_role text,
  curated_for_contact text,
  curated_channel text,

  -- self fields
  self_optional_name text,
  creator_session_id text,

  -- referral tree
  parent_link_id uuid references beit_avraham.links(id) on delete set null,

  notes text,
  created_at timestamptz not null default now(),
  first_visit_at timestamptz,
  last_visit_at timestamptz,
  visit_count int not null default 0,
  submission_count int not null default 0
);

create index if not exists idx_links_short_code on beit_avraham.links (short_code);
create index if not exists idx_links_parent on beit_avraham.links (parent_link_id);
create index if not exists idx_links_source_type on beit_avraham.links (source_type);

-- 2. Visits
create table if not exists beit_avraham.visits (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references beit_avraham.links(id) on delete set null,
  short_code text,
  session_id text not null,
  page text not null,
  referrer text,
  user_agent text,
  ip_country text,
  visited_at timestamptz not null default now()
);

create index if not exists idx_visits_link on beit_avraham.visits (link_id, visited_at desc);
create index if not exists idx_visits_session on beit_avraham.visits (session_id);

-- 3. Submissions
create table if not exists beit_avraham.submissions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references beit_avraham.links(id) on delete set null,
  short_code text,
  session_id text,
  type text not null check (type in ('professional','connection','partnership','share')),
  data jsonb not null,
  user_agent text,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_submissions_link on beit_avraham.submissions (link_id, submitted_at desc);
create index if not exists idx_submissions_type on beit_avraham.submissions (type);

-- 4. Triggers — keep aggregate counts on links
create or replace function beit_avraham.bump_visit() returns trigger language plpgsql as $$
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

drop trigger if exists trg_bv_visit on beit_avraham.visits;
create trigger trg_bv_visit after insert on beit_avraham.visits
  for each row execute function beit_avraham.bump_visit();

create or replace function beit_avraham.bump_submission() returns trigger language plpgsql as $$
begin
  if new.link_id is not null then
    update beit_avraham.links set submission_count = submission_count + 1
    where id = new.link_id;
  end if;
  return new;
end $$;

drop trigger if exists trg_bv_submission on beit_avraham.submissions;
create trigger trg_bv_submission after insert on beit_avraham.submissions
  for each row execute function beit_avraham.bump_submission();

-- 5. RLS — block anon entirely. n8n uses service_role to bypass.
alter table beit_avraham.links enable row level security;
alter table beit_avraham.visits enable row level security;
alter table beit_avraham.submissions enable row level security;

-- 6. Helpful view for dashboard (links with current activity)
create or replace view beit_avraham.links_with_activity as
select
  l.id,
  l.short_code,
  l.source_type,
  coalesce(l.curated_for_name, l.self_optional_name, '(אנונימי)') as display_name,
  l.curated_for_role,
  l.curated_channel,
  l.parent_link_id,
  parent.short_code as parent_short_code,
  l.created_at,
  l.first_visit_at,
  l.last_visit_at,
  l.visit_count,
  l.submission_count,
  case
    when l.visit_count = 0 then 'never_opened'
    when l.submission_count = 0 then 'opened_no_submission'
    else 'submitted'
  end as funnel_stage
from beit_avraham.links l
left join beit_avraham.links parent on parent.id = l.parent_link_id;
