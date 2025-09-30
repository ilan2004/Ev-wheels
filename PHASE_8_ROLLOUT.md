# Phase 8 — Rollout and Monitoring Guide

This document outlines how to progressively enable multi-location scoping and how to roll back safely.

## 1) Feature flag

- Env var: `NEXT_PUBLIC_LOCATION_SCOPE_ENABLED`
  - Default: enabled (unless set to 'false')
  - Set to 'false' to disable client-side location scoping and sign-in membership enforcement.
- Local override (runtime/testing):
  - `localStorage.setItem('feature_location_scope_enabled', 'false')` to disable
  - `localStorage.setItem('feature_location_scope_enabled', 'true')` to enable
  - `localStorage.removeItem('feature_location_scope_enabled')` to use env default

Code entry points:

- `src/lib/config/flags.ts` — flag logic
- `src/lib/location/scope.ts` — scoping helpers respect the flag
- `src/features/auth/components/sign-in-view.tsx` — membership enforcement respects the flag

Note: RLS (server-side) remains active regardless of the client flag. Disabling the flag only affects client behavior.

## 2) Progressive rollout steps

1. Staging/QA
   - Ensure migrations applied: `supabase db push`
   - Verify seed data (locations, profiles, user_locations) exists and app_roles is backfilled.
   - Sign in as Admin and test “All locations” view and Inventory moving/approval.
   - Sign in as Manager/Technician and validate scoping and write permissions.
2. Canary users
   - Keep `NEXT_PUBLIC_LOCATION_SCOPE_ENABLED=true` in staging and in production for a small cohort.
   - Optionally set localStorage override for targeted sessions.
3. Full enablement
   - Set `NEXT_PUBLIC_LOCATION_SCOPE_ENABLED=true` in production environment config.
   - Restart app to pick up env var.

## 3) Monitoring

- Client/browser console logs and UI (error banners) during CRUD operations.
- Supabase dashboard: monitor RLS policy errors and rejected writes.
- Track key flows:
  - Sign-in membership errors
  - List views for customers/batteries/tickets
  - Movement requests and approvals

## 4) Rollback

- To roll back client scoping quickly:
  - Set `NEXT_PUBLIC_LOCATION_SCOPE_ENABLED=false` and restart the app, or
  - Set `localStorage.setItem('feature_location_scope_enabled','false')` in the impacted browser session.
- RLS remains active to protect data. If you need to revert RLS write policies (not recommended without due process), create a new migration that relaxes or drops specific policies.

## 5) Post-rollout hardening

- Consider making `location_id` NOT NULL on scoped tables after backfill.
- Replace public profiles SELECT with the RPC only and add rate limiting if needed.
- Add E2E coverage for key flows across Admin/Manager/Technician.
- Build a minimal admin panel to manage app_roles and user_locations.
