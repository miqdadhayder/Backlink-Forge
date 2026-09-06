create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read their profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set email = excluded.email, display_name = coalesce(excluded.display_name, profiles.display_name), updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.saved_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id text not null, website text not null, url text not null,
  domain_authority integer, traffic integer, niche text, backlink_type text,
  guest_post_available boolean not null default false, relevance_score integer,
  difficulty text, notes text, created_at timestamptz not null default now(),
  unique(user_id, opportunity_id)
);
alter table public.saved_opportunities enable row level security;
create policy "Users own saved opportunities" on public.saved_opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, subject text not null, body text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.email_templates enable row level security;
create policy "Users own email templates" on public.email_templates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists saved_opportunities_user_created_idx on public.saved_opportunities(user_id, created_at desc);
create index if not exists email_templates_user_updated_idx on public.email_templates(user_id, updated_at desc);

create table if not exists public.app_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  entity text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.app_records enable row level security;
create policy "Users own app records" on public.app_records for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists app_records_user_entity_created_idx on public.app_records(user_id, entity, created_at desc);
