# ParlayPost - Replit.md

## Overview

ParlayPost is a sports betting tracker web application that allows users to log their bets, track performance statistics, view live odds, and compete in group leaderboards. The app features a dark-mode sports theme with neon green accents and supports a unique SMS-based bet entry workflow (simulated via a webhook endpoint). Key features include:

- User authentication (register/login)
- Personal betting dashboard with profit/loss charts and bet history
- Live odds pulled from The Odds API (NBA/NFL)
- Group management with invite codes and leaderboards
- SMS-style bet input simulation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Structure
The project uses a monorepo layout with three main areas:
- `client/` — React frontend (Vite)
- `server/` — Express.js backend
- `shared/` — Shared TypeScript types, DB schema, and API route definitions

This shared layer is important: both the frontend and backend import from `shared/schema.ts` and `shared/routes.ts`, so types and API contracts stay in sync without duplication.

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: `wouter` (lightweight client-side routing)
- **State/Data Fetching**: TanStack Query (React Query v5) for server state; no global client state library
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS) with the "new-york" style variant
- **Charts**: Chart.js via `react-chartjs-2` for profit/loss line charts
- **Fonts**: DM Sans (body), Outfit (display), loaded from Google Fonts
- **Theme**: Dark mode by default, deep charcoal background with neon green primary color
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

Key pages:
- `/auth` — Login/register
- `/` — Dashboard (stats, profit chart, bet history)
- `/odds` — Live odds viewer
- `/groups` — Group list, create/join
- `/groups/:id` — Group leaderboard detail

### Backend Architecture
- **Framework**: Express.js with TypeScript, run via `tsx` in development
- **Session Management**: `express-session` with cookie-based sessions
- **Authentication**: Passport.js with `passport-local` strategy (email + plaintext password — MVP only, not production-safe)
- **API Design**: RESTful routes defined in `server/routes.ts`, with route paths/schemas mirrored in `shared/routes.ts`
- **Live Odds**: Fetched from The Odds API in `server/odds.ts` with a 5-minute in-memory cache to avoid rate limiting
- **SMS Webhook**: `/api/webhook/sms` endpoint parses bet data from SMS-style text messages

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (connection via `DATABASE_URL` environment variable)
- **Schema** (`shared/schema.ts`) defines four tables:
  - `users` — id, email (unique), password, name
  - `groups` — id, name, inviteCode (unique)
  - `groupMembers` — join table linking users to groups
  - `bets` — id, userId, groupId (nullable), team, betType (spread/moneyline/total), line, odds, amount, gameDate, result (won/lost/push/pending), profitLoss, createdAt
- **Migrations**: Managed via `drizzle-kit push` (schema push workflow, not migration files)
- **Storage Interface**: `IStorage` interface in `server/storage.ts` abstracts all DB operations, implemented by `DatabaseStorage`

### Build System
- Development: `tsx server/index.ts` serves both API and Vite dev middleware together
- Production: Custom build script (`script/build.ts`) runs Vite for the client then esbuild for the server, bundling key server deps (drizzle, passport, pg, etc.) into a single CJS output at `dist/index.cjs`

### Authentication Flow
1. User submits credentials to `POST /api/auth/login`
2. Passport validates against DB, serializes user ID into session cookie
3. Frontend stores user in React Query cache via `useAuth` hook
4. Protected routes check session via `GET /api/auth/me`; unauthenticated users are redirected to `/auth`

## External Dependencies

### APIs
- **The Odds API** (`https://api.the-odds-api.com/v4`) — Fetches live sports odds for NBA and NFL. Requires `ODDS_API_KEY` environment variable. Results are cached in memory for 5 minutes.

### Environment Variables Required
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ODDS_API_KEY` | The Odds API authentication key |
| `SESSION_SECRET` | Express session signing secret (defaults to hardcoded string if absent) |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID (optional — enables real SMS) |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token (optional — enables real SMS) |
| `TWILIO_PHONE_NUMBER` | Twilio phone number in E.164 format e.g. +15551234567 (optional) |

### Twilio SMS Integration
- **Status:** Credentials not yet provided. The Replit Twilio connector (`connector:ccfg_twilio_01K69QJTED9YTJFE2SJ7E4SY08`) was proposed but dismissed by the user.
- **Alternative:** User can provide `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` as secrets manually.
- **Webhook endpoint:** `POST /api/webhook/sms` — already parses bets from SMS body text.
- **To activate real SMS:** Once secrets are set, update `server/routes.ts` to send a Twilio confirmation reply using the `twilio` npm package.
- **Privacy policy:** Available at `/privacy` — required by Twilio during A2P 10DLC registration.

### Key NPM Dependencies
| Package | Role |
|---|---|
| `drizzle-orm` + `pg` | Database ORM and PostgreSQL driver |
| `drizzle-zod` | Auto-generates Zod schemas from Drizzle table definitions |
| `passport` + `passport-local` | Authentication middleware |
| `express-session` | Session handling |
| `connect-pg-simple` | PostgreSQL session store (available but may not be active) |
| `@tanstack/react-query` | Server state management on the frontend |
| `wouter` | Lightweight React router |
| `chart.js` + `react-chartjs-2` | Profit/loss charting |
| `date-fns` | Date formatting utilities |
| `zod` | Runtime schema validation, shared between client and server |
| `@radix-ui/*` | Accessible UI primitives (via shadcn/ui) |
| `tailwind-merge` + `clsx` | Conditional className utilities |
| `nanoid` | Unique ID generation (used for invite codes and cache-busting) |