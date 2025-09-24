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

### UI Framework
- **shadcn/ui** components with Radix UI primitives
- **Tailwind CSS v4** for styling
- **Tabler Icons** for iconography
- **React Hook Form** + **Zod** for form validation
- **TanStack Table** for data tables with filtering/pagination
