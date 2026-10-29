-- =========================================================================
-- FIX: sessions tablosuna eksik kolonlar + cok dar CHECK kisitlari
-- Mevcut projede SQL Editor'de calistir (idempotent — tekrar calistirilabilir)
-- =========================================================================

-- 1) Dar CHECK kisitlarini kaldir (kod baska step/status degerleri yaziyor)
alter table public.sessions drop constraint if exists sessions_current_step_check;
alter table public.sessions drop constraint if exists sessions_status_check;
alter table public.sessions drop constraint if exists sessions_sms_digits_check;

-- 2) Eksik kolonlar
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

-- 3) public_id unique index (kisa link numerasi)
create unique index if not exists sessions_public_id_key on public.sessions (public_id);

-- Dogrula:
--   select column_name, data_type from information_schema.columns
--   where table_name='sessions' order by ordinal_position;
-- =========================================================================
