-- Club roles checks. Run inside a transaction; everything rolls back.
begin;
create temp table r(n serial, ok boolean, what text);
grant insert, select on r to authenticated; grant usage on sequence r_n_seq to authenticated;
insert into auth.users values ('a0000000-0000-0000-0000-000000000001','pres@example.invalid'),('a0000000-0000-0000-0000-000000000002','off@example.invalid'),('a0000000-0000-0000-0000-000000000003','mem@example.invalid'),('a0000000-0000-0000-0000-000000000004','out@example.invalid');
create temp table club(id uuid); grant select, insert on club to authenticated;
create or replace function pg_temp.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true) $$;
create or replace function pg_temp.check(ok boolean, what text) returns void language sql as $$ insert into r(ok, what) values (ok, what) $$;
create or replace function pg_temp.fails(q text) returns boolean language plpgsql as $$ begin execute q; return false; exception when others then return true; end $$;

select pg_temp.as_user('a0000000-0000-0000-0000-000000000001'); set local role authenticated;
insert into club select public.create_club('Coding Club');
select public.set_my_name('Maya');
select pg_temp.check((select title from club_members where user_id = auth.uid()) = 'President', 'club creator becomes President');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000002'); set local role authenticated;
select public.set_my_name('Ava');
select public.request_membership_as((select id from club), 'Budget officer');
select pg_temp.check((select count(*) from club_members) = 0, 'requesting a role grants nothing yet');
select pg_temp.check(pg_temp.fails(format('select public.request_membership_as(%L, %L)', (select id from club), 'Emperor')), 'unknown role rejected');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000003'); set local role authenticated;
select public.set_my_name('Eli');
select public.request_membership_as((select id from club), 'President');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000001'); set local role authenticated;
select pg_temp.check((select count(*) from profiles) = 3, 'officer sees names of people asking to join');
select public.accept_membership((select id from club), 'a0000000-0000-0000-0000-000000000002');
select pg_temp.check((select title from club_members where user_id = 'a0000000-0000-0000-0000-000000000002') = 'Budget officer' and (select role::text from club_members where user_id = 'a0000000-0000-0000-0000-000000000002') = 'leader', 'accepted as Budget officer, an officer');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000002'); set local role authenticated;
select pg_temp.check(pg_temp.fails(format('select public.accept_membership(%L, %L)', (select id from club), 'a0000000-0000-0000-0000-000000000003')), 'Budget officer cannot grant President');
select pg_temp.check(pg_temp.fails(format('select public.set_member_title(%L, %L, %L)', (select id from club), 'a0000000-0000-0000-0000-000000000001', 'Member')), 'cannot demote a more senior officer');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000001'); set local role authenticated;
select public.accept_membership((select id from club), 'a0000000-0000-0000-0000-000000000003');
select public.set_member_title((select id from club), 'a0000000-0000-0000-0000-000000000003', 'Member');
select pg_temp.check((select role::text from club_members where user_id = 'a0000000-0000-0000-0000-000000000003') = 'member', 'President can set someone to Member');
select pg_temp.check(pg_temp.fails(format('select public.set_member_title(%L, %L, %L)', (select id from club), 'a0000000-0000-0000-0000-000000000001', 'Member')), 'last President cannot step down');
reset role;
insert into events(id, title, organizer_club_id, created_by) values ('e0000000-0000-0000-0000-000000000001', 'Hack Night', (select id from club), 'a0000000-0000-0000-0000-000000000001');
insert into event_clubs values ('e0000000-0000-0000-0000-000000000001', (select id from club), true);
insert into proposal_versions(event_id, version, terms, created_by) values ('e0000000-0000-0000-0000-000000000001', 1, '{}', 'a0000000-0000-0000-0000-000000000001');
select pg_temp.as_user('a0000000-0000-0000-0000-000000000001'); set local role authenticated;
select public.set_event_details('e0000000-0000-0000-0000-000000000001', '2026-11-06 18:00-07', '2026-11-06 21:00-07', 'Engineering Hall 101');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000003'); set local role authenticated;
select pg_temp.check((select location from events) = 'Engineering Hall 101', 'member sees where and when');
select pg_temp.check((select count(*) from proposal_versions) = 0, 'member cannot see the plan');
select pg_temp.check(pg_temp.fails(format('select public.set_event_details(%L, now(), now() + interval ''1 hour'', %L)', 'e0000000-0000-0000-0000-000000000001', 'x')), 'member cannot edit event details');
select pg_temp.check((select count(*) from profiles) = 3, 'member sees clubmates names');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000002'); set local role authenticated;
select pg_temp.check((select count(*) from proposal_versions) = 1, 'officer sees the plan');

reset role; select pg_temp.as_user('a0000000-0000-0000-0000-000000000004'); set local role authenticated;
select pg_temp.check((select count(*) from profiles) = 0 and (select count(*) from events) = 0, 'outsider sees no names or events');
select pg_temp.check(pg_temp.fails(format('insert into club_members(club_id, user_id, role, title) values (%L, auth.uid(), ''leader'', ''President'')', (select id from club))), 'no direct self-insert as President');

reset role;
insert into auth.users values ('a0000000-0000-0000-0000-000000000005', 'legacy@example.invalid');
insert into club_members(club_id, user_id, role) values ((select id from club), 'a0000000-0000-0000-0000-000000000005', 'leader');
select pg_temp.check((select title from club_members where user_id = 'a0000000-0000-0000-0000-000000000005') = 'President', 'older leader-only inserts get a title');

select n, case when ok then 'ok  ' else 'FAIL' end, what from r order by n;
rollback;
