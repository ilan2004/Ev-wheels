# 🔋 E-Wheels - Battery Service Management System

<div align="center">
  <h3>Comprehensive Battery Service Management with Role-Based Authentication</h3>
  <p>Built with Next.js 15, TypeScript, Clerk Auth, and shadcn/ui</p>
</div>

---

## 🚀 Features

### ✅ Completed: Role-Based Authentication System
- **🔐 Secure Authentication**: Powered by Clerk with custom role management
- **👥 Two User Roles**:
  - **Admin**: Full system access, user management, financial reports, settings
  - **Technician**: Battery & customer management, quotes, inventory updates
- **🛡️ Permission-Based Access**: Granular permissions with 25+ specific controls
- **🚦 Route Protection**: Middleware-level security for all dashboard routes
- **🎨 Role-Specific UI**: Dynamic navigation and dashboards based on user permissions

### 🔄 Planned Features
- **📦 Inventory Management System**: Track battery stock, parts, and supplies
- **📋 Invoice & Quotation Generator**: Automated billing with customer data
- **🏷️ QR Code Label Printer**: Generate and print battery tracking labels
- **📊 Analytics Dashboard**: Performance metrics and business insights

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org) for type safety
- **Authentication**: [Clerk](https://clerk.com/) with custom role management
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) validation
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Tabler Icons](https://tabler-icons.io/)
- **Error Tracking**: [Sentry](https://sentry.io/) (optional)

## 📋 Business Context

E-Wheels is a battery service management system designed for electric vehicle battery repair shops. The application manages:

- **Battery Repairs**: Track repair status, parts needed, and customer communications
- **Customer Management**: Store customer details, contact information, and service history
- **Inventory Control**: Monitor battery stock, replacement parts, and tools
- **Financial Tracking**: Generate quotes, invoices, and track revenue
- **Quality Control**: Manage repair workflows and ensure consistent service quality

## 🏗️ Application Structure

### Authentication Pages
- **`/sign-in`**: Custom sign-in page with E-Wheels branding
- **`/sign-up`**: User registration with automatic role assignment
- **`/auth/assign-role`**: Role assignment page for new users

### Dashboard Pages
- **`/dashboard`**: Role-specific dashboard (Admin vs Technician)
- **`/dashboard/batteries`**: Battery management and repair tracking
- **`/dashboard/customers`**: Customer information and history
- **`/dashboard/inventory`**: Stock management and alerts
- **`/dashboard/invoices`**: Quote and invoice generation
- **`/dashboard/reports`**: Analytics and financial reports (Admin only)
- **`/dashboard/users`**: User management and role assignment (Admin only)
- **`/dashboard/settings`**: System configuration (Admin only)
- **`/dashboard/profile`**: User profile management

### Role-Based Features

| Feature | Admin | Technician |
|---------|-------|------------|
| View/Create Batteries | ✅ | ✅ |
| Update Battery Status | ✅ | ✅ |
| Delete Battery Records | ✅ | ❌ |
| Customer Management | ✅ | ✅ (View only) |
| Generate Quotes | ✅ | ✅ |
| Generate Invoices | ✅ | ❌ |
| Financial Reports | ✅ | ❌ |
| User Management | ✅ | ❌ |
| System Settings | ✅ | ❌ |
| Print Labels | ✅ | ✅ |

## 📜 Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Authentication route group
│   │   ├── sign-in/[[...sign-in]]/   # Clerk sign-in pages
│   │   └── sign-up/[[...sign-up]]/   # Clerk sign-up pages
│   ├── auth/assign-role/         # Role assignment for new users
│   ├── dashboard/                # Protected dashboard routes
│   │   ├── batteries/             # Battery management
│   │   ├── customers/             # Customer management
│   │   ├── inventory/             # Inventory management
│   │   ├── invoices/              # Quote & invoice generation
│   │   ├── reports/               # Analytics (Admin only)
│   │   ├── users/                 # User management (Admin only)
│   │   └── settings/              # System settings (Admin only)
│   └── globals.css
│
├── components/
│   ├── auth/                     # Authentication components
│   │   └── role-guard.tsx         # Role-based access control
│   ├── dashboard/               # Dashboard components
│   │   ├── admin-dashboard.tsx
│   │   └── technician-dashboard.tsx
│   ├── layout/                  # Layout components
│   │   └── app-sidebar.tsx        # Role-filtered navigation
│   └── ui/                      # shadcn/ui components
│
├── lib/
│   ├── auth/                    # Authentication utilities
│   │   ├── roles.ts               # Role definitions & permissions
│   │   └── utils.ts               # Auth helper functions
│   └── utils.ts                 # General utilities
│
├── hooks/                       # Custom React hooks
│   └── use-auth.ts               # Authentication hooks
│
├── types/                       # TypeScript definitions
│   └── index.ts
│
└── middleware.ts                # Route protection middleware
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and **pnpm**
- **Clerk Account** (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ilan2004/Ev-wheels.git
   cd Ev-wheels
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # .env.local is already created - add your Clerk keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   CLERK_SECRET_KEY=sk_test_your_secret_here
   ```

4. **Get Clerk API Keys**
   - Go to [dashboard.clerk.com](https://dashboard.clerk.com/)
   - Create a new application: "E-Wheels"
   - Copy your API keys to `.env.local`
   - Set redirect URLs in Clerk dashboard:
     - Sign-in URL: `/sign-in`
     - Sign-up URL: `/sign-up`
     - After sign-in: `/dashboard`
     - After sign-up: `/auth/assign-role`

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Sign up for your first account (gets Technician role)
   - Manually promote to Admin in Clerk dashboard if needed

### 📝 Creating Your First Admin User

1. Sign up through the application
2. Go to your Clerk Dashboard → Users
3. Find your user and edit "Public metadata"
4. Add this JSON:
   ```json
   {
     "role": "admin",
     "employeeId": "EW001", 
     "department": "Administration",
     "hireDate": "2025-01-24"
   }
   ```
5. Refresh the application to see admin features

## 🔧 Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm format       # Format with Prettier
```

### Key Development Files

- **`/src/lib/auth/roles.ts`**: Define roles and permissions
- **`/src/middleware.ts`**: Route protection logic
- **`/src/constants/data.ts`**: Navigation configuration
- **`/src/components/auth/role-guard.tsx`**: Component access control

## 🚀 Deployment

This application is ready to deploy to Vercel, Netlify, or any Node.js hosting provider.

1. **Environment Variables**: Add your Clerk keys to your hosting provider
2. **Build Command**: `pnpm build`
3. **Output Directory**: `.next` (for Vercel, this is automatic)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is private and proprietary to E-Wheels.

---

**Built with ♥️ for E-Wheels Battery Service Management**
