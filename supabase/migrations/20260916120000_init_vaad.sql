-- הידידות 5 / Sprint 1
-- Building-committee cashbox + tenants schema, RLS, and AI grounding helper.
-- Apply in the Supabase SQL editor (or `supabase db push` / `supabase db reset`).
-- Negative property.current_balance = debt (prod semantics).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.buildings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  property_number integer not null,
  type text not null check (type in ('residential', 'commercial')),
  title text not null,
  business_name text,
  residents text not null default '',
  resident_role text not null default 'owner',
  owner_name text,
  floor integer not null default 0,
  phone text,
  email text,
  monthly_due numeric(12,2) not null default 0,
  is_special_project_paid boolean not null default false,
  is_paid_current_month boolean not null default false,
  payment_method text not null default '',
  recurring_day_text text,
  -- Negative = debt. Aligns with AiGroundingContext.tenants[].balance
  current_balance numeric(12,2) not null default 0,
  balance_note text,
  retroactive_shortfall numeric(12,2) default 0,
  notes text,
  unique (building_id, property_number)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  building_id uuid references public.buildings(id) on delete set null,
  role text not null check (role in ('admin', 'tenant')),
  apartment_number integer,
  name text not null default '',
  email text not null default '',
  phone text,
  status text not null default 'active' check (status in ('active', 'pending')),
  last_login timestamptz,
  last_active timestamptz,
  login_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  date date not null,
  value_date date,
  description text not null default '',
  reference text not null default '',
  category text not null default 'other_expense',
  type text not null check (type in ('income', 'expense')),
  -- Always stored positive. Aligns with AiGroundingContext.ledger[].amount
  amount numeric(12,2) not null check (amount >= 0),
  balance numeric(12,2),
  status text not null default 'completed',
  apartment_number integer,
  notes text,
  receipt_url text
);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  token text not null unique,
  apartment_number integer not null,
  created_at date not null default current_date,
  expires_at date not null,
  is_used boolean not null default false,
  used_by_email text
);

create table if not exists public.broadcast_notices (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references public.buildings(id) on delete cascade,
  title text not null,
  content text not null,
  date text not null,
  author text not null default '',
  category text not null default 'announcement'
    check (category in ('announcement', 'maintenance', 'urgent')),
  target_apartment integer
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  building_id uuid references public.buildings(id) on delete set null,
  user_id uuid,
  user_name text not null default '',
  apartment_number integer not null default 0,
  timestamp text not null,
  action text not null check (action in ('login', 'view_ledger', 'register')),
  details text
);

create index if not exists transactions_building_date_idx
  on public.transactions (building_id, date desc);
create index if not exists transactions_apartment_idx
  on public.transactions (apartment_number);
create index if not exists properties_building_idx
  on public.properties (building_id, property_number);
create index if not exists profiles_role_idx
  on public.profiles (role);
create index if not exists invitations_token_idx
  on public.invitations (token);

-- ---------------------------------------------------------------------------
-- Role helpers (security definer — avoid RLS recursion)
-- ---------------------------------------------------------------------------

create or replace function public.is_committee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.my_apartment_number()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select apartment_number from public.profiles where id = auth.uid();
$$;

create or replace function public.my_building_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select building_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Auth → profile provisioning
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_apt integer;
  v_token text;
  v_building uuid;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'tenant');
  if v_role not in ('admin', 'tenant') then
    v_role := 'tenant';
  end if;

  v_apt := nullif(new.raw_user_meta_data->>'apartment_number', '')::integer;
  v_token := nullif(new.raw_user_meta_data->>'invite_token', '');

  select id into v_building from public.buildings order by created_at asc limit 1;

  if v_token is not null then
    update public.invitations
    set is_used = true, used_by_email = new.email
    where token = v_token
      and is_used = false
      and expires_at >= current_date
    returning apartment_number, building_id
      into v_apt, v_building;
  end if;

  insert into public.profiles (
    id, building_id, role, apartment_number, name, email, phone, status
  ) values (
    new.id,
    v_building,
    v_role,
    v_apt,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'phone',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    name = coalesce(nullif(excluded.name, ''), public.profiles.name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    role = excluded.role,
    apartment_number = coalesce(excluded.apartment_number, public.profiles.apartment_number),
    building_id = coalesce(excluded.building_id, public.profiles.building_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Peek an invite while logged out (token is an unguessable capability).
create or replace function public.peek_invitation(p_token text)
returns table (
  apartment_number integer,
  expires_at date,
  is_used boolean,
  property_title text,
  residents text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    i.apartment_number,
    i.expires_at,
    i.is_used,
    p.title,
    p.residents
  from public.invitations i
  left join public.properties p
    on p.property_number = i.apartment_number
   and p.building_id = i.building_id
  where i.token = p_token
  limit 1;
$$;

create or replace function public.claim_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select * into v_inv from public.invitations where token = p_token;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invite_not_found');
  end if;
  if v_inv.is_used then
    return jsonb_build_object('ok', false, 'error', 'invite_used');
  end if;
  if v_inv.expires_at < current_date then
    return jsonb_build_object('ok', false, 'error', 'invite_expired');
  end if;

  update public.invitations
  set is_used = true,
      used_by_email = (select email from public.profiles where id = auth.uid())
  where id = v_inv.id;

  update public.profiles
  set apartment_number = v_inv.apartment_number,
      building_id = v_inv.building_id,
      role = 'tenant',
      status = 'active'
  where id = auth.uid();

  return jsonb_build_object(
    'ok', true,
    'apartment_number', v_inv.apartment_number
  );
end;
$$;

create or replace function public.touch_profile_login()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set last_login = now(),
      last_active = now(),
      login_count = coalesce(login_count, 0) + 1
  where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- AI grounding (Sprint 2 will call this from an Edge Function / API).
-- Shape matches AiGroundingContext in src/types/ai.ts (contract v0.2).
-- ---------------------------------------------------------------------------

create or replace function public.build_ai_grounding(p_period_label text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_period text;
  v_building public.buildings%rowtype;
  v_balance numeric;
  v_prev numeric;
  v_result jsonb;
begin
  if not public.is_committee() then
    raise exception 'committee only';
  end if;

  v_period := coalesce(nullif(p_period_label, ''), to_char(timezone('Asia/Jerusalem', now()), 'YYYY-MM'));

  select * into v_building from public.buildings order by created_at asc limit 1;

  select t.balance into v_balance
  from public.transactions t
  where t.building_id = v_building.id
  order by t.date desc, t.id desc
  limit 1;

  select t.balance into v_prev
  from public.transactions t
  where t.building_id = v_building.id
    and to_char(t.date, 'YYYY-MM') < v_period
  order by t.date desc, t.id desc
  limit 1;

  select jsonb_build_object(
    'asOf', to_char(timezone('utc', now()), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'building', jsonb_build_object(
      'id', v_building.id::text,
      'name', v_building.name
    ),
    'fund', jsonb_build_object(
      'balance', coalesce(v_balance, 0),
      'currency', 'ILS',
      'previousBalance', v_prev,
      'periodLabel', v_period
    ),
    'tenants', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'apartment', p.property_number::text,
          'displayName', p.residents,
          'balance', p.current_balance,
          'lastPaymentAt', (
            select to_char(max(t.date), 'YYYY-MM-DD')
            from public.transactions t
            where t.building_id = p.building_id
              and t.type = 'income'
              and t.apartment_number = p.property_number
          )
        )
        order by p.property_number
      )
      from public.properties p
      where p.building_id = v_building.id
    ), '[]'::jsonb),
    'ledger', coalesce((
      select jsonb_agg(tx order by tx->>'date' desc)
      from (
        select jsonb_build_object(
          'id', t.id::text,
          'date', to_char(t.date, 'YYYY-MM-DD'),
          'type', t.type,
          'amount', t.amount,
          'category', t.category,
          'note', t.description,
          'apartment', t.apartment_number::text
        ) as tx
        from public.transactions t
        where t.building_id = v_building.id
        order by t.date desc, t.id desc
        limit 200
      ) ledger_rows
    ), '[]'::jsonb),
    'anomalyHints', jsonb_build_object(
      'expenseThresholdAbs', 2000,
      'expenseVsAvgMultiplier', 1.15
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.buildings enable row level security;
alter table public.properties enable row level security;
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.invitations enable row level security;
alter table public.broadcast_notices enable row level security;
alter table public.activity_logs enable row level security;

drop policy if exists buildings_select on public.buildings;
create policy buildings_select on public.buildings
  for select to authenticated
  using (public.is_committee() or id = public.my_building_id());

drop policy if exists properties_select on public.properties;
create policy properties_select on public.properties
  for select to authenticated
  using (
    public.is_committee()
    or (building_id = public.my_building_id() and property_number = public.my_apartment_number())
  );

drop policy if exists properties_write on public.properties;
create policy properties_write on public.properties
  for all to authenticated
  using (public.is_committee())
  with check (public.is_committee());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.is_committee() or id = auth.uid());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_committee())
  with check (id = auth.uid() or public.is_committee());

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions
  for select to authenticated
  using (
    public.is_committee()
    or (
      type = 'income'
      and apartment_number = public.my_apartment_number()
      and building_id = public.my_building_id()
    )
  );

drop policy if exists transactions_write on public.transactions;
create policy transactions_write on public.transactions
  for all to authenticated
  using (public.is_committee())
  with check (public.is_committee());

drop policy if exists invitations_committee on public.invitations;
create policy invitations_committee on public.invitations
  for all to authenticated
  using (public.is_committee())
  with check (public.is_committee());

drop policy if exists notices_select on public.broadcast_notices;
create policy notices_select on public.broadcast_notices
  for select to authenticated
  using (
    public.is_committee()
    or (
      building_id = public.my_building_id()
      and (target_apartment is null or target_apartment = public.my_apartment_number())
    )
  );

drop policy if exists notices_write on public.broadcast_notices;
create policy notices_write on public.broadcast_notices
  for all to authenticated
  using (public.is_committee())
  with check (public.is_committee());

drop policy if exists activity_select on public.activity_logs;
create policy activity_select on public.activity_logs
  for select to authenticated
  using (public.is_committee());

drop policy if exists activity_insert on public.activity_logs;
create policy activity_insert on public.activity_logs
  for insert to authenticated
  with check (
    public.is_committee()
    or user_id = auth.uid()
  );

grant usage on schema public to anon, authenticated;
grant select on public.buildings to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant select, insert, update, delete on public.broadcast_notices to authenticated;
grant select, insert on public.activity_logs to authenticated;

grant execute on function public.peek_invitation(text) to anon, authenticated;
grant execute on function public.claim_invitation(text) to authenticated;
grant execute on function public.touch_profile_login() to authenticated;
grant execute on function public.build_ai_grounding(text) to authenticated;
grant execute on function public.is_committee() to authenticated;
grant execute on function public.my_apartment_number() to authenticated;
grant execute on function public.my_building_id() to authenticated;
