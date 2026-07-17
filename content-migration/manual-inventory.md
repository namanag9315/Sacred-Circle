# Manual Content Inventory

Manual review is the source of truth. Crawling can help discover pages and assets, but copied content should be approved by a human before import.

Review these website areas before filling the CSV templates:

- Home
- Programs
- Events and shivir pages
- Videos
- Audio Library
- About
- Contact
- Healing pages
- Blog posts
- Product or resource pages

Migration checklist:

1. Copy text into the matching CSV template.
2. Rewrite lightly for mobile readability without changing meaning.
3. Add `source_url` for every migrated row.
4. Keep `migration_status=manual_review` until approved.
5. Set `migration_status=ready` before import.
6. Ask the client for original audio files.
7. Compress audio to MP3/AAC before upload.
8. Upload public audio under `public/audios/...`.
9. Upload protected Sunday recordings under `protected/sunday-sessions/yyyy-mm-dd/...`.
10. Link protected recordings to the correct `session_id`.
