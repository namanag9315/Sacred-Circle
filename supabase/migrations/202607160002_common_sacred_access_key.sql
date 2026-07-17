-- Lets an authenticated administrator rotate one common four-digit key across
-- every published protected recording without storing the plain key.

create or replace function public.set_common_session_access_code(p_plain_code text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  created_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin_required';
  end if;

  if coalesce(p_plain_code, '') !~ '^\d{4}$' then
    raise exception 'four_digit_code_required';
  end if;

  update public.session_access_codes code
  set is_active = false
  where code.is_active = true
    and exists (
      select 1
      from public.resources resource
      where resource.session_id = code.session_id
        and resource.type = 'audio'
        and resource.access_type = 'session_protected'
        and resource.status = 'published'
    );

  insert into public.session_access_codes (
    session_id,
    code_hash,
    code_label,
    starts_at,
    expires_at,
    is_active
  )
  select distinct
    resource.session_id,
    crypt(p_plain_code, gen_salt('bf')),
    'Common Sacred Access Key',
    null,
    null,
    true
  from public.resources resource
  where resource.type = 'audio'
    and resource.access_type = 'session_protected'
    and resource.status = 'published'
    and resource.session_id is not null;

  get diagnostics created_count = row_count;
  return created_count;
end;
$$;

revoke all on function public.set_common_session_access_code(text) from public;
revoke all on function public.set_common_session_access_code(text) from anon;
grant execute on function public.set_common_session_access_code(text) to authenticated;
