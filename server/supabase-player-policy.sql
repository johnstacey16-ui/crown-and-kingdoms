-- The unused legacy table has no ownership field. Keep it inaccessible rather
-- than retain broad policies that could expose it if grants are reintroduced.
alter table public.player enable row level security;
revoke all on table public.player from public,anon,authenticated;
drop policy if exists "Allow all delete" on public.player;
drop policy if exists "Allow all updates " on public.player;
drop policy if exists "Enable insert for authenticated users only" on public.player;
drop policy if exists "Enable read access for all users" on public.player;
