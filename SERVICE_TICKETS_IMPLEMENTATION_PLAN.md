# Service Tickets Implementation Plan (Vehicle/Battery Intake & Triage)

This document outlines the phased execution plan to implement the Service Intake and Triage system (parent tickets with Battery/Vehicle cases), aligned with current UI/UX patterns.

---

## Phase 0 — Foundation (DB + Storage + Policies)

What to build

- Supabase tables/enums:
  - service_tickets (parent)
  - ticket_attachments (photos/audio, linked to ticket; optional link to subcase)
  - vehicle_cases (mirror of battery’s statuses)
  - enums: service_ticket_status, vehicle_status
- Supabase Storage buckets:
  - media-photos: intakes/{ticket_id}/..., batteries/{battery_id}/..., vehicles/{vehicle_case_id}/...
  - media-audio: intakes/{ticket_id}/...
- RLS policies for tickets and attachments (read/write by owner/assignee/admin)

How it connects

- Parent service_tickets can link to battery_records and vehicle_cases (one or both)
- Attachments always hang off the parent, with optional case_type to scope to a subcase later

---

## Phase 1 — Intake: Create Ticket (Office)

Screens

- /dashboard/tickets/new: “Create Service Ticket”
  - Fields (required): Customer (select/create), Symptom (textarea)
  - Optional: Vehicle make/model/reg no
  - Media: Drag-drop image upload; audio voice note upload
  - Actions: Save (status = reported), Cancel

UI fit

- Use SectionHeader + Cards + shadcn Form + Zod (like your BatteryForm)
- Media uploader in Card with progress bars and small previews; simple audio player

Data flow

- Create service_ticket row; upload media to storage; store paths in ticket_attachments

Media capture details (Phase 1 scope)

- In-app camera capture (Office Intake)
  - Images: use `<input type="file" accept="image/*" capture="environment">` to open the rear camera on iOS/Android; gracefully falls back to file picker on desktop.
  - Audio: use MediaRecorder API to record short voice notes (e.g., 60–120s). Show timer and size while recording.
  - Client-side processing: generate a compressed WebP/AVIF version and a small thumbnail; enforce file-size limits (e.g., 10MB image, 15MB audio).
  - Upload: show progress, retry on transient errors, store originals + variants to Supabase Storage under `media-photos/intakes/{ticket_id}/` and `media-audio/intakes/{ticket_id}/`.
  - Metadata: create `ticket_attachments` rows with type=photo|audio, storage_path, size, mime, uploaded_by.
- Technician capture (Ticket Detail)
  - Reuse the same capture component from Intake on the Ticket Detail Attachments tab (delivered in Phase 2 UI; the component itself is built in Phase 1).

---

## Phase 2 — Ticket List and Detail (Parent)

Screens

- /dashboard/tickets: table with filters (status, date, search by customer/reg no)
- /dashboard/tickets/[id]: Tabs: Overview | Attachments | Activity
  - Overview: Customer, Symptom, Vehicle (if provided), Ticket Status, Linked Cases, “Triage”
  - Triage widget: Buttons “Route to Battery” / “Route to Vehicle” / “Both”, note input
  - Creates battery_records and/or vehicle_cases, links them to the ticket
  - Sets status: triaged → assigned
  - Attachments: grid of thumbnails, audio list, upload more
  - Activity: timeline of events (created, triaged, status updates)

UI fit

- Reuse Badge (status), Card (sections), Tabs, Table (TanStack)

Customer upload portal via QR link (mobile-friendly) — Deferred (separate folder)

- Note: The customer-facing upload portal will be implemented in a separate folder/module and is not part of Phase 2 scope in this app.
- For Phase 2, focus on internal UI only: tickets list, ticket detail (Overview | Attachments | Activity), and triage widget.
- Optional placeholder: A disabled/hidden "Share Upload Link" button can be shown in Ticket Detail and wired up later when the portal is ready.

---

## Phase 3 — Integrate Battery Cases (Existing)

What to do

- On Ticket Detail, show “Linked Cases”: Battery case links to /dashboard/batteries/[id]
- On Battery Details, show a small strip “Linked Ticket: T-123” back to the parent
- When battery status changes to completed/delivered, reflect in parent Ticket timeline

UX

- Single-click navigation between ticket and battery details
- Keep battery UX unchanged; only add the small linked ticket strip for context

---

## Phase 4 — Vehicle Cases MVP (New)

Screens (mirrors battery)

- /dashboard/vehicles
- /dashboard/vehicles/[id]

Scope

- Status flow: received → diagnosed → in_progress → completed → delivered (with on_hold/cancelled)
- Basic fields: technician_notes, diagnostics summary, costs (optional), created_at, updated_at
- History: vehicle_status_history (optional now; can reuse pattern from battery later)

UX

- Same layout style as Battery Details: SectionHeader + Cards + Tabs (Overview, History, Attachments)
- Keep it lean (notes + statuses first)

---

## Phase 5 — Attachments Enhancements

Features

- Multiple image upload with previews, delete, replace
- Simple audio player list with duration
- Signed URLs for secure access; auto-expire links
- Basic image optimization: store 1–2 web-friendly variants

UX

- Attachments tab on Ticket, Vehicle, Battery pages
- Same uploader component reused across pages

---

## Phase 6 — Audit & Notifications

What to add

- service_ticket_history (who/when/what/note) populated on create/triage/status changes
- Optional notifications (email/Slack) for assignment and approval requests

UX

- Activity timeline in Ticket Detail reads from history
- “Request customer approval” action (if needed) to mark waiting_approval

---

## Phase 7 — Search & Global Navigation

- Global search (command palette or header search):
  - Search tickets by ID, customer, reg no; batteries by serial; customers by name
- Linking
  - From battery/vehicle modules back to the parent ticket, and vice versa

UX

- Keep one-line search with intelligent hints (e.g., “Search ticket, battery serial or customer”)

---

## Phase 8 — Reports & KPIs (Lightweight)

KPIs on a dashboard card group:

- Time to triage, average diagnosis time, in progress counts
- Distribution: vehicle vs battery causes
- Attachment coverage (tickets with photos/voice notes)

---

## Phase 9 — Polish, Performance, Accessibility

- Skeletons/spinners in list/detail pages (your patterns already exist)
- Pagination and server-side filtering for large tables
- Mobile responsive verification
- A11y: focus management in dialogs, labels, keyboard navigation

---

## How it all connects (data flow)

- Office creates Ticket → media attached → status=reported
- Technician triages → creates Battery or Vehicle case (or both); parent links to cases; status=triaged/assigned
- Diagnosis/Repair progresses in module → history entries written; attachments can be added to parent (or case-specific if you want)
- Completion in the relevant case → parent Ticket moves to completed/delivered then closed
- All media stays discoverable at the parent level; optional case-scoped grouping by case_type in attachments

---

## Keeps UI simple and consistent

- Intake form mirrors your existing BatteryForm patterns
- Ticket detail uses Cards + Tabs like your current pages
- Triage is a compact, single decision widget
- Vehicle case mirrors battery; no new UI paradigm
- Reuse existing typographic styles, badges, and layout grids

---

## Incremental delivery checklist

- 0: DB/Storage/RLS ready (service_tickets, ticket_attachments, vehicle_cases, enums, buckets)
- 1: /tickets/new (create + upload photos/audio)
- 2: /tickets (list) + /tickets/[id] (triage + attachments + timeline)
- 3: Link to battery and reflect battery status in ticket timeline
- 4: Vehicle MVP pages (list + details + statuses)
- 5: Attachment improvements and signed URLs
- 6: Audit history + optional notifications
- 7: Global search
- 8: KPIs
- 9: Polish and performance
