begin;

-- Published resources should be visible in the app catalog, including
-- session-protected recordings. The actual file URL remains protected by
-- public.user_can_access_resource() and the get-resource-url edge function.
drop policy if exists "resources catalog read" on public.resources;
drop policy if exists "resources published catalog read" on public.resources;

create policy "resources published catalog read" on public.resources for select
using (status = 'published' or public.is_admin(auth.uid()));

commit;
