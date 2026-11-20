-- NeloveLabs core schema. Apply with `supabase db push` after linking your project.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.credit_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 1000 check (balance >= 0),
  updated_at timestamptz not null default now()
);
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  voice_id text not null,
  text text not null,
  emotion text not null default 'Natural',
  model_id text not null,
  character_count integer not null check (character_count > 0),
  duration_ms integer,
  format text not null default 'mp3',
  created_at timestamptz not null default now()
);
create index if not exists generations_user_created_idx on public.generations(user_id, created_at desc);
create table if not exists public.personal_voices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  voice_id text not null unique,
  name text not null,
  consent_statement text not null,
  consented_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.generations enable row level security;
alter table public.personal_voices enable row level security;
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "credits select own" on public.credit_accounts for select using (auth.uid() = user_id);
create policy "generation select own" on public.generations for select using (auth.uid() = user_id);
create policy "generation insert own" on public.generations for insert with check (auth.uid() = user_id);
create policy "voices select own" on public.personal_voices for select using (auth.uid() = user_id);
create policy "voices insert own" on public.personal_voices for insert with check (auth.uid() = user_id);
create policy "voices delete own" on public.personal_voices for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id,email) values (new.id,new.email);
  insert into public.credit_accounts (user_id,balance) values (new.id,coalesce(nullif(current_setting('app.settings.starter_credits', true), '')::integer,1000));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Atomic credit reservation. These RPCs are only executable by the server-side service role.
create or replace function public.consume_credits(p_user_id uuid,p_amount integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare new_balance integer;
begin
  if p_amount < 1 or p_amount > 5000 then raise exception 'invalid credit amount'; end if;
  update public.credit_accounts set balance=balance-p_amount,updated_at=now()
    where user_id=p_user_id and balance>=p_amount returning balance into new_balance;
  if new_balance is null then raise exception 'insufficient credits'; end if;
  return new_balance;
end; $$;
create or replace function public.refund_credits(p_user_id uuid,p_amount integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare new_balance integer;
begin
  update public.credit_accounts set balance=balance+p_amount,updated_at=now() where user_id=p_user_id returning balance into new_balance;
  return new_balance;
end; $$;
revoke all on function public.consume_credits(uuid,integer) from public,anon,authenticated;
revoke all on function public.refund_credits(uuid,integer) from public,anon,authenticated;
grant execute on function public.consume_credits(uuid,integer) to service_role;
grant execute on function public.refund_credits(uuid,integer) to service_role;
grant select on public.profiles,public.credit_accounts,public.generations,public.personal_voices to authenticated;
grant insert,update on public.generations to authenticated;
grant insert,delete on public.personal_voices to authenticated;
