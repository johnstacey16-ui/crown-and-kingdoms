-- Free-plan, opt-in relay v1. Apply atomically with Supabase apply_migration.
-- No client table access; the single RPC derives identity from verified auth.uid().
-- Do not expose ck_relay as a Data API schema.
create schema ck_relay;
revoke all on schema ck_relay from public, anon, authenticated;
create table ck_relay.budget (
  month date primary key, requests integer not null default 0,
  messages integer not null default 0, response_bytes bigint not null default 0
);
create table ck_relay.sessions (
  uid uuid primary key, sid text unique not null, token_hash bytea not null,
  expires timestamptz not null, deadline timestamptz not null,
  window_start timestamptz not null, request_count integer not null default 0
);
create table ck_relay.rooms (
  id text primary key, match_id text unique not null,
  host uuid unique not null references ck_relay.sessions(uid) on delete cascade,
  guest uuid unique references ck_relay.sessions(uid) on delete cascade,
  next_host bigint not null default 1, next_guest bigint not null default 1,
  ack_host bigint not null default 0, ack_guest bigint not null default 0,
  check (guest is null or guest <> host)
);
create table ck_relay.messages (
  room_id text not null references ck_relay.rooms(id) on delete cascade,
  recipient smallint not null check (recipient in (0,1)),
  sequence bigint not null, envelope jsonb not null,
  primary key (room_id, recipient, sequence)
);
alter table ck_relay.budget enable row level security;
alter table ck_relay.sessions enable row level security;
alter table ck_relay.rooms enable row level security;
alter table ck_relay.messages enable row level security;
revoke all on all tables in schema ck_relay from public, anon, authenticated;
-- Old empty marker table has no ownership column and permissive write policies.
-- Preserve its structure/data but remove browser access before guest Auth is enabled.
revoke all on table public.player from public, anon, authenticated;

create function ck_relay.request(op text, credential text, data jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  t timestamptz := clock_timestamp();
  s ck_relay.sessions%rowtype;
  r ck_relay.rooms%rowtype;
  b ck_relay.budget%rowtype;
  slot integer;
  peer integer;
  seq bigint;
  last_sent bigint;
  result jsonb;
  fresh_token text;
  fresh_sid text;
  month_start date := date_trunc('month', t at time zone 'UTC')::date;
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if op is null or op not in ('sessions','create','join','roster','send','poll','ack','close')
    or data is null or jsonb_typeof(data) <> 'object' or octet_length(data::text) > 4096 then
    raise exception 'Invalid request' using errcode='22023';
  end if;
  -- Serialize the deliberately small free lobby. This also makes admission, queue
  -- accounting, closing and quota checks atomic, including concurrent joins.
  perform pg_advisory_xact_lock(736421981);
  t := clock_timestamp();
  delete from ck_relay.sessions where expires <= t or deadline <= t;
  delete from ck_relay.budget where month < month_start;
  insert into ck_relay.budget(month) values(month_start) on conflict do nothing;
  select * into b from ck_relay.budget where month=month_start for update;
  if op <> 'close' and (b.requests >= 1000000 or b.messages >= 100000 or b.response_bytes >= 250000000) then
    raise exception 'Free relay allowance exhausted' using errcode='54000';
  end if;
  if op = 'sessions' then
    if data <> '{}'::jsonb or credential is not null then raise exception 'Unexpected fields' using errcode='22023'; end if;
    if exists(select 1 from ck_relay.sessions where uid=caller) then
      raise exception 'An active session already exists' using errcode='23505';
    end if;
    if (select count(*) from ck_relay.sessions) >= 16 then raise exception 'Free lobby full' using errcode='54000'; end if;
    fresh_token := translate(rtrim(encode(extensions.gen_random_bytes(32),'base64'),'='),'+/','-_');
    fresh_sid := translate(rtrim(encode(extensions.gen_random_bytes(32),'base64'),'='),'+/','-_');
    insert into ck_relay.sessions(uid,sid,token_hash,expires,deadline,window_start)
      values(caller,fresh_sid,extensions.digest(fresh_token,'sha256'),t+interval '30 minutes',t+interval '2 hours',t);
    result := jsonb_build_object('token',fresh_token,'sid',fresh_sid,'expires',floor(extract(epoch from (t+interval '30 minutes'))*1000)::bigint);
  else
    if credential is null or credential !~ '^[A-Za-z0-9_-]{43}$' then raise exception 'Valid session required' using errcode='42501'; end if;
    select * into s from ck_relay.sessions where uid=caller and token_hash=extensions.digest(credential,'sha256') for update;
    if not found then raise exception 'Valid session required' using errcode='42501'; end if;
    if t-s.window_start >= interval '1 second' then s.window_start:=t; s.request_count:=0; end if;
    if s.request_count >= 120 and op <> 'close' then raise exception 'Session rate limit reached' using errcode='54000'; end if;
    update ck_relay.sessions set window_start=s.window_start,request_count=s.request_count+1,
      expires=least(t+interval '30 minutes',deadline) where uid=caller;
    select * into r from ck_relay.rooms where host=caller or guest=caller for update;
    if op='close' then
      if data <> '{}'::jsonb then raise exception 'Unexpected fields' using errcode='22023'; end if;
      delete from ck_relay.sessions where uid=caller;
      result:=jsonb_build_object('closed',true);
    elsif op='create' then
      if data <> '{}'::jsonb then raise exception 'Unexpected fields' using errcode='22023'; end if;
      if r.id is not null then raise exception 'Already in a room' using errcode='23505'; end if;
      if (select count(*) from ck_relay.rooms) >= 8 then raise exception 'Free lobby full' using errcode='54000'; end if;
      insert into ck_relay.rooms(id,match_id,host) values(
        translate(rtrim(encode(extensions.gen_random_bytes(32),'base64'),'='),'+/','-_'),
        translate(rtrim(encode(extensions.gen_random_bytes(32),'base64'),'='),'+/','-_'),caller) returning * into r;
      result:=jsonb_build_object('roomId',r.id,'matchId',r.match_id,'team',0);
    elsif op='join' then
      if (data - 'roomId') <> '{}'::jsonb or jsonb_typeof(data->'roomId') <> 'string'
        or not (data ? 'roomId') or (data->>'roomId') !~ '^[A-Za-z0-9_-]{43}$' then raise exception 'Invalid invitation' using errcode='22023'; end if;
      if r.id is not null then raise exception 'Already in a room' using errcode='23505'; end if;
      select * into r from ck_relay.rooms where id=data->>'roomId' for update;
      if not found or r.guest is not null then raise exception 'Room unavailable' using errcode='22023'; end if;
      update ck_relay.rooms set guest=caller where id=r.id;
      result:=jsonb_build_object('matchId',r.match_id,'team',1);
    else
      if r.id is null then raise exception 'No active room' using errcode='22023'; end if;
      slot:=case when r.host=caller then 0 else 1 end;
      peer:=1-slot;
      if op='roster' then
        if data <> '{}'::jsonb then raise exception 'Unexpected fields' using errcode='22023'; end if;
        result:=jsonb_build_object('matchId',r.match_id,'team',slot,'members',(
          select jsonb_agg(jsonb_build_object('sid',x.sid,'team',x.team) order by x.team)
          from (select sid,case when uid=r.host then 0 else 1 end as team from ck_relay.sessions where uid in (r.host,r.guest)) x));
      elsif op='send' then
        if not (data ?& array['matchId','kind','payload']) or (data-array['matchId','kind','payload']) <> '{}'::jsonb
          or jsonb_typeof(data->'matchId') <> 'string' or data->>'matchId' <> r.match_id then raise exception 'Wrong match or fields' using errcode='22023'; end if;
        if jsonb_typeof(data->'kind') <> 'string' or not (data->>'kind'=any(case when slot=0 then
          array['frame','receipt','setup','commit','run','result'] else array['command','ack','ready','committed','run-ready'] end)) then
          raise exception 'Sender role cannot send this message' using errcode='42501'; end if;
        if jsonb_typeof(data->'payload') <> 'object' or octet_length((data->'payload')::text)>1024 then raise exception 'Invalid payload' using errcode='22023'; end if;
        if r.guest is null then raise exception 'Waiting for peer' using errcode='22023'; end if;
        if (select count(*) from ck_relay.messages where room_id=r.id and recipient=peer)>=256 then raise exception 'Peer queue exhausted' using errcode='54000'; end if;
        seq:=case when peer=0 then r.next_host else r.next_guest end;
        insert into ck_relay.messages values(r.id,peer,seq,jsonb_build_object(
          'matchId',r.match_id,'senderSid',s.sid,'team',slot,'sequence',seq,'kind',data->>'kind','payload',data->'payload'));
        update ck_relay.rooms set next_host=next_host+case when peer=0 then 1 else 0 end,
          next_guest=next_guest+case when peer=1 then 1 else 0 end where id=r.id;
        update ck_relay.budget set messages=messages+1 where month=month_start;
        result:=jsonb_build_object('sequence',seq);
      elsif op='poll' then
        if data <> '{}'::jsonb then raise exception 'Unexpected fields' using errcode='22023'; end if;
        result:=jsonb_build_object('messages',coalesce((select jsonb_agg(m.envelope order by m.sequence) from
          (select envelope,sequence from ck_relay.messages where room_id=r.id and recipient=slot order by sequence limit 32) m),'[]'::jsonb));
      elsif op='ack' then
        if not (data ?& array['matchId','sequence']) or (data-array['matchId','sequence']) <> '{}'::jsonb
          or jsonb_typeof(data->'matchId') <> 'string' or data->>'matchId' <> r.match_id
          or jsonb_typeof(data->'sequence') <> 'number' or (data->>'sequence') !~ '^[0-9]{1,15}$' then raise exception 'Invalid receipt' using errcode='22023'; end if;
        seq:=(data->>'sequence')::bigint;
        last_sent:=case when slot=0 then r.next_host else r.next_guest end;
        if seq<1 or seq>=last_sent then raise exception 'Invalid receipt' using errcode='22023'; end if;
        delete from ck_relay.messages where room_id=r.id and recipient=slot and sequence<=seq;
        update ck_relay.rooms set ack_host=case when slot=0 then greatest(ack_host,seq) else ack_host end,
          ack_guest=case when slot=1 then greatest(ack_guest,seq) else ack_guest end where id=r.id;
        result:=jsonb_build_object('acknowledged',seq);
      end if;
    end if;
  end if;
  update ck_relay.budget set requests=requests+1,response_bytes=response_bytes+octet_length(result::text)+1024 where month=month_start;
  return result;
end $$;
revoke all on function ck_relay.request(text,text,jsonb) from public, anon, authenticated;
-- Invoker wrapper is the only Data API endpoint; privileged implementation stays private.
create function public.ck_relay_request(op text, credential text default null, data jsonb default '{}'::jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select ck_relay.request(op,credential,data);
$$;
revoke all on function public.ck_relay_request(text,text,jsonb) from public, anon, authenticated;
grant usage on schema ck_relay to authenticated;
grant execute on function ck_relay.request(text,text,jsonb) to authenticated;
grant execute on function public.ck_relay_request(text,text,jsonb) to authenticated;
