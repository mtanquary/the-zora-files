# SQL scripts

Utility scripts for managing the Zora Files database. These work on both local Postgres and Supabase.

## How to run

**Local Postgres:**
```bash
PGPASSWORD=myP0stgr3s2026 psql -U postgres -d zorafiles -f docs/sql/<filename>.sql
```

**Supabase (production):**
Copy the SQL into the Supabase Dashboard > SQL Editor and run it there.
(Direct psql to Supabase may fail due to IPv6 DNS issues on some networks.)

## Scripts

| File | Purpose |
|------|---------|
| `reset-all-data.sql` | Wipe all episodes, discoveries, and records. Fresh start. |
| `reset-discoveries.sql` | Clear discoveries only, keep episodes. |
| `fix-episode-numbering.sql` | Re-number episodes sequentially if gaps exist. |
| `fix-orphaned-discoveries.sql` | Remove discoveries that reference deleted episodes. |
| `add-detection-method.sql` | Add detection_method column if missing (schema migration). |
| `view-status.sql` | Quick overview of database state. |
