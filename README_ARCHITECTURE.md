# Clinic Patient Management System Architecture & Progress

## 1. Project Overview
Enterprise-grade Clinic Patient Management System engineered for medical clinics with real-time digital payment reconciliation.
- **Backend**: NestJS, TypeScript, REST API, Swagger/OpenAPI, Prisma ORM, PostgreSQL.
- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS, Lucide monochromatic medical icons.
- **Payment Engine**: `khqr-helper` (pay-helper) dynamic EMVCo KHQR Tag 01=12 with 0.3s real-time settlement verification, supporting ABA Mobile and Bakong deep links.

---

## 2. Implemented Phases (Iterations 1: Phases 1 - 3)

### Phase 1: Repository Setup and Monorepo Architecture
- Clean monorepo workspace configuration (`backend` + `frontend`).
- Root configuration with `.gitignore`, `.env.example`, `.env`.
- Strict TypeScript configuration across workspaces.
- Monochromatic, zero-emoji medical design system enforced.

### Phase 2: Database and Prisma Architecture
- Production PostgreSQL database schema with Prisma ORM:
  - **`User` & `Role`**: RBAC with ADMIN, DOCTOR, RECEPTIONIST, CASHIER, PHARMACIST.
  - **`Patient`**: Demographics, medical identifiers, allergy registry, emergency contacts, indexed search fields.
  - **`Visit`**: Clinical encounter tracking, vital signs registry, diagnosis, consultation fee.
  - **`MedicalRecord`**: Physical exam findings, clinical assessment, treatment plan.
  - **`Prescription` & `PrescriptionItem`**: Multi-item medication prescribing with dosage, frequency, duration, quantity, unit pricing.
  - **`Invoice`**: Clinical billing supporting consultation and medication line items.
  - **`PaymentTransaction`**: Real KHQR transaction tracking with MD5 hash, dynamic QR payload, deeplink matrix.
  - **`FollowUp`**: Appointment scheduling and continuity of care.
  - **`AuditLog`**: Financial and medical record audit compliance logs.
- Realistic database seed script (`backend/prisma/seed.ts`).

### Phase 3: NestJS Backend Core and REST API Modules
- **Modular Architecture**:
  - `PrismaModule`: Global database access layer.
  - `AuthModule`: Secure JWT authentication, bcrypt password hashing, `JwtAuthGuard`, `RolesGuard`.
  - `PatientsModule`: Duplicate detection engine (phone/national ID), search with pagination, full Patient 360 lookup.
  - `VisitsModule`: Patient check-in, vital signs update, consultation completion with automated fee invoicing.
  - `PrescriptionsModule`: Multi-item prescription issuance, pharmacy dispensing workflow with automatic billing invoice generation.
  - `PaymentsModule`: Powered by `khqr-helper` (pay-helper) for dynamic Tag 01=12 KHQR synthesis, ABA/Bakong deeplinking, and instant settlement.
  - `DashboardModule`: Real-time queue metrics, today visits, and live KHQR/Cash revenue reporting.
- **OpenAPI / Swagger**: Live interactive API documentation at `/api/docs`.

---

## 3. Next Queued Iteration (Phases 4 - 6)
- **Phase 4**: Advanced RBAC fine-grained permission guards and audit trails.
- **Phase 5**: Next.js Frontend Foundation & Design System (monochromatic clinical UI, mobile navigation dock, bottom drawer sheets).
- **Phase 6**: Patient Registration & Duplicate Prevention UX.
