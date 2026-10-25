-- CoHost core schema. All writes go through SECURITY DEFINER RPCs that read
-- identity from auth.uid(); tables expose SELECT only, scoped by RLS.

create type public.club_role as enum ('leader', 'member');
create type public.msg_kind as enum ('proposal', 'offer', 'counteroffer', 'constraint', 'note');

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.club_role not null default 'member',
  primary key (club_id, user_id)
);
create table public.student_skills (
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null check (char_length(skill) between 1 and 40),
  primary key (user_id, skill)
);
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 120),
  organizer_club_id uuid not null references public.clubs(id),
  created_by uuid not null references auth.users(id),
  current_version int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.event_clubs (
  event_id uuid not null references public.events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  required boolean not null default true,
  primary key (event_id, club_id)
);
create table public.proposal_versions (
  event_id uuid not null references public.events(id) on delete cascade,
  version int not null,
  terms jsonb not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (event_id, version)
);
create table public.negotiation_messages (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  version int not null,
  kind public.msg_kind not null,
  author_club_id uuid not null references public.clubs(id),
  body text not null check (char_length(body) between 1 and 2000),
  ai_generated boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.approvals (
  event_id uuid not null,
  version int not null,
  club_id uuid not null references public.clubs(id),
  approved_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (event_id, version, club_id),
  foreign key (event_id, version) references public.proposal_versions(event_id, version)
);
-- Private briefs: separate table, visible ONLY to leaders of the owning club.
create table public.private_briefs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  created_by uuid not null references auth.users(id),
  unique (event_id, club_id)
);
create table public.volunteer_roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  capacity int not null check (capacity between 1 and 500),
  required_skill text
);
create table public.signups (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.volunteer_roles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);
create unique index signups_one_active on public.signups(role_id, user_id) where status = 'confirmed';
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid not null default auth.uid(),
  action text not null,
  event_id uuid,
  detail jsonb,
  at timestamptz not null default now()
);

-- ---------- Grants: SELECT only to authenticated, nothing to anon ----------
revoke all on all tables in schema public from anon, authenticated;
grant select on public.clubs, public.club_members, public.student_skills, public.events, public.event_clubs,
  public.proposal_versions, public.negotiation_messages, public.approvals, public.private_briefs,
  public.volunteer_roles, public.signups to authenticated;
grant all on all tables in schema public to service_role;

alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.student_skills enable row level security;
alter table public.events enable row level security;
alter table public.event_clubs enable row level security;
alter table public.proposal_versions enable row level security;
alter table public.negotiation_messages enable row level security;
alter table public.approvals enable row level security;
alter table public.private_briefs enable row level security;
alter table public.volunteer_roles enable row level security;
alter table public.signups enable row level security;
alter table public.audit_log enable row level security;

-- ---------- Helpers ----------
create or replace function public.is_member(_club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = _club and user_id = auth.uid()) $$;
create or replace function public.is_leader(_club uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from club_members where club_id = _club and user_id = auth.uid() and role = 'leader') $$;
create or replace function public.is_participant(_event uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from event_clubs ec join club_members m on m.club_id = ec.club_id
                 where ec.event_id = _event and m.user_id = auth.uid()) $$;
revoke all on function public.is_member(uuid), public.is_leader(uuid), public.is_participant(uuid) from public, anon;
grant execute on function public.is_member(uuid), public.is_leader(uuid), public.is_participant(uuid) to authenticated;

-- ---------- Policies (read-only; writes only via RPCs) ----------
create policy clubs_read on public.clubs for select to authenticated using (public.is_member(id) or exists (select 1 from public.event_clubs ec where ec.club_id = id and public.is_participant(ec.event_id)));
create policy members_read on public.club_members for select to authenticated using (public.is_member(club_id));
create policy skills_read on public.student_skills for select to authenticated using (user_id = auth.uid());
create policy events_read on public.events for select to authenticated using (public.is_participant(id));
create policy event_clubs_read on public.event_clubs for select to authenticated using (public.is_participant(event_id));
create policy versions_read on public.proposal_versions for select to authenticated using (public.is_participant(event_id));
create policy msgs_read on public.negotiation_messages for select to authenticated using (public.is_participant(event_id));
create policy approvals_read on public.approvals for select to authenticated using (public.is_participant(event_id));
create policy briefs_read on public.private_briefs for select to authenticated using (public.is_leader(club_id));
create policy roles_read on public.volunteer_roles for select to authenticated using (public.is_participant(event_id) and exists (select 1 from public.events e where e.id = event_id and e.published));
create policy signups_read on public.signups for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.volunteer_roles r join public.events e on e.id = r.event_id where r.id = role_id and public.is_leader(e.organizer_club_id)));
-- audit_log: no policies => no direct client access.

-- Approvals immutable, even for privileged callers.
create or replace function public.block_mutation() returns trigger language plpgsql as $$
begin raise exception 'approvals are immutable'; end $$;
create trigger approvals_immutable before update or delete on public.approvals for each row execute function public.block_mutation();

-- ---------- RPCs ----------
create or replace function public.create_club(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into clubs(name, created_by) values (trim(p_name), auth.uid()) returning id into v;
  insert into club_members values (v, auth.uid(), 'leader');
  insert into audit_log(action, detail) values ('create_club', jsonb_build_object('club', v));
  return v; end $$;

create or replace function public.add_member(p_club uuid, p_user uuid, p_role public.club_role) returns void
language plpgsql security definer set search_path = public as $$ begin
  if not is_leader(p_club) then raise exception 'only club leaders can add members'; end if;
  insert into club_members values (p_club, p_user, p_role) on conflict (club_id, user_id) do update set role = excluded.role;
  insert into audit_log(action, detail) values ('add_member', jsonb_build_object('club', p_club, 'user', p_user, 'role', p_role));
end $$;

create or replace function public.create_event(p_title text, p_organizer_club uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid; begin
  if not is_leader(p_organizer_club) then raise exception 'only a leader of the organizing club can create events'; end if;
  insert into events(title, organizer_club_id, created_by) values (trim(p_title), p_organizer_club, auth.uid()) returning id into v;
  insert into event_clubs values (v, p_organizer_club, true);
  insert into audit_log(action, event_id) values ('create_event', v);
  return v; end $$;

create or replace function public.invite_club(p_event uuid, p_club uuid) returns void
language plpgsql security definer set search_path = public as $$ begin
  if not exists (select 1 from events where id = p_event and is_leader(organizer_club_id) and not published) then
    raise exception 'only the organizer leader can invite clubs before publication'; end if;
  insert into event_clubs values (p_event, p_club, true) on conflict do nothing;
end $$;

-- A new version makes earlier approvals irrelevant: approvals bind to a version number.
create or replace function public.propose_version(p_event uuid, p_club uuid, p_terms jsonb, p_kind public.msg_kind, p_body text) returns int
language plpgsql security definer set search_path = public as $$
declare v int; begin
  if not is_leader(p_club) or not exists (select 1 from event_clubs where event_id = p_event and club_id = p_club)
    then raise exception 'only a leader of a participating club can propose'; end if;
  update events set current_version = current_version + 1 where id = p_event and not published returning current_version into v;
  if v is null then raise exception 'event published or missing'; end if;
  insert into proposal_versions values (p_event, v, p_terms, auth.uid());
  insert into negotiation_messages(event_id, version, kind, author_club_id, body, created_by) values (p_event, v, p_kind, p_club, left(p_body, 2000), auth.uid());
  insert into audit_log(action, event_id, detail) values ('propose_version', p_event, jsonb_build_object('version', v));
  return v; end $$;

-- Agent outputs are stored as non-binding messages; they cannot create versions or approvals.
create or replace function public.post_message(p_event uuid, p_club uuid, p_kind public.msg_kind, p_body text, p_ai boolean) returns void
language plpgsql security definer set search_path = public as $$ begin
  if not is_member(p_club) or not exists (select 1 from event_clubs where event_id = p_event and club_id = p_club) then raise exception 'not a participant'; end if;
  insert into negotiation_messages(event_id, version, kind, author_club_id, body, ai_generated, created_by)
  select p_event, current_version, p_kind, p_club, left(p_body, 2000), p_ai, auth.uid() from events where id = p_event;
end $$;

create or replace function public.set_brief(p_event uuid, p_club uuid, p_body text) returns void
language plpgsql security definer set search_path = public as $$ begin
  if not is_leader(p_club) then raise exception 'only club leaders can write briefs'; end if;
  insert into private_briefs(event_id, club_id, body, created_by) values (p_event, p_club, left(p_body, 4000), auth.uid())
  on conflict (event_id, club_id) do update set body = excluded.body;
end $$;

create or replace function public.approve_version(p_event uuid, p_club uuid, p_version int) returns void
language plpgsql security definer set search_path = public as $$
declare cur int; begin
  if not is_leader(p_club) then raise exception 'only a leader of this club can approve'; end if;
  if not exists (select 1 from event_clubs where event_id = p_event and club_id = p_club) then raise exception 'club not in event'; end if;
  select current_version into cur from events where id = p_event for update;
  if cur is distinct from p_version then raise exception 'stale version: current is %', cur; end if;
  insert into approvals(event_id, version, club_id, approved_by) values (p_event, p_version, p_club, auth.uid());
  insert into audit_log(action, event_id, detail) values ('approve', p_event, jsonb_build_object('club', p_club, 'version', p_version));
end $$;

create or replace function public.add_role(p_event uuid, p_title text, p_start timestamptz, p_end timestamptz, p_capacity int, p_skill text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid; begin
  if not exists (select 1 from events where id = p_event and is_leader(organizer_club_id) and not published) then raise exception 'organizer leader only, before publication'; end if;
  insert into volunteer_roles(event_id, title, starts_at, ends_at, capacity, required_skill) values (p_event, p_title, p_start, p_end, p_capacity, nullif(p_skill, '')) returning id into v;
  return v; end $$;

create or replace function public.publish_roles(p_event uuid) returns void
language plpgsql security definer set search_path = public as $$
declare e events; begin
  select * into e from events where id = p_event for update;
  if e.id is null or not is_leader(e.organizer_club_id) then raise exception 'only the organizer leader can publish'; end if;
  if e.current_version = 0 then raise exception 'no proposal'; end if;
  if exists (select 1 from event_clubs ec where ec.event_id = p_event and ec.required
             and not exists (select 1 from approvals a where a.event_id = p_event and a.version = e.current_version and a.club_id = ec.club_id))
    then raise exception 'all required clubs must approve version %', e.current_version; end if;
  update events set published = true where id = p_event;
  insert into audit_log(action, event_id) values ('publish', p_event);
end $$;

-- Atomic: role row lock serialises capacity; per-user advisory lock serialises overlap checks.
create or replace function public.confirm_signup(p_role uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare r volunteer_roles; v uuid; begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into r from volunteer_roles where id = p_role for update;
  if r.id is null or not exists (select 1 from events where id = r.event_id and published) or not is_participant(r.event_id)
    then raise exception 'role not available'; end if;
  if r.required_skill is not null and not exists (select 1 from student_skills where user_id = auth.uid() and skill = r.required_skill)
    then raise exception 'requires skill %', r.required_skill; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if (select count(*) from signups where role_id = p_role and status = 'confirmed') >= r.capacity then raise exception 'role is full'; end if;
  if exists (select 1 from signups s join volunteer_roles o on o.id = s.role_id
             where s.user_id = auth.uid() and s.status = 'confirmed' and tstzrange(o.starts_at, o.ends_at) && tstzrange(r.starts_at, r.ends_at))
    then raise exception 'overlaps an existing shift'; end if;
  insert into signups(role_id, user_id) values (p_role, auth.uid()) returning id into v;
  insert into audit_log(action, event_id, detail) values ('confirm_signup', r.event_id, jsonb_build_object('role', p_role));
  return v; end $$;

create or replace function public.cancel_signup(p_role uuid) returns void
language plpgsql security definer set search_path = public as $$ begin
  update signups set status = 'cancelled' where role_id = p_role and user_id = auth.uid() and status = 'confirmed';
  if not found then raise exception 'no confirmed signup'; end if;
  insert into audit_log(action, detail) values ('cancel_signup', jsonb_build_object('role', p_role));
end $$;

create or replace function public.set_my_skills(p_skills text[]) returns void
language plpgsql security definer set search_path = public as $$ begin
  delete from student_skills where user_id = auth.uid();
  insert into student_skills select auth.uid(), lower(trim(s)) from unnest(p_skills) s where char_length(trim(s)) between 1 and 40;
end $$;

do $$ declare f text; begin
  foreach f in array array['create_club(text)','add_member(uuid,uuid,public.club_role)','create_event(text,uuid)','invite_club(uuid,uuid)',
    'propose_version(uuid,uuid,jsonb,public.msg_kind,text)','post_message(uuid,uuid,public.msg_kind,text,boolean)','set_brief(uuid,uuid,text)',
    'approve_version(uuid,uuid,int)','add_role(uuid,text,timestamptz,timestamptz,int,text)','publish_roles(uuid)','confirm_signup(uuid)',
    'cancel_signup(uuid)','set_my_skills(text[])'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop; end $$;
