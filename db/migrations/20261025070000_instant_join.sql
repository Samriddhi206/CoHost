-- Joining a club as a Member is instant: no officer approval. Officer roles still need an officer at
-- or above that role to confirm, otherwise anyone could make themselves President of any club.
create or replace function cohost_private.request_membership_as(p_club uuid, p_title text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$ begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if cohost_private.title_rank(p_title) is null then raise exception 'unknown role'; end if;
  if not exists (select 1 from clubs where id = p_club) then raise exception 'unknown club'; end if;
  if is_member(p_club) then raise exception 'already a member'; end if;
  if p_title = 'Member' then
    insert into club_members(club_id, user_id, role, title) values (p_club, auth.uid(), 'member', 'Member');
    insert into membership_requests(club_id, user_id, status, requested_title) values (p_club, auth.uid(), 'accepted', 'Member')
    on conflict (club_id, user_id) do update set status = 'accepted', requested_title = 'Member';
    insert into audit_log(action, detail) values ('join_club', jsonb_build_object('club', p_club));
    return;
  end if;
  insert into membership_requests(club_id, user_id, status, requested_title) values (p_club, auth.uid(), 'pending', p_title)
  on conflict (club_id, user_id) do update set requested_title = excluded.requested_title, status = 'pending'
  where membership_requests.status = 'pending';
end $$;
