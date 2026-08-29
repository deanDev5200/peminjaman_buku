# Sistem Peminjaman Buku

A simple book-borrowing management system for a school library, built with Next.js. Staff can record loans, mark books as returned, track overdue items, search records, and bulk import/export data via Excel.

> The app UI is in Bahasa Indonesia (built for an Indonesian school library), while this README is in English for a wider audience.

## Features

- **Borrowing records** — create, edit, and delete loan entries (student name, NIS, class, book title, category, code, quantity, borrow/return dates)
- **Status tracking** — automatic Dipinjam (borrowed) / Dikembalikan (returned) / Terlambat (overdue) status
- **Search** — filter records by student name or NIS
- **Excel import/export** — bulk-load existing records from `.xlsx`/`.xls`, or export the current list to Excel
- **SQLite storage** — zero-config local database, no external services required

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) components
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) for the database
- [SheetJS (xlsx)](https://www.npmjs.com/package/xlsx) for Excel import/export

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

This project uses a local SQLite file that is **not** committed to the repo. Create it and load the schema with:

```bash
npm run init-db
```

This creates `src/database/library.db` from `src/database/schema.sql`. The file is gitignored, so each environment (yours, a teammate's, production) has its own local database.

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run init-db` | Create/reset the local SQLite database from `schema.sql` |

## Project structure

``` bash
src/
├── app/
│   ├── api/
│   │   ├── borrowings/       # CRUD endpoints for loan records
│   │   └── excel/            # Import/export endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── borrowing-form.tsx
│   ├── borrowing-table.tsx
│   └── ui/                   # shadcn/ui components
├── database/
│   ├── init.ts                # Creates the SQLite file from schema.sql
│   └── schema.sql
└── lib/
    ├── db.ts
    ├── date-utils.ts
    └── utils.ts
```

## Notes on data

The included `schema.sql` only defines table structure — no sample or real student data is committed. If you're contributing or deploying this, treat `library.db` as local/private, since it will contain real names and student ID numbers (NIS) once in use.

## License

[MIT](LICENSE) — feel free to use or adapt this for your own school/library.
