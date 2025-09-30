# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Core Development

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues and format code
- `pnpm lint:strict` - Run ESLint with zero warnings tolerance
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting

### Package Manager

This project uses **pnpm**. Always use `pnpm` instead of `npm` or `yarn`.

## Architecture Overview

### Core System

E-Wheels is a **battery service management system** for electric vehicle repair shops built with Next.js 15 App Router. The application centers around role-based access control with two user types:

- **Admin**: Full system access (user management, financial reports, settings)
- **Technician**: Battery & customer management, quotes, inventory updates

### Authentication & Authorization

- **Clerk** handles authentication with custom role management
- **Middleware** (`src/middleware.ts`) protects all `/dashboard` routes
- **Role system** (`src/lib/auth/roles.ts`) defines 25+ granular permissions
- **Route protection** redirects unauthorized users and handles role assignment

### Key Architectural Patterns

#### Permission-Based Access Control

The system uses enum-based permissions mapped to roles:

- `UserRole` enum (ADMIN, TECHNICIAN)
- `Permission` enum (25+ granular permissions)
- `ROLE_PERMISSIONS` mapping defines what each role can access
- Navigation items (`src/constants/data.ts`) include permission requirements

#### Component Structure

- **Feature-based organization**: `src/features/{auth,kanban,overview,products,profile}/`
- **Shared UI components**: `src/components/ui/` (shadcn/ui based)
- **Layout components**: `src/components/layout/` (sidebar, header, providers)
- **Form components**: `src/components/forms/` with React Hook Form + Zod

#### State Management

- **Zustand** for global state (see `src/features/kanban/utils/store.ts`)
- **React Hook Form** for form state management
- **nuqs** for URL state management

### Environment Setup

The application requires Clerk API keys:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Set up redirect URLs in Clerk dashboard:

- Sign-in: `/sign-in`
- Sign-up: `/sign-up`
- After sign-in: `/dashboard`
- After sign-up: `/auth/assign-role`

### Key Business Logic Files

- `src/lib/auth/roles.ts` - Permission system and role definitions
- `src/middleware.ts` - Route protection and role checking
- `src/constants/data.ts` - Navigation configuration with permissions
- `src/lib/auth/utils.ts` - Authentication helper functions

### Route Structure

- `/dashboard` - Role-specific dashboards
- `/dashboard/batteries` - Battery repair tracking
- `/dashboard/customers` - Customer management
- `/dashboard/inventory` - Stock management
- `/dashboard/invoices` - Quote/invoice generation
- `/dashboard/reports` - Analytics (Admin only)
- `/dashboard/users` - User management (Admin only)
- `/dashboard/settings` - System configuration (Admin only)

## Service Intake and Triage System (Vehicle vs Battery)

This section defines the end-to-end workflow when a customer reports an issue (e.g., “vehicle stopped while driving”) and the office staff don’t yet know whether the root cause is in the Vehicle or the Battery. The goal is a single unified intake that is triaged by a technician into the correct module (Vehicle or Battery), with full media capture (photos and audio) and complete traceability.

### 1) Roles and Responsibilities

- Office Staff
  - Create intake ticket while the customer is present/on call
  - Capture customer details, vehicle info (if available), and initial symptom narrative
  - Upload photos (vehicle/battery, dashboard, wiring, damage) and voice notes/audio (customer statements)
- Technician
  - Triage: determine affected module → Vehicle or Battery (or Both)
  - Create and/or link a sub-case in the appropriate module
  - Update diagnostic findings, repair actions, and status transitions
- Lead/Manager
  - Oversee triage decisions, reassign cases, ensure SLA and approvals

### 2) High-Level Workflow

1. Intake (Office)
   - Create Service Ticket (status: reported)
   - Attach media: photos and audio voice notes
   - Collect: customer, vehicle details (make/model/plate), context (when/where it stopped, recent repairs)
2. Triage (Technician)
   - Preliminary checks; decide module:
     - Battery Case → link/create battery record in Battery module
     - Vehicle Case → create vehicle case in Vehicle module
     - Both → create both sub-cases (battery_case and vehicle_case)
   - Ticket status: triaged → assigned
3. Diagnosis & Repair (Module-specific)
   - Battery module uses existing BatteryStatus workflow (received → diagnosed → in_progress → completed → delivered)
   - Vehicle module uses VehicleStatus workflow (see proposal below)
   - Ticket can remain parent with child sub-cases; sub-case status flows independently
4. Handoff/Correction
   - If mis-triaged, re-route: close wrong sub-case, open the other
   - Maintain parent ticket continuity and audit log
5. Completion
   - When relevant sub-cases are completed and delivered → parent ticket closed

### 3) Status Models

- Parent Service Ticket Status
  - reported → triaged → assigned → in_diagnosis → in_repair → waiting_parts | customer_approval → completed → delivered → closed
- Battery Case Status (existing)
  - received → diagnosed → in_progress → completed → delivered → cancelled | on_hold
- Vehicle Case Status (proposed)
  - received → diagnosed → in_progress → completed → delivered → cancelled | on_hold

### 4) Data Model (Supabase) — Proposed Additions

- service_tickets
  - id (uuid), customer_id (uuid), created_by (uuid), assigned_to (uuid)
  - vehicle_make, vehicle_model, vehicle_reg_no (nullable at intake)
  - symptom_description (text), created_at, updated_at, status (enum service_ticket_status)
- ticket_attachments
  - id (uuid), ticket_id (uuid fk), case_type ('parent' | 'battery' | 'vehicle')
  - type ('photo' | 'audio'), storage_path (text), caption (text), uploaded_by (uuid), created_at
- vehicle_cases
  - id (uuid), ticket_id (uuid fk), status (enum vehicle_status), technician_notes (text), created_at, updated_at
- vehicles (optional if you want persistent registry)
  - id (uuid), owner_customer_id, make, model, reg_no, vin, year, created_at, updated_at
- ticket_case_links (optional, for extensibility)
  - id, ticket_id, case_type, case_id

Enums to add:

- service_ticket_status: reported, triaged, assigned, in_diagnosis, in_repair, waiting_parts, customer_approval, completed, delivered, closed
- vehicle_status: received, diagnosed, in_progress, completed, delivered, cancelled, on_hold

Note: Reuse existing battery_records table for Battery cases (link by battery_id).

### 5) Storage for Photos and Audio (Supabase Storage)

- Buckets
  - media-photos: images under prefixes
    - intakes/{ticket_id}/...
    - batteries/{battery_id}/...
    - vehicles/{vehicle_case_id}/...
  - media-audio: audio files
    - intakes/{ticket_id}/...
- Attachment record (ticket_attachments) stores:
  - ticket_id, optional subcase reference (via case_type and link), storage_path, type=photo|audio, caption, uploaded_by
- Access control
  - RLS ties attachment read/write to users with access to the parent ticket or sub-case

### 6) UI/UX Surfaces

- New: Service Intake Form (Office)
  - Minimal required fields to avoid blocking: customer, symptom, optional vehicle details
  - Drag-and-drop photo upload and voice note recording/upload
- Ticket Detail Page (Parent)
  - Timeline of events (intake, triage, assignments, status changes)
  - Attachments tab (photos/audio), Customer info, Vehicle info
  - Triage widget for technicians → route to Battery or Vehicle module (or both)
- Battery Case View (existing)
  - Reuse BatteryDetails and related flows
- Vehicle Case View (new)
  - Mirrors battery with status workflow, diagnostics, notes, attachments
- Global Search
  - Search by ticket id, serial number, registration number, customer name

### 7) Permissions

- Office Staff: create/read tickets, upload media, view attachment thumbnails, cannot change technical statuses
- Technician: triage ticket, create/link cases, update case statuses, add diagnostics and media
- Lead/Manager: reassign, approve estimates, override status, close tickets

### 8) Notifications & Audit

- Notifications: on triage, assignment, status change, and when customer approval is required
- Audit trail: service_ticket_history (or reuse existing status history approach) to log every transition with who/when/notes

### 9) KPIs/Reports (Future)

- Time to triage, time in diagnosis, time in repair
- Bounce rate (mis-triaged and re-routed)
- Attachment coverage (tickets with photos/voice notes)
- Module distribution (vehicle vs battery root causes)

### 10) Integration Points (What exists vs planned)

- Existing: battery_records, battery_status_history, technical_diagnostics → battery module ready
- To add: service_tickets, ticket_attachments, vehicle_cases (+ vehicle_status enum), optional vehicles registry
- Storage: configure buckets and RLS policies to restrict by ticket/case ownership

### 11) Happy Path Example

- Office creates Ticket T-123 for “vehicle stopped while driving”, uploads 3 photos + 1 voice note.
- Tech triages → Battery case created and linked to existing battery record B-UUID.
- Battery case proceeds through diagnosed → in_progress → completed. Parent Ticket moves to completed/delivered and then closed.

### UI Framework

- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS v4** for styling
- **Tabler Icons** for iconography
- **React Hook Form** + **Zod** for form validation
- **TanStack Table** for data tables with filtering/pagination
