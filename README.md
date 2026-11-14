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
- **HUST:** A verified subset of THPT and TSA results, plus separately verified XTTN 1.3 results. XTTN 1.2 is omitted because its original table could not be inspected. Later official documents are used only for explicitly labeled 2025 columns.
- **FTU:** Program, campus, and method distinctions are preserved. Published HSA/V-ACT figures already converted by FTU are labeled as converted scores, not raw exam results.


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
4. Update the source references and notes in the data file, and the README coverage counts if needed.
5. Run `npm test` and `npm run build` before submitting the change.

## Local AI assistant (Groq)

“Hỏi UniCompass” uses the official OpenAI TypeScript SDK against Groq's Responses API (`https://api.groq.com/openai/v1`), model `openai/gpt-oss-120b`, and Zod validation. There is no LangChain dependency. Inference runs on Groq; React, Express, and PostgreSQL run locally. The assistant is **disabled by default pending live verification**.

Keep the key on the server. In macOS zsh, enter it without displaying it or putting it in shell history:

```zsh
read -s 'GROQ_API_KEY?Groq API key: '; echo
export GROQ_API_KEY
```

If already exported, skip that step. From this repository, use that same terminal for the live check:

```zsh
npm --prefix server run ai:verify
```

For a low Groq TPM quota, use `npm --prefix server run ai:verify -- --paced`. This evaluation-only mode waits 60 seconds before each scenario and retries HTTP 429 responses at most three times per call after the provider’s suggested delay (or 60 seconds if absent). Delays above 120 seconds stop the run. The evaluation deadline becomes at least seven minutes per scenario to accommodate waiting; the chatbot still has no automatic retries and its normal 45-second deadline. Reports separate quota wait time from total scenario duration. Allow at least 20 minutes for a paced run.

This makes real, billable provider requests: five compatibility calls followed by 20 Vietnamese scenarios (up to five calls each). It checks generation, function calls, dependent calls with matching outputs, and separate structured output; then exercises the real database readers using a synthetic student's interests and no completed milestones. No account is created or modified. Provider quotas may interrupt the run. Results and measured latency are written to `/tmp/unicompass-ai-evaluation.json` (override with `AI_EVAL_REPORT`). Schema/reference passes do **not** prove the prose is correct. Review every answer against its returned records, including methods/scales, missing records, archived dates, follow-ups, sources, guarantees, and conversion refusals. Keep AI disabled if anything fails.

After all checks and that review pass, stop the existing dev servers and start them in the terminal containing your key:

```zsh
AI_ENABLED=true npm run dev
```

Open localhost:5173, sign in, and use “Hỏi UniCompass.” Check a sourced answer and follow-up, open a program and source, ask about unfinished roadmap steps, then test Stop, retry, reset, closing/reopening, logout, and a different account. Also check a narrow mobile viewport. Browser conversations stay in memory across panel closes, clear on reload/account changes, and are not stored in PostgreSQL. Closing the panel cancels pending work.

### Assistant configuration and limits

| Variable | Default | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | Unset | Server-only Groq credential |
| `AI_ENABLED` | `false` | Explicit local enable switch after verification |
| `AI_MODEL` | `openai/gpt-oss-120b` | Override requires repeating compatibility tests |
| `AI_REQUEST_TIMEOUT_MS` | `45000` | Overall request deadline, including database reads |
| `AI_MAX_OUTPUT_TOKENS` | `4096` | Output budget per Responses call |
| `AI_MAX_INPUT_BYTES` | `40000` | Conservative serialized request size bound |
| `AI_EVAL_REPORT` | `/tmp/unicompass-ai-evaluation.json` | Live evaluation report location |

`GET /api/assistant/status` reports availability. `POST /api/assistant/chat` requires a valid account token. Four read-only tools share the normal API's database readers: `search_programs`, `get_program_details`, `get_my_roadmap`, and `get_sources`. Identity comes from authentication, never tool arguments. Search returns at most 12 program groups. Each turn permits four retrieval requests/four tool executions and one separate structured-answer request. No SDK retries, `store`, or `previous_response_id` are used. Cards and links come from retrieved database records; unknown references and incomplete/invalid responses are rejected. Explanatory prose still requires live evaluation.

Pilot quotas: one active request per account, two globally, 20 requests per account per rolling hour, and 100 per server per rolling day. Accepted requests count even if cancelled or failed. Limits are in memory and reset when Express restarts; this is suitable for the local pilot, not multi-process production. History sent to the model is limited to ten messages/20,000 characters, and each new question to 2,000 characters. Logs contain request IDs, timing, token counts, and tool names, not prompts or credentials.

Troubleshooting:

- **Disabled:** Check both `AI_ENABLED=true` and `GROQ_API_KEY` in the process starting Express. Exporting a key in another terminal or adding a `.env` file does not configure an already running process.
- **429:** Wait for the returned retry interval; this may be a local pilot quota or Groq account quota. There are no automatic retries.
- **504:** The request exceeded the deadline. Try a narrower question; verify PostgreSQL and Groq connectivity.
- **502:** Provider failure, incomplete output, or invalid references. Use the live verifier and request ID to investigate; do not disable validation.
- **413:** Start a new conversation or narrow the search. The input budget prevents excessive provider requests.
- **401:** Sign in again. Deleted accounts and expired tokens cannot use the assistant.

Automated coverage runs with `npm test`; `npm run build` checks and builds both apps. These checks use a fake provider and do not establish live Groq compatibility or answer accuracy. No deployment changes are included.
