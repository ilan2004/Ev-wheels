# Ticket Detail UX Plan

This document tracks the UX enhancement roadmap for the Ticket Detail page.

## Phase 1 (now): Visual polish and quick actions

- Status pills with semantic colors
- Sticky header summary bar with quick actions
- Role-aware control gating (admin/technician)
- Skeleton loading states for details, attachments, and activity

## Phase 2: Attachments and timeline

- Media viewer modal with zoom/pan and navigation
- Attachment filtering (All/Photos/Audio), sort, bulk select
- Activity timeline with icons, diffs, and filters

## Phase 3: Triage and approvals

- Preset triage note templates and quick actions
- Assign technician (with optional Slack notify toggle)
- Approval-focused callout with reminder and copy-link actions

## Phase 4: Power features

- QR code and share link for quick mobile access
- Print/export (PDF) for summary and timeline
- Keyboard shortcuts and KBar actions scoped to the ticket

## Status color mapping

- reported: slate (neutral)
- triaged: indigo
- assigned: sky
- in_progress: amber
- waiting_approval: violet
- completed: emerald
- delivered: teal
- on_hold: zinc
- cancelled/closed: rose (destructive)
