# Technician Dashboard Modification Plan (UI/UX + Implementation)

Scope
- We are modifying the existing technician dashboard screen at /dashboard (role-gated via src/app/dashboard/page.tsx and src/components/dashboard/dashboard-content.tsx which renders src/components/dashboard/technician-dashboard.tsx for UserRole.TECHNICIAN).
- Keep current visual language (EnhancedCard, MetricCard, StatusCard) but reorient content around: New & Untriaged, My Work, and Fast Triage.
- Integrate with existing Case Management flow on ticket details page (src/app/dashboard/tickets/[id]/page.tsx) which renders CaseManagement.tsx.

Primary technician jobs-to-be-done
1) Don’t miss new work
   - Real-time notification when a new service ticket is created at my location
   - One-click open of the ticket detail page to triage
2) Triage quickly and correctly
   - Simple action: route to Vehicle / Battery / Both (handled on ticket page today)
   - See essential context: complaint, priority, due date (if present), hazards, reg no/serial, linked cases
3) Know what I’m working on today
   - Clear “My Work” list with open statuses (triaged, in_progress, on_hold, waiting_approval)
   - Start/continue work from the list and jump back to detail when needed
4) Reduce friction doing the job
   - Quick actions: open ticket, add photo, add note (handled in the detail page; dashboard provides direct entry points)

Information architecture and layout
- Header row
  - Greeting, date (existing)
  - Add a small realtime/connection indicator (reuse useRealtimeSync)
  - Notifications bell with badge for unseen new tickets
  - Quick search box (VIN/reg no/ticket number)
- Left column: New & Untriaged (realtime queue)
  - Source: service_tickets status = 'reported' (location-scoped by RLS)
  - Card shows: ticket number, created_at, symptom, optional vehicle_reg_no, location code, priority, due date if present
  - Actions:
    - Open (navigates to /dashboard/tickets/[id])
    - Quick triage CTA: opens the ticket page with CaseManagement tab focused
- Center column: My Work
  - Source: open tickets most relevant to this technician
    - MVP: tickets where status in ('triaged','in_progress','on_hold','waiting_approval'), sorted by updated_at desc
    - If we want a stricter definition for “my work” without assignments: prioritize tickets where updated_by = current user in last N days
  - Card shows: ticket number, symptom, status pill, last update time
  - Actions: Open, optional quick status update (e.g., start work -> sets status to in_progress)
- Right side: Details drawer
  - When a ticket is selected from any list, open a right-side drawer with essentials:
    - Overview: customer, reg no/serial, hazard badges (if any), recent history snippets
    - Quick actions: Open full page, update status (in_progress, on_hold, completed), add short note (stores into ticket history)
    - This drawer is non-blocking and keeps user on dashboard

UI/UX guidelines
- Minimal visible complexity, fast actions:
  - Keep no more than 2 primary actions visible per card; collapse others under a menu
  - Use clear status pills and priority badges (reuse components where possible)
- Accessibility:
  - Keyboard navigable cards and actions, visible focus rings
  - ARIA live region for new ticket notifications (polite)
  - Sufficient color contrast for status/priority indicators
- Motion and feedback:
  - Subtle framer-motion transitions (match existing)
  - Toasts for success/failure on quick actions
- Empty states:
  - “You’re all caught up” in Inbox / My Work with helpful next steps

Realtime and notifications
- Hook: useRealtimeServiceTickets() already exists; we will:
  - Subscribe to postgres_changes on service_tickets (INSERT/UPDATE)
  - Filter client-side by location (RLS ensures visibility) and event type = INSERT for new tickets
  - Show a toast with actions: Open, Dismiss
  - Increment a badge on the Notifications bell until user views the Inbox
- Fallback:
  - If the realtime channel disconnects, rely on background sync (useBackgroundSync) and show a passive offline banner in header

Data sources and contracts
- Types and schema are already present:
  - ServiceTicketStatus union: reported, triaged, in_progress, completed, delivered, closed, cancelled, on_hold, waiting_approval (src/lib/types/service-tickets.ts)
  - serviceTicketsApi with listTickets(), fetchTicketWithRelations(), triageTicket(), updateTicketStatus() (src/lib/api/service-tickets.supabase.ts)
- Lists used by the dashboard
  - Inbox list: serviceTicketsApi.listTickets({ status: 'reported', limit: 20 })
  - My Work list: serviceTicketsApi.listTickets({ limit: 20 }) filtered client-side to open statuses and optionally updated_by = current user
- Navigation
  - Ticket detail: /dashboard/tickets/[id] (CaseManagement present already)

Component mapping (modifying, not replacing)
- File to evolve: src/components/dashboard/technician-dashboard.tsx
  - Add three sections below the header:
    1) NotificationsBell (new small component) with unseen count (local state)
    2) Inbox (New & Untriaged) list with realtime updates
    3) My Work list with quick status action and drawer opener
  - Add TicketDetailsDrawer component (new) mounted at root of the dashboard to preview essentials
- New small components (suggested locations)
  - src/components/dashboard/technician/notifications-bell.tsx
  - src/components/dashboard/technician/inbox-list.tsx
  - src/components/dashboard/technician/my-work-list.tsx
  - src/components/dashboard/technician/ticket-details-drawer.tsx
- Reuse existing utilities/hooks
  - useRealtimeServiceTickets, useBackgroundSync, useVisibilitySync (src/hooks/use-realtime.ts)
  - Status pills and date formatters (formatDashboardDate, status helpers)
  - serviceTicketsApi for reads/writes

Interaction flows
- New ticket arrives (INSERT realtime)
  1) Badge increments and toast appears
  2) Click Open → navigate to /dashboard/tickets/[id] (CaseManagement tab visible)
  3) In CaseManagement, route to Vehicle/Battery/Both
- Quick start work from My Work
  1) Click Start Work → updateTicketStatus(ticketId, 'in_progress')
  2) Card updates instantly (optimistic), drawer and page reflect new status
- Complete from drawer
  1) Click Mark Complete → updateTicketStatus('completed')
  2) Provide optional note → stored in service_ticket_history (already built via trigger)

Accessibility and responsiveness
- Keyboard-first:
  - Tab order: Inbox → My Work → Drawer actions
  - Enter to open drawer; Space to toggle quick actions menu
  - Escape closes drawer
- Screen readers:
  - ARIA labels for action buttons
  - ARIA-live (polite) on notifications container
- Responsive breakpoints:
  - 1-column on small screens, 2 columns on md, 3-region (Inbox, My Work, Drawer) on lg+

Performance
- Paginate both lists (limit 20), add Load More
- Virtualize long lists if needed (phase 2)
- Debounced search in header for quick nav
- Keep animations subtle to avoid layout jank

Phased rollout
- Phase 1 (MVP)
  - Notifications bell + toast on new tickets
  - Inbox list (reported tickets) with Open action
  - My Work list (open statuses) with quick Start Work and Open actions
  - Ticket details drawer with overview and status change
- Phase 2
  - Saved filters and quick search
  - SLA indicator + due date on cards
  - Hazard badges if available
  - Media quick upload shortcuts (open details page pre-focused)
- Phase 3
  - Timer/worklogs (introduce minimal ticket_work_logs schema if needed)
  - Pinned tickets (user_ticket_pins table) for stronger “my work” semantics
  - Offline-friendly cache hydration

Acceptance criteria (MVP)
- New service ticket created at technician’s location shows in Inbox within 2 seconds (realtime) or 30 seconds (fallback background sync)
- User can open the ticket from Inbox and triage it on the ticket page using CaseManagement (Vehicle/Battery/Both)
- My Work shows open tickets sorted by updated_at; quick Start Work sets status to in_progress and persists
- Drawer lets user mark complete with a note; status and history persist
- All dashboard interactions are accessible via keyboard and screen reader friendly labels

Implementation checklist (concrete tasks)
- Modify src/components/dashboard/technician-dashboard.tsx
  - Wire useRealtimeServiceTickets for tickets
  - Add NotificationsBell and counters
  - Replace static sections with Inbox and My Work lists (Query + skeletons)
  - Mount TicketDetailsDrawer and wire selection state
- Create new components under src/components/dashboard/technician/
  - notifications-bell.tsx: bell icon + badge, menu of recent notifications
  - inbox-list.tsx: list renderer for reported tickets
  - my-work-list.tsx: list renderer for open tickets (sort, filters)
  - ticket-details-drawer.tsx: right-side drawer with overview + status actions
- API integration
  - Use serviceTicketsApi.listTickets(), updateTicketStatus(), triage handled on ticket page
- Reuse styles/components
  - EnhancedCard, MetricCard, StatusCard for consistent look
  - Status pills and date helpers

Open questions
- “My Work” semantics without assignment: for MVP, rely on status in open set and updated_at recency; optionally prefer updated_by = current user
- Do we need a “claim” action? If yes, introduce a lightweight user_ticket_pins table later
- Any hazard/priority fields we should display prominently on cards now, or add in Phase 2?

