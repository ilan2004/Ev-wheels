# Customers Module: Phase-by-Phase Plan

Context from the current codebase:
- BMS uses a customers table in the DB (see src/lib/database/bms-schema.sql) and references customers from battery records (customer_id) and UI forms (src/components/bms/battery-form.tsx).
- Service Tickets list/select customers via Supabase (src/lib/api/service-tickets*.ts), and the tickets UI depends on listCustomers() to populate a select (src/app/dashboard/tickets/new/page.tsx).
- Billing currently embeds freeform customer info in quotes/invoices (name, phone, address, gstNumber) via Zod schemas (src/lib/billing/schemas.ts) rather than the master customers table.
- Admin dashboard links to /dashboard/customers and /dashboard/customers/new in quick actions, implying a customers module is intended but not implemented yet (src/components/dashboard/admin-dashboard.tsx).

Goal
- Build a first-class Customers module that is the single source of truth for customers and makes it easy to add/select a customer from anywhere (BMS, Service Tickets, Billing), with a consistent API and UI components.

Outcomes
- A reusable CustomerPicker with typeahead search, quick-create modal, and robust validation.
- Customers pages: list, create, edit, detail, with search, filters, and recent activity across tickets/batteries/billing.
- Optional linkage from Billing’s embedded customer info to a master customer to prefill and synchronize fields like gstNumber.


Phases and Milestones

Phase 1: Foundation and Quick-Add Everywhere
- Data Model
  - Current DB: customers(id, name, contact, email, address, created_at, updated_at)
  - Proposed additions:
    - gst_number TEXT NULL (align with billing’s gstNumber)
    - alt_contact TEXT NULL (optional second phone)
    - notes TEXT NULL
  - Indexing and quality:
    - Keep idx_customers_name and idx_customers_contact
    - Add partial unique index on lower(trim(name)), lower(trim(contact)) where contact is not null for dedup assistance (not strict unique; use a helper view/process for suggestions rather than hard constraints).
- API layer
  - Create src/lib/api/customers.ts and src/lib/api/customers.supabase.ts
    - listCustomers({ search, limit, offset })
    - getCustomer(id)
    - createCustomer({ name, contact, email, address, gst_number })
    - updateCustomer(id, payload)
    - deleteCustomer(id)
    - searchCustomers(term) – ILIKE on name/contact/email
  - Define shared types in src/lib/types/customers.ts (Customer, CreateCustomerInput, UpdateCustomerInput)
- Reusable UI components
  - CustomerPicker component (src/components/customers/customer-picker.tsx)
    - Typeahead search with debounce, keyboard navigation
    - Shows top matches with name + contact
    - “Add new customer” affordance opens QuickAdd modal
  - QuickAdd Customer modal (src/components/customers/customer-quick-add.tsx)
    - Minimal schema: name (required), contact, email, address, gst_number (optional)
    - On success, resolves with new customer and selects it
  - Consistency with existing stack: react-hook-form + zod + shadcn UI
- Cross-module integration (first pass)
  - BMS battery-form: replace Select with CustomerPicker
    - File: src/components/bms/battery-form.tsx (field: customer_id)
  - Tickets new page: replace Select with CustomerPicker
    - File: src/app/dashboard/tickets/new/page.tsx (field: customer_id)
  - Billing forms (quotes/invoices): keep embedded customer schema, but add optional “Select from Customers” button that launches CustomerPicker to prefill fields
    - Files: src/components/billing/quotes/quote-form.tsx, src/components/billing/invoices/invoice-form.tsx
- Navigation and routes (stubs)
  - Add routes for /dashboard/customers (list) and /dashboard/customers/new (create form)
  - Update Admin quick actions to point at implemented pages; keep existing links but ensure pages render
- Acceptance Criteria
  - From Tickets New and Battery Form, I can search an existing customer or quick-add a new one without leaving the page
  - Billing forms can prefill from a selected master customer
  - Customers API supports list, create, get with basic search

Phase 2: Customers Pages (List, Create/Edit, Detail)
- Pages
  - List: src/app/dashboard/customers/page.tsx
    - Columns: Name, Contact, Email, Created, Last Activity (computed later)
    - Filters: search (name/contact/email), pagination
  - Create/Edit: src/app/dashboard/customers/new/page.tsx and src/app/dashboard/customers/[id]/edit/page.tsx
    - Validations via zod; optimistic UX; toast feedback
  - Detail: src/app/dashboard/customers/[id]/page.tsx
    - Summary: name, contact, email, address, gst_number
    - Activity: linked tickets (via service_tickets.customer_id), batteries (via battery_records.customer_id), and later invoices/quotes
- API enrichments
  - Add listCustomerActivity(id, { limit }) to aggregate recent linked items (service tickets, battery records). For now, do parallel Supabase reads client-side if a server layer isn’t ready.
- UX/Accessibility
  - Keyboard and screen-reader support for CustomerPicker
  - Useful empty states and skeletons
- Acceptance Criteria
  - I can view customers list with search and paginate results
  - I can create, edit, and delete customers via UI
  - Customer detail shows recent tickets and batteries

Phase 3: Billing Integration (Linking and Sync)
- Prefill and link behavior
  - Quotes/Invoices: Add “Link to master customer” control near Customer Information
    - Selecting a master customer pre-populates name, phone, address, gstNumber
    - Keep fields editable in the document (snapshot semantics)
  - Optional persistence
    - If invoice is created while linked to a master customer, store the customer_id in invoice storage (if/when invoice persistence exists); otherwise keep the snapshot only
- DB updates
  - If a billing store exists or is added later, include customer_id foreign key to customers
- Acceptance Criteria
  - In Quotes/Invoices, I can pick an existing customer to prefill details, without forcing a strict link
  - If persistence is available, invoice records keep a reference to customers.id

Phase 4: Quality of Life and Governance
- Deduplication and merge
  - Build “Possible duplicates” page using similarity checks (name/contact/email \~ ILIKE). Offer a merge UI to consolidate references (tickets, batteries, future invoices) into a target customer
- Imports/Exports
  - CSV import (name, contact, email, address, gst) with preview, validation, and dry-run
  - CSV export for reporting
- Auditing and activity
  - Basic audit log entries on create/update/delete
  - Render audit timeline on customer detail
- Permissions and RLS
  - Confirm existing RLS policies; add RLS policies for customers if not already sufficient
- Acceptance Criteria
  - I can identify duplicate customers and merge them safely
  - I can import/export customers with validation

Phase 5: Performance, Tests, and Polishing
- Performance
  - Add indexes for common searches (already present for name/contact; consider email index)
  - Debounced search and limit results
- Testing
  - Unit tests for customers API and UI components (CustomerPicker & QuickAdd)
  - E2E smoke tests: create customer, pick customer in tickets/bms forms
- Docs
  - Developer README updates for customers API and components


Technical Design Details

Data model and migrations
- SQL changes (append in src/lib/database/bms-schema.sql or a new migration):
  - ALTER TABLE customers ADD COLUMN gst_number TEXT NULL;
  - ALTER TABLE customers ADD COLUMN alt_contact TEXT NULL;
  - ALTER TABLE customers ADD COLUMN notes TEXT NULL;
  - CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  - Optional helper index for fuzzy search: trigram extension if supported later

Types
- src/lib/types/customers.ts
  - export interface Customer { id; name; contact?; email?; address?; gst_number?; created_at; updated_at }
  - export interface CreateCustomerInput { name: string; contact?: string; email?: string; address?: string; gst_number?: string }
  - export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

API
- src/lib/api/customers.ts
  - Contract with methods: list, getById, create, update, delete, search
- src/lib/api/customers.supabase.ts
  - Supabase implementation with ILIKE-based search and pagination

UI Components
- CustomerPicker (src/components/customers/customer-picker.tsx)
  - Props: value (customer_id | null), onChange, allowQuickAdd, placeholder, disabled
  - Behavior: fetch on focus with recent, debounce search, show quick add trigger
- CustomerQuickAdd (src/components/customers/customer-quick-add.tsx)
  - Form with zod schema; on success returns created Customer

Integration Points
- BMS Battery Form: src/components/bms/battery-form.tsx
  - Replace Select of customers with CustomerPicker
- Tickets New: src/app/dashboard/tickets/new/page.tsx
  - Replace Select of customers with CustomerPicker
- Billing Forms:
  - src/components/billing/quotes/quote-form.tsx
  - src/components/billing/invoices/invoice-form.tsx
  - Add “Select from Customers” button that opens CustomerPicker and prefills embedded fields
- Admin Dashboard quick link
  - src/components/dashboard/admin-dashboard.tsx already links to /dashboard/customers and /dashboard/customers/new; ensure pages exist

Validation and UX Notes
- Zod schemas for customer creation/editing should mirror DB constraints and expected formats
- Use consistent phone formatting rules; allow free text initially with optional normalization later
- GST number optional but validated when provided

Observability
- Basic console error handling via toast errors in UI; later wire a logging/monitoring mechanism


Acceptance Criteria Summary per Phase
- Phase 1: Quick-add from Tickets and BMS; Billing can prefill; APIs exist
- Phase 2: Customers list, create/edit, detail with linked activity
- Phase 3: Billing prefill/link semantics, optional persistence of customer_id in invoices
- Phase 4: Merge duplicates, import/export, audit
- Phase 5: Performance, tests, docs


Open Questions / Decisions
- Should invoices persist to the DB now? If yes, include customer_id on invoice and quote tables and expose those in APIs.
- Dedup strategy: keep soft constraints + merge tooling vs hard unique constraints (prefer soft + tooling initially).
- Authorization scope for who can create/edit/delete customers; align with existing RLS setup.


Implementation Checklist (initial backlog)
- [ ] Add customers API and types
- [ ] Build CustomerPicker and CustomerQuickAdd components
- [ ] Integrate CustomerPicker into battery-form and tickets/new
- [ ] Add prefill-from-customer to quote-form and invoice-form
- [ ] Create /dashboard/customers (list) and /dashboard/customers/new pages
- [ ] Add customer detail page with recent activity (tickets, batteries)
- [ ] Extend DB with gst_number (+ indexes) via migration
- [ ] Tests: unit (API, components) and E2E smoke
- [ ] Docs update for developers

