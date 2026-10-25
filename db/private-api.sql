grant usage on schema cohost_private to authenticated;
create policy audit_deny on public.audit_log for select to authenticated using(false);
do $$ declare f record; callargs text; begin
for f in select p.oid,p.proname,pg_get_function_identity_arguments(p.oid) ident,pg_get_function_arguments(p.oid) args,pg_get_function_result(p.oid) result,p.proargnames,p.pronargs,p.provolatile from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and has_function_privilege('authenticated',p.oid,'EXECUTE') loop
select string_agg(quote_ident(x),',') into callargs from unnest(f.proargnames[1:f.pronargs]) x;
execute format('alter function public.%I(%s) set schema cohost_private',f.proname,f.ident);
execute format('create function public.%I(%s) returns %s language sql security invoker %s set search_path='''' as %L',f.proname,f.args,f.result,case when f.provolatile='s' then 'stable' else 'volatile' end,format('select * from cohost_private.%I(%s)',f.proname,coalesce(callargs,'')));
execute format('revoke all on function public.%I(%s) from public,anon',f.proname,f.ident);
execute format('grant execute on function public.%I(%s) to authenticated',f.proname,f.ident);
end loop; end $$;
