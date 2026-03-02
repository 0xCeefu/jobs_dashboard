# Jobs Dashboard

A full-stack job discovery and management platform built as a TypeScript monorepo. Browse curated job listings with smart filters, track your applications, and manage users through a role-based admin dashboard.

**Live:** [https://jobs.0xceefu.dev](https://jobs.0xceefu.dev)

![Jobs Dashboard screenshot](./og-screenshot.png)

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Frontend - Next.js 16](#frontend---nextjs-16)
  - [Pages and Routing](#pages-and-routing)
  - [Authentication Flow](#authentication-flow)
  - [Job Browsing](#job-browsing)
  - [User Profile](#user-profile)
  - [Admin Dashboard](#admin-dashboard)
  - [Theming](#theming)
  - [UI and Design System](#ui-and-design-system)
- [Backend - NestJS 11](#backend---nestjs-11)
  - [Authentication](#authentication)
  - [Job Listings API](#job-listings-api)
  - [Users API](#users-api)
  - [Database](#database)
- [Monorepo Structure](#monorepo-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [License](#license)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | [Next.js 16](https://nextjs.org/) - App Router, React 19, Server Components, Server Actions |
| Styling | [Tailwind CSS v3](https://tailwindcss.com/) with a custom component layer |
| Backend | [NestJS 11](https://nestjs.com/) - Express 5 |
| Database | PostgreSQL via [TypeORM](https://typeorm.io/) |
| Auth | JWT (access + refresh), [Passport.js](https://www.passportjs.org/) (Local, JWT, Google OAuth 2.0), [argon2](https://github.com/ranisalt/node-argon2) password hashing |
| Monorepo | [Turborepo](https://turbo.build/) + [pnpm workspaces](https://pnpm.io/workspaces) |
| Language | TypeScript end-to-end |

---

## Frontend - Next.js 16

### Pages and Routing

| Route | Access | Description |
|---|---|---|
| `/` | Public | Paginated job listings with filters |
| `/jobs/:id` | Public (limited) / Auth (full) | Job detail page |
| `/user/login` | Public | Email/password login + Google OAuth |
| `/user/signup` | Public | Account registration + Google OAuth |
| `/user/oauth/callback` | Public | Google OAuth return handler |
| `/user/profile` | Authenticated | User profile and applied jobs |
| `/admin/users` | Admin only | User management dashboard |
| `/forbidden` | Public | 403 error page |
| `/unauthorized` | Public | 401 / session expired page |

All routes are protected by a **middleware layer** that:

1. **Proactively refreshes tokens** - when the 5-minute access token has expired but the 7-day refresh token is still valid, new tokens are fetched from the API and set as cookies directly in the middleware (the only reliable place to set cookies in Next.js App Router).
2. **Gates protected routes** - `/user/profile` and `/admin/*` redirect to login (preserving `?next=` for post-login redirect) when no tokens exist.
3. **Enforces admin role** - `/admin/*` redirects to `/forbidden` if the user's role is not `admin`.

### Authentication Flow

- **Email/Password** - Server Actions call `/auth/login` or `/auth/register`, then store four httpOnly cookies: `access_token` (5 min), `refresh_token` (7 d), `user_role`, `user_name`.
- **Google OAuth** - The login page links to `GET /auth/google/login?next=...`. After Google consent, the backend redirects to `/user/oauth/callback?payload=<base64url>&next=...`. The route handler decodes the payload, sets session cookies, and redirects to the original destination.
- **Transparent refresh** - `apiFetch()` automatically retries on 401 by calling `/auth/refresh` with the stored refresh token. Concurrent refresh calls are deduplicated with a shared promise.
- **Logout** - Clears all session cookies and redirects to the login page.

### Job Browsing

**Listing page (`/`)**

- Authenticated users see full job text and per-job "Applied" status; guests see a 180-character preview.
- **Filters:** Remote/Onsite, Job Type (Frontend, Backend, Full-stack), Verification Status (AI, Threshold). Active filters show a "Clear" link. Submitting resets to page 1.
- **Job cards** display color-coded badges (type, active/expired, remote/onsite, applied), source name, timestamps, and truncated description.
- **Pagination** with Previous/Next buttons, numbered page buttons, and a "Go to page" input. 40 items per page by default.
- **Empty state** with illustration when no listings match.

**Detail page (`/jobs/:id`)**

- Shows full metadata: verification status with confidence level, source, type, expiry, timestamps.
- **Authenticated:** full job description, Apply/Unapply toggle button, and an "Open Application" external link to the original posting.
- **Guest:** truncated preview with a locked-content callout prompting login or signup (with `?next=` redirect back to the listing).

### User Profile

- Displays user info in a card: avatar, username, email, role badge (amber for admin, blue for regular user).
- **Applied jobs list** - compact rows showing type, remote status, source, applied timestamp, with View and Remove buttons. Paginated (50 items).
- Empty state links to the job listings page.

### Admin Dashboard

- **Create user form** - username, email, password, and role (user/admin).
- **Users table** with avatar initials, email, and color-coded role badges.
- **Inline editing** - each row has an edit form for username, email, and role. Save and Delete actions per row.
- **Pagination** - 10 users per page with Previous/Next navigation and page counter.
- Error messages displayed via query parameter alerts.

### Theming

- **Dark / Light mode** toggle persisted in `localStorage`.
- **No flash of unstyled content** - an inline `<head>` script reads the stored preference (or system `prefers-color-scheme`) and applies the `dark` class to `<html>` before the first paint.
- Toggle displays sun/moon inline SVG icons.

### UI and Design System

- **26 inline SVG icon components** in a zero-dependency icon library - no external icon packages. Icons include: `BriefcaseIcon`, `UserIcon`, `ShieldCheckIcon`, `LogInIcon`, `LogOutIcon`, `UserPlusIcon`, `SunIcon`, `MoonIcon`, `GlobeIcon`, `BuildingIcon`, `CalendarIcon`, `CheckCircleIcon`, `ChevronLeftIcon`, `ChevronRightIcon`, `ExternalLinkIcon`, `LockIcon`, `FilterIcon`, `Trash2Icon`, `PencilIcon`, `PlusIcon`, `AlertCircleIcon`, `ZapIcon`, `MailIcon`, `KeyIcon`, `GoogleIcon`, `ClockIcon`.
- **Custom Tailwind component layer** with reusable classes: `.panel` (rounded card with glass shadow), `.panel-hover`, `.badge` (with color variants: success, danger, info, purple, amber), `.btn` (primary, danger, success, with `aria-disabled` support), `.form-group`, `.divider`, `.empty-state`, `.page-header`, `.topbar` (sticky with `backdrop-blur-md`), `.nav-link`, `.jobs-grid` (responsive auto-fill grid), styled tables, and a dot-grid body background.
- **Responsive layout** - desktop navigation collapses into a `<details>`-based mobile menu that auto-closes on interaction.
- **Geist font family** - local Geist Sans and Geist Mono `.woff` files.

---

## Backend - NestJS 11

### Authentication

| Feature | Detail |
|---|---|
| Password hashing | argon2 (hash on insert, verify on login) |
| Access token | JWT, 5-minute expiry, signed with `JWT_SECRET` |
| Refresh token | JWT, 7-day expiry, signed with `JWT_REFRESH_SECRET`. The hash is stored in the database and verified with argon2 on refresh. |
| Google OAuth 2.0 | Passport strategy with `email` + `profile` scopes. Find-or-create user flow. Post-auth redirect carries a base64url-encoded payload. |
| Global JWT guard | Every route requires a valid JWT unless decorated with `@Public()`. |
| Role-based access | `@Roles(UserRole.ADMIN)` decorator + `RolesGuard` checks `request.user.role`. |

**Strategies:** `LocalStrategy` (email/password), `JwtStrategy` (access token from Bearer header), `RefreshJwtStrategy` (refresh token verification), `GoogleOAuthStrategy` (OAuth 2.0 with `state` passthrough for redirect URL).

### Job Listings API

- **Entities:** `job_listings` (uuid, source, remote, type_of_job, verification_status, confidence_level, expires_in, created_at, job_link, job_text) and `applied_jobs` (user_id -> users, job_uuid -> job_listings, applied_at, unique constraint per user-job pair).
- **Enums:** `JobType` (fullstack, frontend, backend) and `VerificationStatus` (ai, threshold).
- **Public endpoints** return preview DTOs (180-char text, no direct link). Authenticated endpoints return full DTOs with an `applied` boolean.
- **Filtering** via QueryBuilder: `remote` (boolean), `type_of_job`, `verification_status`. Sorted by `created_at DESC`, `uuid DESC`.
- **Pagination** with configurable `page` and `limit` (default 50, max 100). Returns `{ items, page, limit, total, hasMore }`.
- **Apply / Unapply** - idempotent ("find or create" on apply, delete on unapply). Cascades on user or job deletion.
- **Location search** - `GET /job-listing/location/:location` filters non-remote jobs by substring match in `job_text`.

### Users API

- **Entity:** `users` (id UUID, username, email, password, role, hashedRefreshToken).
- **Admin-only** - the entire controller is protected by `@Roles(UserRole.ADMIN)`.
- **CRUD:** create (with duplicate email check -> `ConflictException`), read (single + paginated list ordered by username ASC), update (partial), and delete.
- **Pagination** uses TypeORM `findAndCount` for accurate totals. Returns `{ items, page, limit, total, hasMore }`.

### Database

- **PostgreSQL** connected via TypeORM with `synchronize: false` (migrations expected for production).
- **Three tables:** `users`, `job_listings`, `applied_jobs`.
- **Input validation:** global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strips unrecognized fields and rejects unexpected ones.

---

## Monorepo Structure

```
jobs_dashboard/
├── apps/
│   ├── api/                   # NestJS REST API (port 5173)
│   │   └── src/
│   │       ├── auth/          # Passport strategies, guards, decorators, DTOs
│   │       ├── config/        # DB, JWT, Google, client URL configs
│   │       ├── job_listing/   # Listings CRUD, apply/unapply, entities, enums
│   │       └── users/         # Admin user management, entities, enums
│   └── web/                   # Next.js 16 frontend (port 3000)
│       ├── app/               # App Router: pages, layouts, Server Actions
│       │   ├── admin/users/   # Admin dashboard page + actions
│       │   ├── jobs/[id]/     # Job detail page
│       │   ├── user/          # Login, signup, profile, OAuth callback
│       │   ├── icons.tsx      # 26 inline SVG icon components
│       │   ├── mobile-menu.tsx
│       │   └── theme-toggle.tsx
│       ├── lib/               # API client, session, types, jobs helpers
│       └── middleware.ts      # Auth gate, token refresh, role enforcement
└── packages/
    ├── eslint-config/         # Shared ESLint presets (base, Next.js, React)
    ├── typescript-config/     # Shared tsconfig bases (base, Next.js, React lib)
    └── ui/                    # Shared React components (button, card, code)
```

Orchestrated by **Turborepo** - `pnpm run dev` starts both apps in parallel; `pnpm run build` caches outputs.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 9
- [PostgreSQL](https://www.postgresql.org/)

### Install

```bash
git clone https://github.com/your-username/jobs_dashboard.git
cd jobs_dashboard
pnpm install
```

### Environment Variables

**`apps/api/.env`**

```env
DATABASE_URL=postgres://user:password@localhost:5432/jobs_db
DB_PORT=5432
PORT=5173
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:5173/auth/google/callback
WEB_APP_URL=http://localhost:3000
```

**`apps/web/.env.local`**

```env
API_URL=http://localhost:5173
```

### Run

```bash
# Both apps
pnpm run dev

# Single app
pnpm run dev --filter=api
pnpm run dev --filter=web
```

| App | URL |
|---|---|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| API | [http://localhost:5173](http://localhost:5173) |

### Build

```bash
pnpm run build
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/login` | Public | Email/password login -> tokens |
| `POST` | `/auth/register` | Public | Create account -> tokens |
| `POST` | `/auth/refresh` | Refresh token | Issue new token pair |
| `GET` | `/auth/me` | JWT | Current user info |
| `GET` | `/auth/google/login` | Public | Initiate Google OAuth (`?next=`) |
| `GET` | `/auth/google/callback` | Public | OAuth callback -> redirect with payload |

### Job Listings

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/job-listing/public` | Public | Paginated preview listings (filterable) |
| `GET` | `/job-listing/public/:id` | Public | Single job preview |
| `GET` | `/job-listing` | JWT | Full listings with `applied` status |
| `GET` | `/job-listing/:id` | JWT | Full job detail with `applied` status |
| `GET` | `/job-listing/location/:loc` | Public | Filter by location substring |
| `GET` | `/job-listing/applied/me` | JWT | User's applied jobs |
| `POST` | `/job-listing/:id/apply` | JWT | Mark job as applied |
| `DELETE` | `/job-listing/:id/apply` | JWT | Remove applied mark |

**Filters (query params):** `remote`, `type_of_job`, `verification_status`, `page`, `limit`

### Users (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/users` | Admin | Create user |
| `GET` | `/users` | Admin | Paginated user list |
| `GET` | `/users/:id` | Admin | Get single user |
| `PATCH` | `/users/:id` | Admin | Update user |
| `DELETE` | `/users/:id` | Admin | Delete user |

All responses use the `{ items, page, limit, total, hasMore }` pagination envelope where applicable.

---

## License

MIT
