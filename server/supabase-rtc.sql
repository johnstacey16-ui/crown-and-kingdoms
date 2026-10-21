-- Additive, opt-in WebRTC signaling. Apply after ck_free_relay_v1.
-- Only admitted Auth identities can exchange immutable SDP/DTLS fingerprints.
alter table ck_relay.rooms add column rtc_offer text, add column rtc_answer text;
create function ck_relay.signal(credential text, data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  caller uuid:=auth.uid();
  roster jsonb;
  r ck_relay.rooms%rowtype;
  description text;
  prior text;
  result jsonb;
begin
  if caller is null then raise exception 'Authentication required' using errcode='42501'; end if;
  -- Reuse the existing credential, TTL, rate, monthly budget and global lock.
  roster:=ck_relay.request('roster',credential,'{}'::jsonb);
  if data is null or jsonb_typeof(data)<>'object' or octet_length(data::text)>12288
    or not (data ? 'matchId') or jsonb_typeof(data->'matchId')<>'string'
    or data->>'matchId'<>roster->>'matchId' then raise exception 'Wrong signaling match' using errcode='22023'; end if;
  select * into r from ck_relay.rooms where host=caller or guest=caller for update;
  if r.guest is null then raise exception 'Waiting for peer' using errcode='22023'; end if;
  if data='{}'::jsonb then raise exception 'Match required' using errcode='22023'; end if;
  if data-array['matchId']='{}'::jsonb then
    result:=jsonb_build_object('matchId',r.match_id,'offer',r.rtc_offer,'answer',r.rtc_answer);
    update ck_relay.budget set response_bytes=response_bytes+octet_length(result::text)
      where month=date_trunc('month',clock_timestamp() at time zone 'UTC')::date;
    return result;
  end if;
  if not (data ?& array['matchId','type','sdp']) or data-array['matchId','type','sdp']<>'{}'::jsonb
    or jsonb_typeof(data->'type')<>'string' or jsonb_typeof(data->'sdp')<>'string'
    or data->>'type'<>case when r.host=caller then 'offer' else 'answer' end then
    raise exception 'Signaling role or fields invalid' using errcode='42501';
  end if;
  description:=data->>'sdp';
  if octet_length(description)>8192 or left(description,5)<>E'v=0\r\n'
    or position('a=fingerprint:sha-256 ' in description)=0 then raise exception 'Invalid SDP' using errcode='22023'; end if;
  if r.guest=caller and r.rtc_offer is null then raise exception 'Offer required' using errcode='22023'; end if;
  prior:=case when r.host=caller then r.rtc_offer else r.rtc_answer end;
  if prior is not null and prior<>description then raise exception 'Signaling is immutable' using errcode='42501'; end if;
  if r.host=caller then update ck_relay.rooms set rtc_offer=description where id=r.id;
  else update ck_relay.rooms set rtc_answer=description where id=r.id; end if;
  return jsonb_build_object('published',true);
end $$;
revoke all on function ck_relay.signal(text,jsonb) from public,anon,authenticated;
create function public.ck_relay_signal(credential text, data jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select ck_relay.signal(credential,data);
$$;
revoke all on function public.ck_relay_signal(text,jsonb) from public,anon,authenticated;
grant execute on function ck_relay.signal(text,jsonb) to authenticated;
grant execute on function public.ck_relay_signal(text,jsonb) to authenticated;
