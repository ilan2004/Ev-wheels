# Manager Dashboard — Design and Execution Plan

## Purpose
Provide location managers a focused, role-appropriate workspace to:
- Create and triage service tickets quickly
- Track due/overdue work and in-progress items
- Assign/reassign technicians and balance workload
- Request inventory movements (issue/receive/transfer) without editing master inventory
- Keep an eye on quotes awaiting approval and invoices with outstanding balances

This dashboard is scoped to the manager’s active location(s), enforced by RLS and client-side filters.

## Personas and Scope
- Manager (this dashboard): Operates within assigned location(s); cannot approve inventory master changes but can request movements.
- Admin (separate dashboard): Cross-location oversight and approvals; full write access (inventory master and approvals).
- Technician (separate dashboard): Task-focused view for execution.

## Permissions Summary (Manager)
- Tickets: create, triage, assign to technicians in their location(s)
- Batteries: view and update status for their location(s)
- Inventory: request movements (issue/receive/transfer), view status; no direct master writes
- Customers: view/create/update in their location(s)
- Sales: view quotes/invoices for their location(s); create/convert quote; capture payments

## Information Architecture (Layout)
1) Header strip
- Greeting + Active location name
- Quick actions: New Ticket, New Quote, Add Customer, Request Movement
- Today’s date

2) KPIs (top tiles)
- Open tickets (reported/triaged/assigned/in_progress)
- Due today
- Overdue
- In progress (batteries diagnosed/in_progress)
- Weekly completed
- Avg Turnaround Time (last 30 days)

3) Ticket pipeline (segmented lists; Kanban in Phase B)
- Columns: Reported / Triaged / Assigned / In Progress / Completed / Delivered
- Card quick actions: Assign tech, open details, change due date (Phase B)

4) Team workload
- Per-technician card: Assigned, In Progress, Due today
- Reassign action (Phase B)

5) Batteries in progress (compact table)
- Serial, customer, status, promised date, owner

6) Inventory movements (summary)
- Pending/Approved requests for the location
- CTA: Request Issue/Receive/Transfer

7) Sales snapshot
- Quotes awaiting customer approval
- Invoices with outstanding balance
- CTAs: New Quote / Collect Payment

8) Alerts
- Overdue tickets/batteries
- Low stock (read-only) and pending requests reminders

## Data Sources and Scoping
- RLS: Limiting reads/writes by location_id and role is already enforced.
- Client scoping: scopeQuery/withLocationId apply activeLocationId when flag is enabled.
- Modules used:
  - service_tickets, vehicle_cases, ticket_attachments
  - customers
  - battery_records (+ technical_diagnostics/status_history)
  - quotes, invoices, payments
  - inventory_movements

## KPI Definitions (Illustrative)
- Open tickets: status in ('reported','triaged','assigned','in_progress') and location_id = :activeLocation
- Due today: tickets with due_date = today (if due_date exists; otherwise skip or derive)
- Overdue: tickets with due_date < today AND status NOT IN ('completed','delivered','closed')
- In progress (batteries): battery_records.status IN ('diagnosed','in_progress')
- Weekly completed: count of battery_records where status transitioned to 'delivered' per week
- Avg TAT: AVG(delivered_date - received_date) for delivered in last 30 days

## UX Flows
- Create Ticket: Quick action → /dashboard/tickets/new (location preselected)
- Assign Technician: From ticket card (Phase B: inline modal)
- Reassign: From Team Workload or Ticket card (Phase B)
- Request Movement: Quick action → /dashboard/inventory/movements (Issue/Receive/Transfer)
- Manage Quotes: Quick action → /dashboard/quotes/new; view pending approvals
- Collect Payments: From invoices with outstanding balance

## Execution Phases

### Phase A — MVP (Implement now)
Scope
- Route Manager role to a new ManagerDashboard component
- Header with quick actions
- KPIs (counts): open tickets, due today, overdue, in progress (batteries), weekly completed, avg TAT (fallback if no data)
- Ticket pipeline as segmented lists (no drag-drop yet)
- Team workload summary (per-tech counts)
- Batteries in progress: compact table
- Inventory movements summary (pending/approved) + Request CTA
- Sales snapshot (counts + recent items)

Files and changes
- New: src/components/dashboard/manager-dashboard.tsx
- Update: src/components/dashboard/dashboard-content.tsx to handle UserRole.MANAGER
- Reuse existing repositories (service_tickets, customers, batteries, billing, inventory_movements) with scopeQuery

Acceptance Criteria
- Manager role sees ManagerDashboard at /dashboard
- KPIs load with location-scoped data without errors
- Ticket lists show only the manager’s active location items
- Inventory movements render and link to Request page
- Sales snapshot displays counts or friendly zero-state

### Phase B — Workflow Enhancements
Scope
- Kanban ticket pipeline with drag-and-drop across columns
- Assign/Reassign technicians via modal (with validation)
- Edit due dates inline from cards
- Filters: status, customer search, promised date range

Files and changes
- ManagerDashboard: add Kanban component and modals
- New lightweight DnD logic leveraging existing state (e.g., @dnd-kit)
- Service ticket repository updates for status/assignee mutations

Acceptance Criteria
- Dragging ticket between columns updates its status persistently
- Assign/Reassign persists and updates UI immediately
- Filtering works without page reload

### Phase C — Advanced KPIs & Notifications
Scope
- Avg TAT trend line; weekly completion chart
- SLA color coding (due dates) and escalations
- Optional notification triggers (email/SMS/WhatsApp) for overdue items (configurable)

Files and changes
- ManagerDashboard charts (reuse existing Chart components)
- Add optional serverless functions/webhooks for notifications

Acceptance Criteria
- Charts load within reasonable time with seeded/real data
- SLA color coding visible on lists and Kanban
- Notification toggles persist and simulate delivery in dev

### Phase D — Quality & Rollout
Scope
- Unit tests for role routing, scoping, and repository calls
- Integration tests for create ticket, assign tech, request movement
- Feature flag gating (allow turning off dashboard sections if needed)
- Accessibility (tab order, aria labels) and performance pass

Files and changes
- Tests under src/**/ for dashboard and repos
- Optional flags: NEXT_PUBLIC_MANAGER_DASHBOARD_ENABLED

Acceptance Criteria
- Tests green; lighthouse and a11y checks pass thresholds
- Rollout doc updated; progressive enablement possible via flags

### Phase E — Nice-to-Have Enhancements
- Saved views and custom dashboards per manager
- CSV export for tickets/batteries in progress
- Printable daily work orders
- Inline customer communication (templated messages)

## Rollout & Monitoring
- Leverage existing Phase 8 flag patterns for progressive enablement
- Monitor Supabase logs for policy rejections and error rates
- Provide Kanban fallback (segmented lists) if DnD degraded

## Open Questions
- Technician assignment model: strict 1 tech per ticket vs team? (default: single assignee)
- Due date SLA definitions per location? (default: configurable, Phase C)
- Notification channels and provider (email/SMS/WhatsApp)? (later)

## Next Steps
- Implement Phase A now (routing + ManagerDashboard + core KPIs and lists)
- Review UX with real seeded data
- Iterate on Phase B Kanban and assignment flows

