# Clinic Patient Management System Architecture & Progress

## 1. Project Overview
Enterprise-grade Clinic Patient Management System engineered for medical clinics with real-time digital payment reconciliation.
- **Backend**: NestJS, TypeScript, REST API, Swagger/OpenAPI, Prisma ORM, PostgreSQL.
- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide monochromatic medical icons.
- **Payment Engine**: `khqr-helper` (pay-helper) dynamic EMVCo KHQR Tag 01=12 with 0.3s real-time settlement verification, supporting ABA Mobile and Bakong deep links.

---

## 2. Completed Phases

### Iteration 1: Phases 1 - 3
- **Phase 1: Repository Setup and Monorepo Architecture**: Clean workspace setup, `.env.example`, `.env`, `.gitignore`.
- **Phase 2: Database and Prisma Architecture**: Full PostgreSQL normalized schema, seed script with Admin, Doctor, Receptionist, Cashier, test patients, test prescriptions, paid invoices.
- **Phase 3: NestJS Backend Core and REST API Modules**: Modular backend with Prisma, Auth, Patients, Visits, Prescriptions, Payments (powered by real `khqr-helper`), Dashboard, and Swagger `/api/docs`.

### Iteration 2: Phases 4 - 6
- **Phase 4: Authentication & Role-Based Access Control (RBAC)**:
  - User and Staff Management module (`UsersModule`, `UsersService`, `UsersController`) with `@Roles(Role.ADMIN)` protection.
  - Doctor listing endpoint (`/api/users/doctors`) for clinic reception and consultation assignment.
  - Password management endpoint (`/api/auth/change-password`).
  - Active status toggle for staff security.
- **Phase 5: Next.js Frontend Clinical Foundation & Design System**:
  - Medical SaaS monochromatic aesthetic with zero emojis (Lucide icons only).
  - Responsive Mobile Navigation Dock for native mobile app feel.
  - Desktop clinical sidebar navigation.
  - Centralized authenticated API client (`api.ts`) and `AuthContext` with JWT persistence.
  - Responsive App Shell, Navbar, and Modal / Drawer component.
- **Phase 6: Patient Management & Duplicate Prevention UX**:
  - Live debounced patient search by Patient Code, Name (EN/KH), and Phone number.
  - Patient table with gender, blood type, phone, and allergy warnings.
  - Patient registration slide-up bottom sheet / modal.
  - Real-time duplicate patient detection with warning banner for identical phone or national ID before submission.

---

## 3. Next Queued Iteration (Phases 7 - 9)
- **Phase 7**: Patient 360 Comprehensive Timeline & Clinical Profile View.
- **Phase 8**: Visits & Medical Records UI (Vital Signs tracker, physical exam form, clinical diagnosis).
- **Phase 9**: Prescriptions & Pharmacy Dispensing UI with real-time KHQR Checkout Integration.
