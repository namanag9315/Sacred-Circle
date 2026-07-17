begin;

create or replace function public.protect_profile_identity_and_role()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile_id_immutable';
  end if;

  if coalesce(auth.jwt() ->> 'role', '') = 'service_role'
     or current_user in ('postgres', 'supabase_admin', 'service_role')
     or public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.email is distinct from old.email then
    raise exception 'profile_email_managed_by_auth';
  end if;

  if new.role is distinct from old.role then
    raise exception 'profile_role_admin_only';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_identity_and_role on public.profiles;
create trigger profiles_protect_identity_and_role
before update on public.profiles
for each row execute function public.protect_profile_identity_and_role();

-- A missing profile may be recreated only as the caller's own normal-user row.
-- Admins retain the existing operational ability to create a managed profile.
drop policy if exists "profiles own insert" on public.profiles;
create policy "profiles own insert" on public.profiles for insert
with check (
  public.is_admin(auth.uid())
  or (
    id = auth.uid()
    and role = 'user'
    and email = coalesce(auth.jwt() ->> 'email', '')
  )
);

comment on function public.protect_profile_identity_and_role() is
  'Prevents a signed-in user from changing the auth-managed email or promoting their own profile role.';

commit;
