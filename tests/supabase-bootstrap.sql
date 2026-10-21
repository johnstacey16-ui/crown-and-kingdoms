-- Disposable PostgreSQL test database ONLY. Supabase provides these in production.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create schema extensions;
create extension pgcrypto with schema extensions;
create table public.player(id bigint generated always as identity primary key, name text);
grant all on public.player to anon,authenticated;
