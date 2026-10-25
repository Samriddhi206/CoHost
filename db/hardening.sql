-- Reviewed hardening applied together with the initial schema on this new project.
revoke create on schema public from public, anon, authenticated;
alter function public.block_mutation() set search_path = public, pg_temp;
revoke all on function public.block_mutation() from public, anon, authenticated;
do $$ declare r record; begin
 for r in select p.oid::regprocedure fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef loop
  execute format('alter function %s set search_path = public, pg_temp', r.fn);
 end loop;
end $$;

alter table public.private_briefs add column max_contribution numeric check(max_contribution between 0 and 1000000);
alter table public.private_briefs add column available_until timestamptz;
create table public.student_availability (
 user_id uuid primary key references auth.users(id) on delete cascade,
 starts_at timestamptz not null, ends_at timestamptz not null check(ends_at>starts_at)
);
alter table public.student_availability enable row level security;
revoke all on public.student_availability from public, anon, authenticated;
grant select on public.student_availability to authenticated;
create policy availability_self on public.student_availability for select to authenticated using(user_id=(select auth.uid()));
create index club_members_user_idx on public.club_members(user_id);
create index event_clubs_club_idx on public.event_clubs(club_id);
create index roles_event_idx on public.volunteer_roles(event_id);
create index signups_user_idx on public.signups(user_id) where status='confirmed';

create function public.save_my_availability(p_start timestamptz,p_end timestamptz,p_skills text[]) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if p_end<=p_start or p_start is null or p_end is null or cardinality(p_skills)>30 then raise exception 'invalid availability'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 if exists(select 1 from signups s join volunteer_roles r on r.id=s.role_id where s.user_id=auth.uid() and s.status='confirmed' and (r.starts_at<p_start or r.ends_at>p_end or (r.required_skill is not null and not (r.required_skill=any(p_skills))))) then raise exception 'availability or skills would conflict with a confirmed shift'; end if;
 insert into student_availability values(auth.uid(),p_start,p_end) on conflict(user_id) do update set starts_at=excluded.starts_at,ends_at=excluded.ends_at;
 delete from student_skills where user_id=auth.uid();
 insert into student_skills select distinct auth.uid(),lower(trim(s)) from unnest(p_skills) s where char_length(trim(s)) between 1 and 40;
end $$;
revoke all on function public.save_my_availability(timestamptz,timestamptz,text[]) from public,anon;
grant execute on function public.save_my_availability(timestamptz,timestamptz,text[]) to authenticated;
-- Avoid an alternate skill-change path bypassing confirmed-shift checks.
revoke execute on function public.set_my_skills(text[]) from authenticated;

create function public.save_private_brief(p_event uuid,p_club uuid,p_body text,p_max numeric,p_until timestamptz) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if auth.uid() is null or not is_leader(p_club) or not exists(select 1 from event_clubs where event_id=p_event and club_id=p_club) then raise exception 'participating club leader only'; end if;
 perform 1 from events where id=p_event and not published for update;
 if not found then raise exception 'published or missing event'; end if;
 insert into private_briefs(event_id,club_id,body,created_by,max_contribution,available_until) values(p_event,p_club,p_body,auth.uid(),p_max,p_until)
 on conflict(event_id,club_id) do update set body=excluded.body,max_contribution=excluded.max_contribution,available_until=excluded.available_until;
end $$;
revoke all on function public.save_private_brief(uuid,uuid,text,numeric,timestamptz) from public,anon;
grant execute on function public.save_private_brief(uuid,uuid,text,numeric,timestamptz) to authenticated;
revoke execute on function public.set_brief(uuid,uuid,text) from authenticated;

-- Internal validator is not exposed to clients, and never reveals another club's private cap.
create schema if not exists cohost_private;
revoke all on schema cohost_private from public,anon,authenticated;
create function cohost_private.validate_terms(p_event uuid,p_terms jsonb) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare ec record; amount numeric; total numeric=0; budget numeric; st timestamptz; en timestamptz; begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if jsonb_typeof(p_terms)<>'object' or jsonb_typeof(p_terms->'contributions')<>'object' or jsonb_typeof(p_terms->'budget')<>'number' then raise exception 'structured budget and contributions required'; end if;
 budget=(p_terms->>'budget')::numeric;
 st=(p_terms->>'setup_start')::timestamptz; en=(p_terms->>'setup_end')::timestamptz;
 if budget<0 or budget>1000000 or st is null or en is null or en<=st then raise exception 'invalid budget or setup window'; end if;
 for ec in select e.club_id,b.max_contribution,b.available_until from event_clubs e left join private_briefs b on b.event_id=e.event_id and b.club_id=e.club_id where e.event_id=p_event loop
  if jsonb_typeof(p_terms->'contributions'->ec.club_id::text) is distinct from 'number' then raise exception 'every partner needs a numeric contribution'; end if;
  amount=(p_terms->'contributions'->>ec.club_id::text)::numeric;
  if amount<0 or amount>1000000 then raise exception 'invalid contribution'; end if;
  if ec.max_contribution is not null and amount>ec.max_contribution then raise exception 'proposal exceeds a partner constraint'; end if;
  if ec.available_until is not null and en>ec.available_until then raise exception 'setup conflicts with a partner constraint'; end if;
  total=total+amount;
 end loop;
 if total<>budget then raise exception 'contributions must equal the event budget'; end if;
end $$;
revoke all on function cohost_private.validate_terms(uuid,jsonb) from public,anon,authenticated;

create or replace function public.invite_club(p_event uuid,p_club uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ declare e events; begin
 select * into e from events where id=p_event for update;
 if auth.uid() is null or e.id is null or not is_leader(e.organizer_club_id) or e.published then raise exception 'organizer leader only, before publication'; end if;
 if e.current_version<>0 then raise exception 'invite partners before the first proposal'; end if;
 insert into event_clubs values(p_event,p_club,true) on conflict do nothing;
end $$;

create or replace function public.approve_version(p_event uuid,p_club uuid,p_version int) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ declare e events; terms jsonb; begin
 select * into e from events where id=p_event for update;
 if auth.uid() is null or not is_leader(p_club) or not exists(select 1 from event_clubs where event_id=p_event and club_id=p_club) then raise exception 'participating club leader only'; end if;
 if e.published or e.current_version is distinct from p_version then raise exception 'stale or published proposal'; end if;
 select v.terms into terms from proposal_versions v where event_id=p_event and version=p_version;
 perform cohost_private.validate_terms(p_event,terms);
 insert into approvals(event_id,version,club_id,approved_by) values(p_event,p_version,p_club,auth.uid());
 insert into audit_log(action,event_id,detail) values('approve',p_event,jsonb_build_object('club',p_club,'version',p_version));
end $$;

create or replace function public.add_role(p_event uuid,p_title text,p_start timestamptz,p_end timestamptz,p_capacity int,p_skill text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$ declare e events; v uuid; begin
 select * into e from events where id=p_event for update;
 if auth.uid() is null or e.id is null or not is_leader(e.organizer_club_id) or e.published then raise exception 'organizer leader only, before publication'; end if;
 insert into volunteer_roles(event_id,title,starts_at,ends_at,capacity,required_skill) values(p_event,trim(p_title),p_start,p_end,p_capacity,nullif(lower(trim(p_skill)),'')) returning id into v;
 return v;
end $$;

create or replace function public.publish_roles(p_event uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ declare e events; terms jsonb; begin
 select * into e from events where id=p_event for update;
 if auth.uid() is null or e.id is null or not is_leader(e.organizer_club_id) then raise exception 'organizer leader only'; end if;
 if e.published then return; end if;
 if e.current_version=0 then raise exception 'no proposal'; end if;
 if exists(select 1 from event_clubs ec where ec.event_id=p_event and ec.required and not exists(select 1 from approvals a where a.event_id=p_event and a.version=e.current_version and a.club_id=ec.club_id)) then raise exception 'all partners must approve the current version'; end if;
 select v.terms into terms from proposal_versions v where event_id=p_event and version=e.current_version;
 perform cohost_private.validate_terms(p_event,terms);
 if not exists(select 1 from volunteer_roles where event_id=p_event) then raise exception 'add volunteer roles before publication'; end if;
 update events set published=true where id=p_event;
 insert into audit_log(action,event_id) values('publish',p_event);
end $$;

create or replace function public.confirm_signup(p_role uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$ declare r volunteer_roles; v uuid; begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select * into r from volunteer_roles where id=p_role for update;
 if r.id is null or not exists(select 1 from events where id=r.event_id and published) or not is_participant(r.event_id) then raise exception 'role not available'; end if;
 if not exists(select 1 from student_availability where user_id=auth.uid() and starts_at<=r.starts_at and ends_at>=r.ends_at) then raise exception 'shift outside saved availability'; end if;
 if r.required_skill is not null and not exists(select 1 from student_skills where user_id=auth.uid() and skill=r.required_skill) then raise exception 'required skill missing'; end if;
 if (select count(*) from signups where role_id=p_role and status='confirmed')>=r.capacity then raise exception 'role is full'; end if;
 if exists(select 1 from signups s join volunteer_roles o on o.id=s.role_id where s.user_id=auth.uid() and s.status='confirmed' and tstzrange(o.starts_at,o.ends_at,'[)') && tstzrange(r.starts_at,r.ends_at,'[)')) then raise exception 'overlapping shift'; end if;
 insert into signups(role_id,user_id) values(p_role,auth.uid()) returning id into v;
 insert into audit_log(action,event_id,detail) values('confirm_signup',r.event_id,jsonb_build_object('role',p_role));
 return v;
end $$;
-- Organizer must see roles while drafting them, not only after publication.
drop policy roles_read on public.volunteer_roles;
create policy roles_read on public.volunteer_roles for select to authenticated using(public.is_participant(event_id));
