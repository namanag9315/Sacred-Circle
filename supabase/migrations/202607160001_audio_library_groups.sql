-- User-facing audio groups and chronological metadata.
-- "Unlocked" is intentionally not stored here because it is derived per user
-- from public.user_session_unlocks.

alter table public.resources
  add column if not exists audio_group text null,
  add column if not exists recorded_at date null,
  add column if not exists shivir_location text null;

update public.resources r
set audio_group = case
  when r.access_type = 'public' then 'free'
  else 'online_shivir'
end
where r.type = 'audio'
  and r.audio_group is null;

update public.resources r
set recorded_at = coalesce(
  (select s.session_date::date from public.sessions s where s.id = r.session_id),
  r.created_at::date
)
where r.type = 'audio'
  and r.recorded_at is null;

alter table public.resources
  drop constraint if exists resources_audio_group_check,
  add constraint resources_audio_group_check
    check (audio_group is null or audio_group in ('free', 'online_shivir', 'offline_shivir')),
  drop constraint if exists offline_shivir_requires_location,
  add constraint offline_shivir_requires_location
    check (audio_group <> 'offline_shivir' or nullif(trim(shivir_location), '') is not null);

create index if not exists idx_resources_audio_group_recorded_at
  on public.resources(audio_group, recorded_at desc)
  where type = 'audio';
