begin;

update public.videos
set category = case
  when coalesce(category, '') ilike '%meditation%'
    or coalesce(title, '') ilike '%meditation%'
    or coalesce(description, '') ilike '%meditation%'
    then 'Guided Meditation'
  else 'Normal Sessions'
end
where category is distinct from case
  when coalesce(category, '') ilike '%meditation%'
    or coalesce(title, '') ilike '%meditation%'
    or coalesce(description, '') ilike '%meditation%'
    then 'Guided Meditation'
  else 'Normal Sessions'
end;

comment on column public.videos.category is
  'Member-facing video type. Admin-managed values are Normal Sessions and Guided Meditation.';

commit;
