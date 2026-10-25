create table public.membership_requests(
 club_id uuid references public.clubs(id),user_id uuid references auth.users(id),status text not null default 'pending' check(status in('pending','accepted')),
 primary key(club_id,user_id)
);
alter table public.membership_requests enable row level security;
revoke all on public.membership_requests from public,anon,authenticated;
grant select on public.membership_requests to authenticated;
create policy requests_read on public.membership_requests for select to authenticated using(user_id=auth.uid() or public.is_leader(club_id));

create function public.club_directory() returns table(id uuid,name text)
language sql stable security definer set search_path=public,pg_temp as $$ select id,name from clubs where auth.uid() is not null order by name limit 200 $$;
create function public.request_membership(p_club uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if auth.uid() is null then raise exception 'not authenticated'; end if;
 if is_member(p_club) then raise exception 'already a member'; end if;
 insert into membership_requests(club_id,user_id) values(p_club,auth.uid()) on conflict do nothing;
end $$;
create function public.accept_membership(p_club uuid,p_user uuid) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ begin
 if auth.uid() is null or not is_leader(p_club) then raise exception 'club leader only'; end if;
 update membership_requests set status='accepted' where club_id=p_club and user_id=p_user and status='pending';
 if not found then raise exception 'no pending request'; end if;
 insert into club_members values(p_club,p_user,'member') on conflict do nothing;
end $$;
-- A private brief update invalidates earlier approvals by creating a new version.
create or replace function public.save_private_brief(p_event uuid,p_club uuid,p_body text,p_max numeric,p_until timestamptz) returns void
language plpgsql security definer set search_path=public,pg_temp as $$ declare e events; t jsonb; begin
 if auth.uid() is null or not is_leader(p_club) or not exists(select 1 from event_clubs where event_id=p_event and club_id=p_club) then raise exception 'participating club leader only'; end if;
 select * into e from events where id=p_event for update;
 if e.id is null or e.published then raise exception 'published or missing event'; end if;
 insert into private_briefs(event_id,club_id,body,created_by,max_contribution,available_until) values(p_event,p_club,p_body,auth.uid(),p_max,p_until)
 on conflict(event_id,club_id) do update set body=excluded.body,max_contribution=excluded.max_contribution,available_until=excluded.available_until;
 if e.current_version>0 then
  select terms into t from proposal_versions where event_id=p_event and version=e.current_version;
  update events set current_version=current_version+1 where id=p_event;
  insert into proposal_versions(event_id,version,terms,created_by) values(p_event,e.current_version+1,t,auth.uid());
  insert into negotiation_messages(event_id,version,kind,author_club_id,body,created_by) values(p_event,e.current_version+1,'note',p_club,'Private constraints changed. Earlier approvals no longer count.',auth.uid());
 end if;
end $$;

-- Bounded rules-based agents share offers derived from structured briefs, never raw private text.
create function public.coordinate_event(p_event uuid,p_club uuid,p_budget numeric,p_setup_end timestamptz) returns int
language plpgsql security definer set search_path=public,pg_temp as $$
declare e events; partner record; contributions jsonb='{}'; remaining numeric=p_budget; offer numeric; finish timestamptz=p_setup_end; v int; terms jsonb; begin
 select * into e from events where id=p_event for update;
 if auth.uid() is null or e.id is null or e.published or not is_leader(p_club) or not exists(select 1 from event_clubs where event_id=p_event and club_id=p_club) then raise exception 'participating leader only, before publication'; end if;
 if p_budget is null or p_budget<0 or p_budget>1000000 or p_setup_end is null then raise exception 'invalid budget or time'; end if;
 -- Every leader must set a brief first: absence never means consent to spend.
 if exists(select 1 from event_clubs ec left join private_briefs b on b.event_id=ec.event_id and b.club_id=ec.club_id where ec.event_id=p_event and b.max_contribution is null) then raise exception 'Every partner leader must save a contribution limit first'; end if;
 for partner in select ec.club_id,b.max_contribution,b.available_until from event_clubs ec join private_briefs b on b.event_id=ec.event_id and b.club_id=ec.club_id where ec.event_id=p_event order by (ec.club_id=e.organizer_club_id) desc,ec.club_id loop
  offer=least(partner.max_contribution,remaining);
  remaining=remaining-offer;
  contributions=contributions||jsonb_build_object(partner.club_id::text,offer);
  if partner.available_until is not null then finish=least(finish,partner.available_until); end if;
 end loop;
 if remaining>0 then raise exception 'Funding gap remains. Ask partners to revise their private limits or reduce the event budget.'; end if;
 terms=jsonb_build_object('budget',p_budget,'contributions',contributions,'setup_start',finish-interval '1 hour','setup_end',finish,'credit','All partners receive co-host credit');
 perform cohost_private.validate_terms(p_event,terms);
 v=e.current_version+1;
 update events set current_version=v where id=p_event;
 insert into proposal_versions(event_id,version,terms,created_by) values(p_event,v,terms,auth.uid());
 for partner in select club_id from event_clubs where event_id=p_event loop
  insert into negotiation_messages(event_id,version,kind,author_club_id,body,created_by) values(p_event,v,'offer',partner.club_id,format('Rules-based agent offer: $%s pledged if approved; co-host credit requested. No commitment until leader approval.',contributions->>partner.club_id::text),auth.uid());
 end loop;
 insert into negotiation_messages(event_id,version,kind,author_club_id,body,created_by) values(p_event,v,'counteroffer',p_club,format('Coordinated setup: %s to %s. Funding covers $%s. Each leader must approve version %s.',finish-interval '1 hour',finish,p_budget,v),auth.uid());
 return v;
end $$;
revoke all on function public.club_directory(),public.request_membership(uuid),public.accept_membership(uuid,uuid),public.coordinate_event(uuid,uuid,numeric,timestamptz) from public,anon;
grant execute on function public.club_directory(),public.request_membership(uuid),public.accept_membership(uuid,uuid),public.coordinate_event(uuid,uuid,numeric,timestamptz) to authenticated;
