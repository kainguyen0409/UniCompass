# UniCompass

**A Vietnamese-language university admissions companion for high school students.**

UniCompass brings admission milestones, university cutoff scores, and official sources into one place. Students can follow a step-by-step roadmap, explore programs that match their interests, and save their progress.

> **Demo status:** This project uses the archived **2025 admissions cycle**. Dates and scores describe that cycle, not the upcoming admissions year, which hasn't come out yet.

[Features](#features) · [Getting started](#getting-started) · [Configuration](#configuration) · [Data and scope](#data-and-scope) · [Development](#development)

## Why I built it

Having gone through Vietnam’s high school graduation exam and university admissions process, I saw how difficult it can be to keep track of information. Guidance passes through education departments, schools, and teachers, while universities publish different admission methods and requirements.

I built UniCompass to make that process easier to understand: what to do next, when to do it, and where to find the original information.

## Features

- **Admissions roadmap:** Milestones, deadlines, checklists, and progress tracking.
- **Cutoff explorer (Điểm chuẩn):** Published 2025 final admission scores from UET, NEU, HUST, and FTU, with university-specific methods and score scales.
- **Personalized interests:** Select universities and major groups at signup, update them later, and browse matching programs by default.
- **Vietnamese search:** Find programs with or without Vietnamese accents.
- **Source references:** Government and university links with publication and verification dates.
- **Saved progress:** Register or sign in to keep your progress and interests across sessions.

Guests can explore without an account. The guest demo starts with two completed steps and no selected interests; guest changes reset when the page reloads.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6 |
| Backend | Express 5, TypeScript, Node.js |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Tests | Vitest, jsdom, Node.js test runner |

## Getting started

### Prerequisites

- Node.js 20+ and npm.
- A running PostgreSQL instance, with `createdb` and `psql` available in your terminal.
- A PostgreSQL role that can create the local database and its tables. By default, the app connects using your operating-system username.

### Install and run

Download or clone this repository, open its root directory in a terminal, and run:

```bash
# Install dependencies for the root, frontend, and backend
npm ci
npm --prefix client ci
npm --prefix server ci

# Create the local database, apply the schema, and load demo data
npm run db:setup
npm run db:seed

# Start the frontend and API together
npm run dev
```

Open [localhost:5173](http://localhost:5173). The API runs at [localhost:3001](http://localhost:3001), and its health endpoint is [/api/health](http://localhost:3001/api/health).

The frontend proxies `/api` requests to port `3001`. It requires port `5173` to be available and will report an error instead of silently switching ports. Stop any previous app instances before starting another.

`db:setup` can be rerun to apply the schema updates without deleting accounts or progress. `db:seed` validates the bundled cutoff data, then inserts or updates demo records in one transaction. Rerunning it refreshes existing records without creating duplicates.

## Configuration

Environment variables are read from the shell. **`.env` files are not loaded automatically.** Set any database overrides before seeding or starting the API.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Unset; uses the settings below |
| `PGHOST` | PostgreSQL host | `localhost` |
| `PGPORT` | PostgreSQL port | `5432` |
| `PGUSER` | PostgreSQL role | Operating-system username |
| `PGPASSWORD` | PostgreSQL password, if required | Unset |
| `PGDATABASE` | Database name | `lo_trinh` |
| `PORT` | API listening port | `3001` |
| `CLIENT_ORIGIN` | Allowed browser origin for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret used to sign authentication tokens | Development fallback; required in production |

If you change the API port during development, also update the proxy target in [`client/vite.config.ts`](client/vite.config.ts).


### Run the production build

After configuring and seeding the database, build both applications and start the server:

```bash
npm run build
export JWT_SECRET="$(node -e 'process.stdout.write(require("node:crypto").randomBytes(32).toString("hex"))')"
npm start
```

`npm start` enables production mode and serves both the built frontend and API at [localhost:3001](http://localhost:3001) by default. Production startup requires a private `JWT_SECRET` of at least 32 characters. For a deployment, store a persistent secret in the hosting environment and set `CLIENT_ORIGIN` to the frontend’s origin.

## Data and scope

The bundled dataset contains **241 published cutoff records across 167 program/campus entries** from the 2025 cycle.

| University | Program/campus entries |
| --- | ---: |
| UET — University of Engineering and Technology, VNU Hanoi | 20 |
| NEU — National Economics University | 68 |
| HUST — Hanoi University of Science and Technology | 36 |
| FTU — Foreign Trade University | 43 |
| **Total** | **167** |

This is a curated subset, not a complete national catalog. Programs remain distinct by university, program code, campus, year, and admission round. Multiple admission methods appear together on each program card.

### Understanding the scores

- The explorer displays **published final admission cutoffs on their published scales**, including scores already converted by a university.
- It does not calculate score conversions, compare applicants’ raw scores, present application-eligibility floors as final cutoffs, or predict admission outcomes.
- Broad major categories are manually assigned navigation aids, not official university classifications.
- Source links and verification dates are manually maintained. The demo does not submit applications or store government credentials.

### How interest filters work

Within a list, any selected university or category can match. Across the two lists, both conditions must match: selecting NEU and finance shows finance-related programs at NEU. An empty list imposes no restriction in that dimension.

Selecting **“Tất cả”** explores the full demo dataset without overwriting saved interests. Preferences use stable university and category IDs. Legacy score fields remain in saved progress for compatibility.

### Coverage notes

- **UET:** All 20 programs in the final announcement, on the common 30-point admission scale.
- **NEU:** 68 named programs on the common 30-point scale. Five umbrella high-quality/advanced codes are omitted pending verification of their major mappings.
- **HUST:** A verified subset of THPT and TSA results, plus separately verified XTTN 1.3 results. XTTN 1.2 is omitted because its original table could not be inspected. Later official documents are used only for explicitly labeled 2025 columns. See the [HUST data notes](docs/data-hust-2025.md).
- **FTU:** Program, campus, and method distinctions are preserved. Published HSA/V-ACT figures already converted by FTU are labeled as converted scores, not raw exam results. See the [FTU data notes](docs/data-ftu-2025.md).

## Development

### Project structure

```text
client/
  src/
    components/       Cutoff explorer, interest picker, and dialogs
    lib/              API helpers, filtering, and progress persistence
    App.tsx           Main application and admissions roadmap
server/
  src/
    data/             University catalogs, cutoff records, and validation
    middleware/       JWT authentication
    routes/           Authentication, progress, and public data endpoints
    schema.sql        Database schema and incremental updates
    seed.ts           Demo data import
    index.ts          API and production frontend server
  tests/              Data integrity, route, and validation tests
docs/                 Detailed data provenance and coverage notes
```

### Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the frontend and API together |
| `npm run dev:client` | Start only the frontend |
| `npm run dev:server` | Start only the API |
| `npm run db:setup` | Create/update the local `lo_trinh` database |
| `npm run db:seed` | Validate and import the demo data |
| `npm test` | Run frontend and backend tests |
| `npm run build` | Type-check and build both applications |
| `npm start` | Serve the production build |

Tests cover the roadmap, signup and interest filtering, Vietnamese search, score scales, session restoration, saving and retries, keyboard-accessible dialogs, data integrity, and API validation.

### Maintaining cutoff data

Each university has a data file in [`server/src/data/`](server/src/data/): `uet2025.ts`, `neu2025.ts`, `hust2025.ts`, and `ftu2025.ts`. [`admissions2025.ts`](server/src/data/admissions2025.ts) combines them and validates IDs, source references, categories, duplicate program/method records, and score ranges before seeding.

When adding or correcting a record:

1. Read the university’s official final admission announcement.
2. Confirm the year, admission round, program code, campus, method, subject-group basis, and score scale.
3. Record the published value and its source without inferring missing scores or applying conversions.
4. Update the relevant provenance notes and coverage counts if needed.
5. Run `npm test` and `npm run build` before submitting the change.
