-- Sacred Circle YouTube thumbnail safety trigger.
-- Run this in Supabase SQL Editor if videos were imported before thumbnail automation was added.

create or replace function public.set_youtube_thumbnail_url()
returns trigger
language plpgsql
as $$
declare
  video_id text;
begin
  if new.youtube_url is null or btrim(new.youtube_url) = '' then
    return new;
  end if;

  video_id := substring(new.youtube_url from '(?:youtu\.be/|youtube\.com/(?:watch\?v=|embed/|shorts/|live/))([A-Za-z0-9_-]{6,})');
  if video_id is null then
    video_id := substring(new.youtube_url from '[?&]v=([A-Za-z0-9_-]{6,})');
  end if;

  if video_id is not null and (
    new.thumbnail_url is null
    or new.thumbnail_url = ''
    or new.thumbnail_url not like 'https://i.ytimg.com/vi/%'
  ) then
    new.thumbnail_url := 'https://i.ytimg.com/vi/' || video_id || '/hqdefault.jpg';
  end if;

  return new;
end;
$$;

drop trigger if exists videos_set_youtube_thumbnail_url on public.videos;
create trigger videos_set_youtube_thumbnail_url
before insert or update of youtube_url, thumbnail_url on public.videos
for each row execute function public.set_youtube_thumbnail_url();

update public.videos
set thumbnail_url = null
where youtube_url is not null
  and (
    thumbnail_url is null
    or thumbnail_url = ''
    or thumbnail_url not like 'https://i.ytimg.com/vi/%'
  );
