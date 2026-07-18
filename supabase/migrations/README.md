# Sacred Circle production migrations

Apply SQL files in filename order and record each applied filename in the deployment log.

1. `202607110001_cleanup_demo_content.sql` removes only the known review media, disclosed review keys, and exact placeholder rows/values.
2. `202607110002_public_content_read_policies.sql` lets the anon website read the safe published catalog while keeping protected audio metadata authenticated.
3. `202607110003_protect_profile_identity_and_role.sql` prevents normal users from changing auth-managed email or promoting their own role.
4. `202607110004_rate_limit_session_unlocks.sql` stores code-free failed-attempt timestamps and permits at most five failures per user/session in a rolling fifteen-minute window.
5. `202607180001_ephemeral_six_digit_playback_access.sql` switches protected media to six-digit per-playback authorization, deactivates legacy key hashes, and purges permanent unlock entitlements.

These files are not applied automatically by this repository. Review them against the target project before running `supabase db push` or executing them in the SQL editor.
