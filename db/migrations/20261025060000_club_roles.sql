-- Club roles: every membership has a title. Anyone above "Member" is an officer, which maps to the
-- existing role = 'leader' so every earlier permission check keeps working unchanged.
-- Members see an event's basics (title, when, where, clubs) and can volunteer; only officers see
-- the plan, the agents' messages and approvals. Everyone has a display name so rosters can show
-- "Ava (Budget officer)". Follows the hardened layout: SECURITY DEFINER code lives in
-- cohost_private, and public exposes thin SECURITY INVOKER wrappers.

-- ---------- Titles ----------
create or replace function cohost_private.title_rank(t text) returns int
language sql immutable set search_path = '' as $$
  select array_position(array['President','Vice President','Budget officer','Event coordinator','Member'], t) $$;

alter table public.club_members add column title text not null default 'Member'
  check (title in ('President','Vice President','Budget officer','Event coordinator','Member'));
update public.club_members set title = 'President' where role = 'leader' and title = 'Member';

-- Keep role and title in step on every write path, including older ones that only set role.
create function cohost_private.sync_member_title() returns trigger
language plpgsql set search_path = public, pg_temp as $$ begin
  if tg_op = 'UPDATE' and new.title is distinct from old.title then
    new.role := case when new.title = 'Member' then 'member' else 'leader' end;
  elsif new.role = 'leader' and new.title = 'Member' then
    new.title := 'President';
  elsif new.role = 'member' and new.title <> 'Member' then
    new.title := case when tg_op = 'INSERT' then new.title else 'Member' end;
    if tg_op = 'INSERT' then new.role := 'leader'; end if;
  end if;
  return new;
end $$;
revoke all on function cohost_private.sync_member_title() from public, anon, authenticated;
create trigger club_members_sync_title before insert or update on public.club_members
  for each row execute function cohost_private.sync_member_title();

alter table public.membership_requests add column requested_title text not null default 'Member'
  check (requested_title in ('President','Vice President','Budget officer','Event coordinator','Member'));

-- ---------- Display names ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60)
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;

create function cohost_private.shares_club(_user uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select _user = auth.uid() or exists (
    select 1 from club_members a join club_members b on a.club_id = b.club_id
    where a.user_id = auth.uid() and b.user_id = _user)
  or exists (select 1 from membership_requests r where r.user_id = _user and r.status = 'pending' and is_leader(r.club_id)) $$;
create function public.shares_club(_user uuid) returns boolean
language sql stable security invoker set search_path = '' as $$ select cohost_private.shares_club(_user) $$;
create policy profiles_read on public.profiles for select to authenticated using (public.shares_club(user_id));

create function cohost_private.set_my_name(p_name text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$ begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 1 and 60 then raise exception 'name must be 1-60 characters'; end if;
  insert into profiles values (auth.uid(), trim(p_name)) on conflict (user_id) do update set display_name = excluded.display_name;
end $$;
create function public.set_my_name(p_name text) returns void
language sql volatile security invoker set search_path = '' as $$ select cohost_private.set_my_name(p_name) $$;

-- ---------- Event basics members can see ----------
alter table public.events add column starts_at timestamptz;
alter table public.events add column ends_at timestamptz;
alter table public.events add column location text check (char_length(location) <= 160);
alter table public.events add constraint events_time_order check (ends_at is null or starts_at is null or ends_at > starts_at);

create function cohost_private.set_event_details(p_event uuid, p_start timestamptz, p_end timestamptz, p_location text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$ declare e events; begin
  select * into e from events where id = p_event for update;
  if auth.uid() is null or e.id is null or not is_leader(e.organizer_club_id) then raise exception 'organizer officers only'; end if;
  if p_start is null or p_end is null or p_end <= p_start then raise exception 'end must be after start'; end if;
  update events set starts_at = p_start, ends_at = p_end, location = nullif(left(trim(p_location), 160), '') where id = p_event;
  insert into audit_log(action, event_id) values ('set_event_details', p_event);
end $$;
create function public.set_event_details(p_event uuid, p_start timestamptz, p_end timestamptz, p_location text) returns void
language sql volatile security invoker set search_path = '' as $$ select cohost_private.set_event_details(p_event, p_start, p_end, p_location) $$;

-- Plan internals are for officers of a participating club only.
create function cohost_private.is_officer_participant(_event uuid) returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from event_clubs ec join club_members m on m.club_id = ec.club_id
                 where ec.event_id = _event and m.user_id = auth.uid() and m.role = 'leader') $$;
create function public.is_officer_participant(_event uuid) returns boolean
language sql stable security invoker set search_path = '' as $$ select cohost_private.is_officer_participant(_event) $$;

drop policy versions_read on public.proposal_versions;
create policy versions_read on public.proposal_versions for select to authenticated using (public.is_officer_participant(event_id));
drop policy msgs_read on public.negotiation_messages;
create policy msgs_read on public.negotiation_messages for select to authenticated using (public.is_officer_participant(event_id));
drop policy approvals_read on public.approvals;
create policy approvals_read on public.approvals for select to authenticated using (public.is_officer_participant(event_id));

-- ---------- Joining a club with a role ----------
-- Creating a club makes you its President.
create or replace function cohost_private.create_club(p_name text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare v uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into clubs(name, created_by) values (trim(p_name), auth.uid()) returning id into v;
  insert into club_members(club_id, user_id, role, title) values (v, auth.uid(), 'leader', 'President');
  insert into audit_log(action, detail) values ('create_club', jsonb_build_object('club', v));
  return v; end $$;

-- Ask to join as a given role. Nothing is granted until an officer accepts.
create function cohost_private.request_membership_as(p_club uuid, p_title text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$ begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if cohost_private.title_rank(p_title) is null then raise exception 'unknown role'; end if;
  if is_member(p_club) then raise exception 'already a member'; end if;
  insert into membership_requests(club_id, user_id, status, requested_title) values (p_club, auth.uid(), 'pending', p_title)
  on conflict (club_id, user_id) do update set requested_title = excluded.requested_title, status = 'pending'
  where membership_requests.status = 'pending';
end $$;
create function public.request_membership_as(p_club uuid, p_title text) returns void
language sql volatile security invoker set search_path = '' as $$ select cohost_private.request_membership_as(p_club, p_title) $$;

-- Officers accept requests. An officer can't grant a role more senior than their own.
create or replace function cohost_private.accept_membership(p_club uuid, p_user uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare want text; mine text; begin
  if auth.uid() is null or not is_leader(p_club) then raise exception 'club officers only'; end if;
  select requested_title into want from membership_requests where club_id = p_club and user_id = p_user and status = 'pending' for update;
  if want is null then raise exception 'no pending request'; end if;
  select title into mine from club_members where club_id = p_club and user_id = auth.uid();
  if cohost_private.title_rank(want) < cohost_private.title_rank(mine) then raise exception 'you can only grant roles at or below your own'; end if;
  update membership_requests set status = 'accepted' where club_id = p_club and user_id = p_user;
  insert into club_members(club_id, user_id, role, title) values (p_club, p_user, case when want = 'Member' then 'member' else 'leader' end::club_role, want)
  on conflict (club_id, user_id) do nothing;
  insert into audit_log(action, detail) values ('accept_membership', jsonb_build_object('club', p_club, 'user', p_user, 'title', want));
end $$;

-- Change someone's role. Same seniority rule, and a club always keeps at least one President.
create function cohost_private.set_member_title(p_club uuid, p_user uuid, p_title text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare mine text; theirs text; begin
  if auth.uid() is null or not is_leader(p_club) then raise exception 'club officers only'; end if;
  if cohost_private.title_rank(p_title) is null then raise exception 'unknown role'; end if;
  perform 1 from clubs where id = p_club for update;
  select title into mine from club_members where club_id = p_club and user_id = auth.uid();
  select title into theirs from club_members where club_id = p_club and user_id = p_user;
  if theirs is null then raise exception 'not a member of this club'; end if;
  if cohost_private.title_rank(p_title) < cohost_private.title_rank(mine) or cohost_private.title_rank(theirs) < cohost_private.title_rank(mine)
    then raise exception 'you can only manage roles at or below your own'; end if;
  if theirs = 'President' and p_title <> 'President'
     and (select count(*) from club_members where club_id = p_club and title = 'President') = 1
    then raise exception 'a club needs at least one President'; end if;
  update club_members set title = p_title, role = case when p_title = 'Member' then 'member' else 'leader' end::club_role
  where club_id = p_club and user_id = p_user;
  insert into audit_log(action, detail) values ('set_member_title', jsonb_build_object('club', p_club, 'user', p_user, 'title', p_title));
end $$;
create function public.set_member_title(p_club uuid, p_user uuid, p_title text) returns void
language sql volatile security invoker set search_path = '' as $$ select cohost_private.set_member_title(p_club, p_user, p_title) $$;

-- The old add_member path bypassed titles; officers now use requests and set_member_title.
revoke execute on function public.add_member(uuid, uuid, public.club_role) from authenticated;

-- ---------- Grants ----------
revoke all on function cohost_private.title_rank(text), cohost_private.shares_club(uuid), cohost_private.set_my_name(text),
  cohost_private.set_event_details(uuid, timestamptz, timestamptz, text), cohost_private.is_officer_participant(uuid),
  cohost_private.request_membership_as(uuid, text), cohost_private.set_member_title(uuid, uuid, text) from public, anon;
grant execute on function cohost_private.title_rank(text), cohost_private.shares_club(uuid), cohost_private.set_my_name(text),
  cohost_private.set_event_details(uuid, timestamptz, timestamptz, text), cohost_private.is_officer_participant(uuid),
  cohost_private.request_membership_as(uuid, text), cohost_private.set_member_title(uuid, uuid, text) to authenticated;
revoke all on function public.shares_club(uuid), public.set_my_name(text), public.set_event_details(uuid, timestamptz, timestamptz, text),
  public.is_officer_participant(uuid), public.request_membership_as(uuid, text), public.set_member_title(uuid, uuid, text) from public, anon;
grant execute on function public.shares_club(uuid), public.set_my_name(text), public.set_event_details(uuid, timestamptz, timestamptz, text),
  public.is_officer_participant(uuid), public.request_membership_as(uuid, text), public.set_member_title(uuid, uuid, text) to authenticated;
create index if not exists membership_requests_user_idx on public.membership_requests(user_id);
