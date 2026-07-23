begin;

-- Sacred Circle has one administrator identity. Checking the confirmed Auth
-- email here hardens every RLS policy and RPC that delegates to is_admin.
create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    join auth.users auth_user on auth_user.id = profile.id
    where profile.id = check_user
      and profile.role = 'admin'
      and lower(profile.email) = 'sacredcircle45@gmail.com'
      and lower(coalesce(auth_user.email, '')) = 'sacredcircle45@gmail.com'
      and auth_user.email_confirmed_at is not null
  );
$$;

-- Retire any legacy administrator role. The official account is provisioned
-- before this migration is deployed and remains the sole administrator.
update public.profiles
set role = case
  when lower(email) = 'sacredcircle45@gmail.com' then 'admin'
  else 'user'
end
where role = 'admin' or lower(email) = 'sacredcircle45@gmail.com';

commit;
