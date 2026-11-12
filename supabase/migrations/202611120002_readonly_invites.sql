begin;

create table public.courtmate_invites (
  group_id uuid primary key references public.courtmate_groups(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
alter table public.courtmate_invites enable row level security;
alter table public.courtmate_invites force row level security;
revoke all on public.courtmate_invites from public, anon, authenticated;

-- Only the signed-in owner may issue a link. Reissuing rotates the token.
create function public.courtmate_publish_invite(p_group_id uuid, p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_expires timestamptz := now() + interval '7 days';
begin
  if not exists (select 1 from public.courtmate_groups g where g.id = p_group_id and g.owner_id = (select auth.uid())) then
    raise exception 'Group not available' using errcode = '42501';
  end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid invitation' using errcode = '22023';
  end if;
  insert into public.courtmate_invites(group_id, token_hash, expires_at, revoked_at)
  values (p_group_id, encode(sha256(convert_to(p_token, 'UTF8')), 'hex'), v_expires, null)
  on conflict (group_id) do update set token_hash = excluded.token_hash, expires_at = excluded.expires_at, revoked_at = null;
  return jsonb_build_object('expires_at', v_expires);
end;
$$;

-- A link is a bearer capability. Expose only this projection, never the snapshot.
create function public.courtmate_read_invite(p_group_id uuid, p_token text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'groupName', g.name,
    'updated_at', g.updated_at,
    'players', coalesce((
      select jsonb_agg(jsonb_build_object('id', p.value->'id', 'name', p.value->>'name', 'level', p.value->'level', 'avatar', p.value->'avatar') order by p.ordinality)
      from jsonb_array_elements(g.snapshot->'players') with ordinality as p(value, ordinality)
    ), '[]'::jsonb)
  )
  from public.courtmate_invites i join public.courtmate_groups g on g.id = i.group_id
  where i.group_id = p_group_id and i.revoked_at is null and i.expires_at > now()
    and p_token ~ '^[a-f0-9]{64}$'
    and i.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
$$;

create function public.courtmate_revoke_invite(p_group_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.courtmate_invites i set revoked_at = now()
  where i.group_id = p_group_id and exists (
    select 1 from public.courtmate_groups g where g.id = i.group_id and g.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.courtmate_publish_invite(uuid,text) from public, anon, authenticated;
revoke all on function public.courtmate_read_invite(uuid,text) from public, anon, authenticated;
revoke all on function public.courtmate_revoke_invite(uuid) from public, anon, authenticated;
grant execute on function public.courtmate_publish_invite(uuid,text) to authenticated;
grant execute on function public.courtmate_revoke_invite(uuid) to authenticated;
grant execute on function public.courtmate_read_invite(uuid,text) to anon, authenticated;

commit;
