begin;

create table public.courtmate_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 50),
  snapshot jsonb not null check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot @> '{"version":1}'::jsonb
    and (jsonb_typeof(snapshot->'players') = 'array') is true
    and (jsonb_typeof(snapshot->'history') = 'array') is true
    and jsonb_array_length(snapshot->'players') <= 40
    and jsonb_array_length(snapshot->'history') <= 10000
    and (snapshot->>'groupName' = name) is true
    and octet_length(snapshot::text) <= 2000000
  ),
  revision integer not null default 1 check (revision > 0),
  player_count integer generated always as (jsonb_array_length(snapshot->'players')) stored,
  completed_games integer generated always as (jsonb_array_length(snapshot->'history')) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courtmate_groups_owner_updated on public.courtmate_groups (owner_id, updated_at desc, id);

alter table public.courtmate_groups enable row level security;
alter table public.courtmate_groups force row level security;
revoke all on public.courtmate_groups from public, anon, authenticated;
grant select on public.courtmate_groups to authenticated;
grant insert (id, owner_id, name, snapshot) on public.courtmate_groups to authenticated;
grant update (name, snapshot) on public.courtmate_groups to authenticated;

create policy owner_read on public.courtmate_groups for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy owner_create on public.courtmate_groups for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy owner_update on public.courtmate_groups for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create function public.courtmate_group_revision() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.courtmate_group_revision() from public;
create trigger courtmate_group_revision before update on public.courtmate_groups
  for each row execute function public.courtmate_group_revision();

commit;
