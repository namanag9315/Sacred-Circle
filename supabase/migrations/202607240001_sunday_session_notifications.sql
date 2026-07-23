begin;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sunday_session_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
before update on public.notification_preferences
for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists "notification preferences own read" on public.notification_preferences;
create policy "notification preferences own read" on public.notification_preferences for select
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "notification preferences own insert" on public.notification_preferences;
create policy "notification preferences own insert" on public.notification_preferences for insert
with check (user_id = auth.uid());

drop policy if exists "notification preferences own update" on public.notification_preferences;
create policy "notification preferences own update" on public.notification_preferences for update
using (user_id = auth.uid() or public.is_admin(auth.uid()))
with check (user_id = auth.uid() or public.is_admin(auth.uid()));

alter table public.notification_history
  add column if not exists session_id uuid null references public.sessions(id) on delete set null,
  add column if not exists recipient_count integer not null default 0,
  add column if not exists accepted_count integer not null default 0,
  add column if not exists failed_count integer not null default 0,
  add column if not exists status text not null default 'accepted';

comment on table public.notification_preferences is
  'Member opt-in preferences for Sacred Circle notifications. Push permission remains controlled by the device operating system.';

comment on table public.notification_history is
  'Admin push-notification send history. Accepted counts are Expo push tickets, not guaranteed device delivery receipts.';

commit;
