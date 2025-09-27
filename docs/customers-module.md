# Customers Module: Developer Guide

This document summarizes how to work with the Customers module — APIs, components, pages, and data.

APIs
- customersApi (src/lib/api/customers.ts)
  - list({ search?, limit?, offset? })
  - getById(id)
  - create(input)
  - update(id, input)
  - remove(id)
  - merge(sourceId, targetId) — updates references in service_tickets and battery_records, deletes source, writes optional audit

UI Components
- CustomerPicker (src/components/customers/customer-picker.tsx)
  - Typeahead with debounce, quick add via CustomerQuickAdd
  - onChange returns id and full Customer object
- CustomerQuickAdd (src/components/customers/customer-quick-add.tsx)
  - Minimal dialog for quick creates
- CustomerForm (src/components/customers/customer-form.tsx)
  - Create/Edit form used by pages

Pages
- List: /dashboard/customers
  - Search (debounced), pagination, export CSV, navigation to Duplicates/Import
- New: /dashboard/customers/new
- Detail: /dashboard/customers/[id]
  - Summary and recent Tickets/Batteries
- Edit: /dashboard/customers/[id]/edit
- Duplicates: /dashboard/customers/duplicates
  - Heuristic grouping; merge single/all
- Import: /dashboard/customers/import
  - Paste CSV, preview, bulk import

Billing integration (Phase 3)
- quote-form.tsx and invoice-form.tsx
  - “Select from Customers” prefills fields and sets linkedCustomerId
  - Snapshot fields remain editable; link is optional and can be cleared

Database
- customers (existing)
  - Added optional columns: gst_number, alt_contact, notes (idempotent migrations)
  - Indexes: name/contact plus email; trigram GIN for fast ILIKE (optional)
- customers_audit (optional)
  - Records merges
- Apply SQL in src/lib/database/bms-schema.sql to your database

Performance
- Debounced searches in list and duplicates pages
- pg_trgm + GIN indexes (optional) for fast ILIKE

Testing (suggested setup)
- Use Vitest or Jest + React Testing Library
- Suggested test targets:
  - customersApi (mock supabase)
  - CustomerPicker (typeahead calls, quick add flow)
  - Merge flow (mock customersApi.merge)

Security
- Ensure RLS policies for customers, service_tickets, battery_records, and customers_audit allow intended operations in your environment

Notes
- Merge references update service_tickets and battery_records. Extend if more tables reference customers.
- Import is basic CSV without quoting/escaping. For advanced CSVs, integrate a library like Papa Parse.

