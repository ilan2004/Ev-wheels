# Franchise Multi-Location + RBAC Implementation Plan

Context: This codebase uses Next.js (App Router) with Supabase authentication and a role system defined in `src/lib/auth`. Today, roles include `admin` and `technician`. This plan introduces:
- A new `manager` role.
- Location scoping for most domain data (per-branch access), with Inventory as a global/shared module across locations.
- Sign-in via username + password + location (no email in the UI), while remaining compatible with Supabase.

## Business Requirements ( distilled )
- Users log in with username, password, and location.
- Roles: Administrator, Manager, Technician.
- Managers and Technicians interact only with data for their assigned location(s).
- Inventory is global/shared across all locations (viewable by all; updates restricted as defined below).
- Administrators have full, cross-location access.

## High-Level Architecture
- AuthN: Supabase email/password under the hood; UI accepts username. We map username -> email and sign in with Supabase.
- AuthZ: Role/permission mapping in the client + Supabase RLS for server-side enforcement.
- Location scope: active location chosen at sign-in and controllable in-app (Admin can switch; others limited to assigned locations). All location-scoped queries include `location_id = activeLocationId`.
- Inventory: stored globally (no location_id), with writes restricted to Admin; Managers/Technicians get read-only (or limited “movements/requests” flows if needed).

## Roles & Permissions
Add a `MANAGER` role and update role mappings:
- Administrator: full access (all locations, all modules), user/location/inventory management.
- Manager: full access to location-scoped modules for assigned location(s). Inventory: read-only by default; may create requests/movements (optional, see Open Options below).
- Technician: operational access within assigned location(s), typically read/edit for tickets/batteries; inventory read-only.

Implementation notes:
- Update `src/lib/auth/roles.ts` to add `MANAGER` and extend `ROLE_PERMISSIONS` accordingly.
- Update any UI guards in `src/components/auth/role-guard.tsx` to include `manager` support.
- Keep Inventory write permissions restricted to Admin by default.

## Data Model
Introduce location entities and relationships in Supabase, and scope domain tables.

Tables (new):
- locations
  - id (uuid, pk)
  - name (text)
  - code (text, unique)
  - is_active (boolean, default true)
  - created_at (timestamptz)
- user_locations
  - user_id (uuid, fk -> auth.users)
  - location_id (uuid, fk -> locations.id)
  - PRIMARY KEY (user_id, location_id)

Columns to add (if not already present) to location-scoped tables:
- customers.location_id (uuid)
- batteries.location_id (uuid)
- tickets/location work orders.location_id (uuid)
- invoices/quotes.location_id (uuid)
- etc. for all per-branch entities

Inventory tables: remain global (no location_id). If a consumption/issue flow is needed, model as a separate movements table that references location_id for the movement, leaving the inventory master global.

## Supabase RLS Policies (server-side enforcement)
Enable RLS on new and scoped tables, and add policies. Admins bypass via a claim-based check (e.g., `role = 'admin'` in JWT) or a server-side role list. If not using custom JWT claims, fall back to membership checks only and handle Admin overrides in the app and RPC.

Example SQL (illustrative):
```sql path=null start=null
-- locations
alter table public.locations enable row level security;
create policy locations_read_all
  on public.locations for select
  using (true);

-- user_locations
alter table public.user_locations enable row level security;
create policy user_locations_self
  on public.user_locations for select using (auth.uid() = user_id);

-- Example: customers (scoped)
alter table public.customers enable row level security;
create policy customers_select
  on public.customers for select
  using (
    exists (
      select 1 from public.user_locations ul
      where ul.user_id = auth.uid()
        and ul.location_id = customers.location_id
    )
  );
create policy customers_modify
  on public.customers for insert with check (
    exists (
      select 1 from public.user_locations ul
      where ul.user_id = auth.uid()
        and ul.location_id = customers.location_id
    )
  )
  using (
    exists (
      select 1 from public.user_locations ul
      where ul.user_id = auth.uid()
        and ul.location_id = customers.location_id
    )
  );

-- Inventory (global)
alter table public.inventory enable row level security;
create policy inventory_read_all
  on public.inventory for select using (true);
-- Optional: restrict writes to admins only via claim or admin user list
```

Notes:
- Consider adding an `is_admin(uuid)` helper function or custom JWT claims to simplify Admin bypass conditions in policies.
- Apply similar policies to each location-scoped table.

## Authentication & Sign-In Flow (username + password + location)
UI behavior:
- Sign-in form collects: username, password, location (dropdown or autocomplete).
- Implementation: Lookup user by username in a `profiles` (or `users_meta`) table to resolve the user’s email, validate that the user has access to the chosen location via `user_locations`, then call `supabase.auth.signInWithPassword({ email, password })`. No email exposed in the UI.
- On success, persist `activeLocationId` client-side (and optional user metadata) and redirect to `/dashboard`.

Client session shape (example):
```ts path=null start=null
type SessionWithLocation = {
  supabaseUser: any; // Supabase user
  role: 'admin' | 'manager' | 'technician';
  locations: Array<{ id: string; name: string; code: string }>;
  activeLocationId: string | null; // null allowed for Admin "All" view
};
```

## Client-Side Scoping and Guards
- Extend `useAuth` to include `locations` and `activeLocationId`, plus helpers like `setActiveLocation(id)`.
- Wrap location-scoped pages with a guard that ensures non-admins always have a selected location and filters queries by that location.
- Centralize Supabase queries through a thin data-access layer that always applies `eq('location_id', activeLocationId)` for scoped tables.

Inventory:
- No `location_id` filtering for inventory master.
- If you support “issue/consume” flows, create a `inventory_movements` table that includes `location_id` and enforce RLS there.

## UI/UX Changes
- Update `src/features/auth/components/sign-in-view.tsx` to show username + password + location.
- Add a header location switcher component: Admin can switch among all; Managers/Technicians among assigned locations only.
- Update nav visibility using `RoleGuard` to incorporate `manager`.
- For pages like `/customers`, `/batteries`, `/tickets`, ensure grids/forms are scoped to the active location.

## Migration & Rollout Plan (Phased)

Phase 0 — Preparation
- Inventory current schema and code paths that touch customers, batteries, tickets, invoices, and inventory.
- Back up the database and enable a feature flag: `location_scope_enabled`.
- Acceptance: Backup complete; flag wired and off by default.

Phase 1 — Data Model
- Create `locations` and `user_locations` tables.
- Add `location_id` to scoped tables (nullable initially), backfill where possible, and set NOT NULL when safe.
- Enable RLS and add read policies; hold off on write policies until Phase 5.
- Acceptance: Tables exist; RLS read works; application unaffected with flag off.

Phase 2 — Auth: Username + Password + Location
- Add `username` column to `profiles` and backfill.
- Build sign-in form for username/password/location and username->email mapping.
- Validate `user_locations` membership on sign-in for the chosen location.
- Acceptance: Users can sign in with username/password/location; redirects to dashboard; Admin can pick any location.

Phase 3 — RBAC Updates (Manager Role)
- Add `MANAGER` to `src/lib/auth/roles.ts` and extend `ROLE_PERMISSIONS`.
- Update `RoleGuard` and any role checks to include Manager logic.
- Acceptance: Manager role recognized throughout, nav visibility matches expectations.

Phase 4 — Client Scoping Plumbed
- Extend `useAuth` to include `locations` and `activeLocationId` with a location switcher.
- Centralize data access to auto-apply `location_id` filters for scoped modules when `location_scope_enabled` is on.
- Acceptance: When the flag is on, scoped pages show only active-location data; Admin can see all or choose specific.

Phase 5 — Write Path Enforcement + RLS Tightening
- Add RLS write policies for scoped tables (insert/update/delete limited to members of that location, with stricter checks for Technician vs Manager if needed).
- Restrict Inventory writes to Admin. If needed, add `inventory_movements` with location-level RLS.
- Acceptance: Non-admin writes fail outside assigned locations; inventory writes restricted; app behavior matches expectations.

Phase 6 — Inventory Module Finalization
- Ensure inventory UI is global (no location filter on master data). If movements/requests introduced, wire them to the active location.
- Acceptance: Inventory behaves globally; movements (if applicable) reflect per-location usage.

Phase 7 — Testing & QA
- Unit tests for role checks and scoping helpers.
- Integration tests for sign-in flow and data filtering.
- E2E tests covering Admin/Manager/Technician across multiple locations.
- Acceptance: Test suite green and covers critical paths.

Phase 8 — Rollout
- Enable `location_scope_enabled` progressively.
- Monitor logs, error rates, and user feedback; provide rollback path (disable flag).
- Acceptance: Feature enabled for all tenants with stable metrics.

## Files to Update / Add (overview)
- src/lib/auth/roles.ts — add MANAGER, adjust ROLE_PERMISSIONS.
- src/components/auth/role-guard.tsx — recognize manager and permission sets.
- src/hooks/use-auth.ts — include locations, activeLocation, and helpers.
- src/features/auth/components/sign-in-view.tsx — switch to username/password/location UI and logic.
- New components: LocationSwitcher (header), data-access utilities for scoped queries.
- Supabase migrations: locations, user_locations, location_id columns, RLS policies.

## Open Options (choose defaults now, revisit in Phase 5)
- Inventory writes by Manager: default NO (Admin only). Optionally allow Managers to propose changes via “requests” or “movements”.
- Admin “All Locations” lens: allowed for Admin only; Manager/Technician must pick from assigned list.
- Store active location in user metadata: optional; default to client-side state and DB-stored preferences table if needed.

## Assumptions
- Supabase remains the auth provider.
- There is or will be a `profiles` table to store username and other user metadata.
- Existing domain tables can be altered to include `location_id`.

## Next Actions
1) Confirm defaults (Manager inventory writes? movement flow?).
2) Create migrations for `locations`, `user_locations`, and add `location_id` columns.
3) Implement username+password+location sign-in UI and location switcher scaffolding.
4) Add `MANAGER` role and update `ROLE_PERMISSIONS`.
5) Gate scoping via `location_scope_enabled` and iterate module-by-module.

