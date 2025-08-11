
-- 1) Subscription tier enum and profiles columns
do $$ begin
  create type public.subscription_tier as enum ('free','basic','premium','enterprise');
exception when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists subscription_tier public.subscription_tier not null default 'free',
  add column if not exists subscription_active boolean not null default true;

-- 2) Per-user storage usage table
create table if not exists public.user_storage_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  db_bytes_used bigint not null default 0,
  file_bytes_used bigint not null default 0,
  updated_at timestamptz not null default now()
);
alter table public.user_storage_usage enable row level security;

do $$ begin
  create policy "Users can view their storage usage"
    on public.user_storage_usage
    for select
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- 3) User files registry (tracks Supabase Storage uploads)
create table if not exists public.user_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_id uuid null references public.entries(id) on delete set null,
  path text not null,
  size bigint not null check (size >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_files enable row level security;

do $$ begin
  create policy "Users can view their own files"
    on public.user_files
    for select
    using (auth.uid() = user_id);

  create policy "Users can insert their own files"
    on public.user_files
    for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own files"
    on public.user_files
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create policy "Users can delete their own files"
    on public.user_files
    for delete
    using (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

-- 4) Entries size tracking
alter table public.entries
  add column if not exists approx_bytes bigint not null default 0;

-- 5) Limit and helper functions
create or replace function public.storage_limit_bytes(tier public.subscription_tier)
returns bigint
language sql
immutable
as $$
  select case tier
    when 'free'::public.subscription_tier then 500 * 1024 * 1024              -- 500 MB
    when 'basic'::public.subscription_tier then 5 * 1024 * 1024 * 1024        -- 5 GB
    when 'premium'::public.subscription_tier then 50 * 1024 * 1024 * 1024     -- 50 GB
    when 'enterprise'::public.subscription_tier then 500 * 1024 * 1024 * 1024 -- 500 GB
  end
$$;

create or replace function public.get_user_tier(_user_id uuid)
returns public.subscription_tier
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(p.subscription_tier, 'free'::public.subscription_tier)
  from public.profiles p
  where p.id = _user_id
$$;

create or replace function public.entries_compute_bytes(_title text, _fields jsonb, _field_definitions jsonb)
returns bigint
language sql
immutable
as $$
  select
    coalesce(octet_length(coalesce(_title, '')::text), 0)
    + coalesce(octet_length(coalesce(_fields, '{}'::jsonb)::text), 0)
    + coalesce(octet_length(coalesce(_field_definitions, '{}'::jsonb)::text), 0)
$$;

create or replace function public.check_and_update_usage(_user_id uuid, _delta_db bigint, _delta_file bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  cur_db bigint;
  cur_file bigint;
  tier public.subscription_tier;
  limit_bytes bigint;
  new_db bigint;
  new_file bigint;
  new_total bigint;
begin
  -- lock or create usage row
  select u.db_bytes_used, u.file_bytes_used
    into cur_db, cur_file
  from public.user_storage_usage u
  where u.user_id = _user_id
  for update;

  if not found then
    insert into public.user_storage_usage (user_id) values (_user_id)
    on conflict (user_id) do nothing;

    select u.db_bytes_used, u.file_bytes_used
      into cur_db, cur_file
    from public.user_storage_usage u
    where u.user_id = _user_id
    for update;
  end if;

  tier := public.get_user_tier(_user_id);
  limit_bytes := public.storage_limit_bytes(tier);

  new_db := greatest(0, cur_db + coalesce(_delta_db, 0));
  new_file := greatest(0, cur_file + coalesce(_delta_file, 0));
  new_total := new_db + new_file;

  if new_total > limit_bytes then
    raise exception 'storage_limit_exceeded: proposed total % bytes exceeds limit % bytes for tier %',
      new_total, limit_bytes, tier
      using errcode = '22023';
  end if;

  update public.user_storage_usage
     set db_bytes_used = new_db,
         file_bytes_used = new_file,
         updated_at = now()
   where user_id = _user_id;
end;
$$;

-- 6) Triggers for entries
create or replace function public.enforce_entries_storage_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
  new_bytes bigint;
  delta bigint;
begin
  new_bytes := public.entries_compute_bytes(NEW.title, NEW.fields, NEW.field_definitions);

  if TG_OP = 'INSERT' then
    delta := new_bytes;
  else
    delta := new_bytes - coalesce(OLD.approx_bytes, 0);
  end if;

  uid := coalesce(auth.uid(), NEW.user_id, OLD.user_id);
  if uid is null then
    raise exception 'Cannot determine user for storage enforcement';
  end if;

  perform public.check_and_update_usage(uid, delta, 0);

  NEW.approx_bytes := new_bytes;
  return NEW;
end;
$$;

drop trigger if exists trg_entries_storage_before_ins_upd on public.entries;
create trigger trg_entries_storage_before_ins_upd
before insert or update on public.entries
for each row execute function public.enforce_entries_storage_limit();

create or replace function public.decrement_entries_usage_on_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
begin
  uid := coalesce(auth.uid(), OLD.user_id);
  if uid is null then
    raise exception 'Cannot determine user for storage decrement';
  end if;

  perform public.check_and_update_usage(uid, -coalesce(OLD.approx_bytes, 0), 0);
  return OLD;
end;
$$;

drop trigger if exists trg_entries_storage_after_delete on public.entries;
create trigger trg_entries_storage_after_delete
after delete on public.entries
for each row execute function public.decrement_entries_usage_on_delete();

-- 7) Triggers for user_files
create or replace function public.enforce_user_files_storage_limit()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
  delta bigint;
begin
  if TG_OP = 'INSERT' then
    delta := coalesce(NEW.size, 0);
  else
    delta := coalesce(NEW.size, 0) - coalesce(OLD.size, 0);
  end if;

  uid := coalesce(auth.uid(), NEW.user_id, OLD.user_id);
  if uid is null then
    raise exception 'Cannot determine user for storage enforcement (files)';
  end if;

  perform public.check_and_update_usage(uid, 0, delta);

  NEW.updated_at := now();
  return NEW;
end;
$$;

drop trigger if exists trg_user_files_before_ins_upd on public.user_files;
create trigger trg_user_files_before_ins_upd
before insert or update on public.user_files
for each row execute function public.enforce_user_files_storage_limit();

create or replace function public.decrement_user_files_on_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
begin
  uid := coalesce(auth.uid(), OLD.user_id);
  if uid is null then
    raise exception 'Cannot determine user for storage decrement (files)';
  end if;

  perform public.check_and_update_usage(uid, 0, -coalesce(OLD.size, 0));
  return OLD;
end;
$$;

drop trigger if exists trg_user_files_after_delete on public.user_files;
create trigger trg_user_files_after_delete
after delete on public.user_files
for each row execute function public.decrement_user_files_on_delete();

-- 8) Backfill approx_bytes and usage for existing data
update public.entries
   set approx_bytes = public.entries_compute_bytes(title, fields, field_definitions);

insert into public.user_storage_usage (user_id, db_bytes_used, file_bytes_used)
select e.user_id, coalesce(sum(e.approx_bytes), 0) as db_bytes_used, 0 as file_bytes_used
from public.entries e
group by e.user_id
on conflict (user_id) do update
  set db_bytes_used = excluded.db_bytes_used,
      updated_at = now();

-- 9) Convenience functions for UI
create or replace function public.get_current_storage_usage()
returns table (
  user_id uuid,
  tier public.subscription_tier,
  limit_bytes bigint,
  db_bytes_used bigint,
  file_bytes_used bigint,
  total_bytes bigint,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
  t public.subscription_tier;
  l bigint;
  dbb bigint;
  fbb bigint;
  upd timestamptz;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  t := public.get_user_tier(uid);
  l := public.storage_limit_bytes(t);

  select u.db_bytes_used, u.file_bytes_used, u.updated_at
    into dbb, fbb, upd
  from public.user_storage_usage u
  where u.user_id = uid;

  dbb := coalesce(dbb, 0);
  fbb := coalesce(fbb, 0);

  return query
    select uid, t, l, dbb, fbb, dbb + fbb, upd;
end;
$$;

create or replace function public.can_add_usage(_delta_db bigint, _delta_file bigint)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  uid uuid;
  t public.subscription_tier;
  l bigint;
  dbb bigint;
  fbb bigint;
  proposed bigint;
begin
  uid := auth.uid();
  if uid is null then
    return false;
  end if;

  t := public.get_user_tier(uid);
  l := public.storage_limit_bytes(t);

  select u.db_bytes_used, u.file_bytes_used
    into dbb, fbb
  from public.user_storage_usage u
  where u.user_id = uid;

  dbb := coalesce(dbb, 0);
  fbb := coalesce(fbb, 0);

  proposed := greatest(0, dbb + coalesce(_delta_db, 0))
            + greatest(0, fbb + coalesce(_delta_file, 0));

  return proposed <= l;
end;
$$;
