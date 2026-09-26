# Sistem Peminjaman Buku

A book-borrowing management system for a school library, built with Next.js. Staff can record loans, extend them under configurable rules, track overdue items on a dashboard, inspect per-student histories, bulk import/export data via Excel, and manage everything from protected admin pages backed by a zero-config SQLite database.

> The app UI is in Bahasa Indonesia (built for an Indonesian school library), while this README is in English for a wider audience.

## Features

- **Borrowing records** — create, edit, and delete loan entries (student name, NIS, class, book title, category, code, quantity, borrow/return dates)
- **Status tracking** — automatic `Dipinjam` (borrowed) / `Dikembalikan` (returned) / `Terlambat` (overdue) / `Terlambat Dikembalikan` (returned late) statuses, re-synced on every read
- **Extensions with policy guard** — extend a loan from the table (reason optional); max extensions per loan and the overdue window are configurable in settings, overdue loans must be returned first, and every extension is recorded in an auditable history
- **Return-date audit trail** — manual return-date edits made through the edit form are logged to the same history (labeled `Edit manual` vs `Perpanjangan`) without consuming the extension quota
- **Overdue dashboard** — stat cards for overdue, due-soon (configurable window), healthy, and total active loans; cards filter the table on click
- **Borrower history** — click any NIS in the table to see that borrower's full loan history with active/overdue/extension counts (keyed by NIS; teachers sharing NIS `0` fall back to name matching)
- **Search, filter, sort, pagination** — by name/NIS, status, book type, and class
- **Excel import/export** — bulk-load records from `.xlsx`/`.xls` with a per-row validation report (success/failed/skipped-duplicate counts plus grouped row errors); export the full list or a per-month academic-year report, both including extension counts
- **Settings page** — loan periods per book type, max extensions, due-soon window, public-page range, and app title/subtitle; applied live without redeploys
- **Auth & security** — password login (PBKDF2-hashed, auto-migrated from legacy plaintext), 8-hour signed sessions, 10-attempts-per-IP login lockout, failed-login logging, and a developer-gated security log viewer
- **Public page** — read-only view of active loans for students (`/`)

## Pages

| Route | Access | Description |
| --- | --- | --- |
| `/` | Public | Read-only active-loan list with search |
| `/login` | Public | Staff login |
| `/admin/peminjaman` | Authenticated | Full borrowing management (dashboard, table, dialogs) |
| `/admin/settings` | Authenticated | System settings |
| `/admin/security` | Authenticated + developer key | Login/logout activity logs |

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) components + [Sonner](https://sonner.emilkowal.ski) toasts
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for the database
- [SheetJS (xlsx)](https://www.npmjs.com/package/xlsx) for Excel import/export
- [Vitest](https://vitest.dev) for unit tests

## Getting started

### Prerequisites

- Node.js 18.18 or later
- npm (or your package manager of choice)

### Installation

```bash
git clone https://github.com/deanDev5200/peminjaman_buku.git
cd peminjaman_buku
npm install
```

### Set up the database

This project uses a local SQLite database file that is **not** committed to the repo. Create it and load the schema with:

```bash
npm run init-db
```

This creates `src/database/library.db` from `src/database/schema.sql`. The file is gitignored, so each environment (yours, a teammate's, production) has its own local database.

> If the database is missing or empty, create it first with the command above before starting the app. After pulling schema changes, bring an existing database up to date with `npm run migrate-db` (it backs up the file first).

### Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` / `HOST` | No | Dev/production listen address |
| `DB_PATH` | No | Absolute SQLite path (keeps data outside the code folder in production) |
| `AUTH_SECRET` | Yes (production) | Session signing secret — set a strong unique value per deployment |
| `APP_PASSWORD` | Yes | Initial staff password (hashed into the DB on first login) |
| `DEVELOPER_ACCESS_KEY` | No | Unlocks `/admin/security`; page stays locked without it |

### Run the dev server

```bash
npm run dev
```

Open the app in your browser, usually at:

- [http://localhost:3000](http://localhost:3000)
- or your custom port, such as [http://localhost:3005](http://localhost:3005)

### Production build

```bash
npm run build
npm run start
```

For a self-contained deploy (PM2 or plain Node), use `npm run start:standalone` with `.env.production` (see `.env.production.example`, plus `ecosystem.config.js` for a PM2 sample). Point `DB_PATH` outside the deployed folder so redeploys never overwrite loan data.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server with `.env.local` port overrides applied |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run start:standalone` | Run the self-contained standalone server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests (Vitest) |
| `npm run init-db` | Create the local SQLite database from `schema.sql` |
| `npm run migrate-db` | Migrate an existing database to the current schema (with backup) |
| `npm run validate-changes` | Re-sync all borrowing statuses against current dates |

## Settings reference

All editable at `/admin/settings` (stored in the `settings` table):

| Key | Default | Description |
| --- | --- | --- |
| `borrow_limit_pelajaran` | `3` | Loan days for Pelajaran books |
| `borrow_limit_bacaan` | `7` | Loan days for Bacaan books |
| `borrow_limit_guru` | `30` | Loan days for GURU/PEGAWAI |
| `max_extend_count` | `1` | Max extensions per loan (`0` disables extensions) |
| `due_soon_days` | `7` | Dashboard "due soon" window in days |
| `root_view_days` | `30` | How many recent days the public page shows |
| `app_title` / `app_subtitle` | `Jnana Grha Mandara` / `Sistem Peminjaman Buku` | Branding |

## Security notes

- The staff password is stored as a PBKDF2-SHA256 hash (100k iterations, per-password salt). Legacy plaintext entries are upgraded automatically on the next successful login.
- Login allows 10 failed attempts per IP within 15 minutes, then locks out for 5 minutes (`429`). Failures are recorded in Security Logs with IP/device metadata.
- Sessions are HMAC-signed, `HttpOnly` + `SameSite=Lax`, and expire after 8 hours. Changing the password logs the changer out immediately.
- The rate limiter is in-memory, which fits the single-instance standalone deployment but is not shared across processes.

## Project structure

``` bash
src/
├── app/
│   ├── admin/
│   │   ├── peminjaman/page.tsx   # Main management UI (reuses Home)
│   │   ├── settings/page.tsx     # System settings
│   │   ├── security/page.tsx     # Security logs (developer-gated)
│   │   └── layout.tsx            # Shared admin sidebar shell
│   ├── api/
│   │   ├── auth/                 # Login, logout, password change
│   │   ├── admin/security/       # Logs + developer unlock
│   │   ├── borrowings/           # CRUD, extend, return, per-loan history
│   │   ├── excel/                # Import (with validation report) / export
│   │   └── settings/             # Settings read/update
│   ├── login/page.tsx
│   ├── layout.tsx
│   └── page.tsx                  # Public list + admin borrowing UI
├── components/
│   ├── admin-shell.tsx           # Sidebar + mobile nav wrapper
│   ├── borrowing-form.tsx        # Create/edit form with inline validation
│   ├── borrowing-table.tsx       # Table with extend/history/NIS actions
│   ├── confirm-dialog.tsx        # Shared confirm dialog
│   └── ui/                       # shadcn/ui components
├── database/
│   ├── init.ts                   # Creates the SQLite file from schema.sql
│   ├── migrate.ts                # Migrates an existing database file
│   └── schema.sql
└── lib/
    ├── auth.ts                   # Signed sessions + auth cookies
    ├── borrowing-status.ts       # Status resolution rules
    ├── date-utils.ts             # Return-date calculation, overdue checks
    ├── db.ts                     # SQLite operations
    ├── developer-auth.ts         # Developer access key handling
    ├── login-rate-limit.ts       # Per-IP login lockout
    ├── password-store.ts         # PBKDF2 password hashing/verification
    ├── request-metadata.ts       # IP/device parsing for security logs
    ├── security-logger.ts
    ├── settings-client.ts
    ├── types.ts
    └── validation.ts             # Borrowing + import-row validation
```

## Notes on data

The included `schema.sql` only defines table structure — no sample or real student data is committed. If you're contributing or deploying this, treat `library.db` (or wherever `DB_PATH` points) as local/private, since it contains real names, student ID numbers (NIS), password hashes, and session-era security logs once in use.

## License

[MIT](LICENSE) — feel free to use or adapt this for your own school/library.
