# មន្ទីរសម្រាកព្យាបាល ហួន វណ្ណៈ 
## Enterprise Clinical Patient Management, KHQR Billing & Telegram Forum Bot System
### Version 1.0.0 Production Ready

A comprehensive, hospital-grade Clinical SaaS Platform engineered for outpatient polyclinics, maternity centers, and medical practices in Cambodia. Built with Next.js 14 App Router, NestJS, Prisma ORM, PostgreSQL, native ESC/POS hardware integration, EMVCo Tag 01=12 dynamic KHQR settlement with Cloudflare edge network optimization, 1-Click Telegram Supergroup Forum Bot automation, and official Word (.doc) medical exports.

---

## 1. Executive Summary

Houn Vannak Clinical Patient Management System is a unified, local-first medical operations system built to digitize end-to-end outpatient workflows while maintaining strict medical record confidentiality, real-time revenue settlement, and zero clinical data loss during connectivity drops.

### Core Architectural Pillars
- **Medical SaaS UX/UI**: Warm milk-coffee palette (`#F7F4EE`, `#FDFBF7`, `#E7E1D4`, `#231F1C`) optimized for medical eye comfort, responsive desktop sidebar, mobile bottom navigation dock, and zero distracting visual artifacts.
- **Enterprise Security**: Role-Based Access Control (RBAC), bcrypt 12-round cryptographic hashing, rate-limited login attempt throttling, sanitized HTTP error filtering preventing internal query exposure, and strict route guards.
- **Dynamic KHQR Engine & Direct PayWay Integration**: Genuine EMVCo Tag 01=12 dynamic QR generation with locked settlement amounts, CRC16 checksum verification, dual-currency support (USD / KHR), and instantaneous ABA Mobile and Bakong deep link routing. Features direct cloud clearance synchronization with session token management.
- **1-Click Telegram Supergroup Forum Bot Integration**:
  - Official Bot: `@Clinic_systemBot`
  - 1-Click deep link connection (`https://t.me/Clinic_systemBot?startgroup=...`) auto-opens Telegram app and prompts group selection.
  - Automatic Chat ID detection when bot enters group.
  - Smart Permission Inspection: Checks administrator rights and `can_manage_topics`.
  - Auto-creates 4 dedicated forum topics for Payments, Queue, Pharmacy, and Security.
  - Automatic fallback with guidance notifications if administrator rights are pending.
- **Direct Hardware Peripherals**: In-browser ESC/POS driver supporting WebSerial, WebUSB, and Network TCP printing for 80mm and 58mm thermal receipt printers, electronic cash drawer kick pulse, and barcode scanner integration (Keyboard Wedge & USB HID).
- **Official Documentation & Word Exports**:
  - 1-Click Microsoft Word (.doc) export for Medical Fitness & Sick Leave Certificates with Kingdom of Cambodia & Ministry of Health headers.
  - Patient Directory CSV/Excel export with UTF-8 BOM encoding for perfect Khmer font rendering.
- **Custom Invoice Template Designer**: WYSIWYG live invoice designer allowing polyclinics to customize accent colors, clinic logos, Ministry of Health license displays, itemized breakdowns, and receipt paper formats.
- **Local-First & Offline Resilience**: Progressive Web App (PWA) powered by client-side IndexedDB caching and background sync queue, allowing patient intake and vitals triage even during internet outages.
- **Bilingual Interface**: 100% dictionary key parity between Khmer (ភាសាខ្មែរ) and English across all clinical screens.

---

## 2. System Architecture & Tech Stack

```text
[ Hardware Peripherals ]          [ Client Devices ]
  Thermal Printers (Serial/USB/TCP)   Desktop Browsers / Tablets / Phones
  Cash Drawer / Barcode Scanner       Next.js 14 (App Router) + Tailwind CSS + PWA
                 \                    /
                  \                  /
            [ Nginx Reverse Proxy / SSL Termination ]
                           |
            [ NestJS REST API Server (Port 4000) ]
              - Authentication & RBAC Guards
              - Clinical Exception Sanitization Filter
              - EMVCo Dynamic KHQR Engine & Deep Links
              - Telegram Bot & Forum Topics Bridge
              - Hardware Network TCP Proxy
              - Prisma ORM Layer
                           |
            [ PostgreSQL 16 Database (Port 5432) ]
              - Indexed Patient Directory & Audit Ledger
```

### Technology Matrix
- **Frontend Framework**: Next.js 14.2+ (React 18, TypeScript 5, App Router)
- **Styling & Design System**: Tailwind CSS with custom warm milk-coffee theme, glassmorphic cards, Lucide medical icons
- **State & Context**: React Context API (`AuthContext`, `I18nContext`, `ToastContext`), IndexedDB offline engine
- **Backend Framework**: NestJS 10+ (TypeScript, modular architecture)
- **ORM & Database**: Prisma ORM 5+ with PostgreSQL 16
- **Security & Cryptography**: Bcrypt (12 salt rounds), JSON Web Tokens (JWT), Helmet security headers
- **Payment & QR Engine**: EMVCo QR specification, `khqr-helper`, Direct PayWay API with Cloudflare edge synchronization
- **Telegram Bot API**: Telegram Bot API 7.0+ (`Clinic_systemBot`), forum topic management, webhook & update polling
- **Hardware Integration**: Web Serial API, WebUSB API, Web HID API, Node.js raw socket TCP proxy
- **PWA & Offline**: Web App Manifest, Service Worker (`sw.js`), IndexedDB mutation queue
- **Testing**: Node.js native test runner (`node --test`), 100% i18n parity check

---

## 3. Project Structure

```text
clinic-patient-management/
├── backend/                                # NestJS REST API Server
│   ├── prisma/
│   │   ├── schema.prisma                  # 10 clinical models with database indexes
│   │   └── seed.ts                        # Production-ready database seeder
│   ├── src/
│   │   ├── auth/                          # Authentication, JWT & RBAC guards
│   │   ├── common/                        # Sanitized exception filters, decorators
│   │   ├── dashboard/                     # Real-time operational KPI statistics
│   │   ├── documents/                     # Clinical records, lab reports & scans
│   │   ├── follow-ups/                    # Patient recall scheduling & overdue alerts
│   │   ├── hardware/                      # ESC/POS Network TCP printer proxy
│   │   ├── health/                        # Database health check probe
│   │   ├── patients/                      # Patient intake, duplicate phone check
│   │   ├── payments/                      # KHQR generator, deep links, PayWay gateway, settlement
│   │   ├── prescriptions/                 # Pharmacy orders & dispensation audit
│   │   ├── telegram/                      # 1-Click Telegram Bot pairing & forum topic engine
│   │   ├── users/                         # Clinic staff governance
│   │   ├── visits/                        # Outpatient triage, vitals, BMI engine
│   │   ├── app.module.ts                  # Root application module
│   │   └── main.ts                        # Application bootstrap & security headers
│   ├── test/                              # Automated unit & integration tests
│   ├── Dockerfile                         # Production multi-stage Docker build
│   └── package.json                       # Version 1.0.0
├── frontend/                               # Next.js 14 App Router
│   ├── public/
│   │   ├── icons/                         # PWA icons (192x192, 512x512)
│   │   ├── manifest.json                  # Web App Manifest
│   │   └── sw.js                          # Service Worker for offline asset caching
│   ├── src/
│   │   ├── app/                           # App Router routes
│   │   │   ├── billing/                   # Cashier ledger, KHQR checkout, receipts
│   │   │   ├── certificates/              # Medical fitness & sick leave certificates (.doc export)
│   │   │   ├── documents/                 # Medical attachments repository
│   │   │   ├── follow-ups/                # Recall schedule & overdue tracker
│   │   │   ├── invoice-template/          # Custom invoice template designer
│   │   │   ├── login/                     # Staff authentication with lockout defense
│   │   │   ├── page.tsx                   # Operations command center (Dashboard)
│   │   │   ├── patients/                  # Patient directory & registration drawer (CSV export)
│   │   │   │   └── [id]/                  # Patient 360 comprehensive medical dossier
│   │   │   ├── prescriptions/             # Pharmacy dispensing management
│   │   │   ├── queue/                     # Outpatient live waiting line
│   │   │   ├── reports/                   # Financial & clinical analytics by date
│   │   │   ├── settings/                  # Clinic profile, KHQR, hardware, telegram, fees
│   │   │   ├── staff/                     # Staff accounts & role assignments
│   │   │   └── visits/                    # Outpatient triage & vital signs
│   │   ├── components/
│   │   │   ├── common/                    # Logo, LanguageSwitcher, CommandPalette, Modals
│   │   │   ├── hardware/                  # Hardware peripheral connection panel
│   │   │   ├── layout/                    # AppShell, Navbar, Sidebar, MobileNavDock
│   │   │   ├── patients/                  # Patient list & intake drawer
│   │   │   ├── payments/                  # KHQR checkout, cash modal, receipt modal
│   │   │   └── telegram/                  # 1-Click Telegram Bot setup & forum topic manager
│   │   ├── context/                       # AuthContext, I18nContext, ToastContext
│   │   ├── lib/
│   │   │   ├── api.ts                     # Authenticated HTTP client with 401 interception
│   │   │   ├── chime.ts                   # Web Audio procedural sound alerts
│   │   │   ├── errorHandler.ts            # Human-friendly Khmer/English error translator
│   │   │   ├── invoiceTemplate.ts         # Invoice template persistence & configuration
│   │   │   ├── syncManager.ts             # IndexedDB local-first synchronization engine
│   │   │   └── hardware/                  # ESC/POS encoder, drivers (Serial, USB, TCP)
│   │   └── locales/                       # Bilingual dictionaries (en.ts, km.ts)
│   ├── test/                              # Frontend i18n parity & PWA manifest tests
│   ├── Dockerfile                         # Production multi-stage Docker build
│   └── package.json                       # Version 1.0.0
├── docker-compose.yml                     # Unified container orchestration stack
├── .dockerignore
├── .env.example                           # Root environment variable template
├── .gitignore                             # Strict exclusion rules for secrets & logs
└── package.json                           # Monorepo management scripts
```

---

## 4. Key Clinical Modules

### 4.1 1-Click Telegram Bot & Forum Topics Bridge
- **Official Bot**: `@Clinic_systemBot` (Clinic_System).
- **1-Click Connection**: Admin clicks "Connect to Telegram (1-Click Connect)" in **Settings > Telegram Bot**. The browser triggers a deep link opening the Telegram app and prompting the user to pick a group.
- **Auto-Detection**: The backend listens to updates, auto-captures the group Chat ID, and inspects bot administrator rights.
- **Smart Forum Topics Initialization**:
  - Automatically checks `is_forum` and `can_manage_topics`.
  - When verified, automatically creates 4 organized topics:
    1. `[Payments & KHQR] ការទូទាត់ប្រាក់` (Thread ID for real-time settlement alerts)
    2. `[Appointments & Queue] ការណាត់ជួប & ជួររង់ចាំ` (Thread ID for patient check-ins)
    3. `[Pharmacy & Stock] ឱសថស្ថាន & ស្តុកថ្នាំ` (Thread ID for low inventory alerts)
    4. `[Security & Audit] សន្តិសុខប្រព័ន្ធ` (Thread ID for login and backup audits)
- **Smart Administrator Guidance**: If the bot joins as a regular member without admin privileges, it automatically sends a polite Khmer notice in the group guiding administrators to grant the Manage Topics permission, and the dashboard provides an instant re-verify button.

### 4.2 Medical Certificates & Microsoft Word (.doc) Export (`/certificates`)
- Issues standard Cambodian Medical Fitness and Sick Leave Certificates.
- Contains official Kingdom of Cambodia & Ministry of Health headers in Khmer font.
- Features **1-Click Word (.doc) Export**: Downloads an editable Microsoft Word document with official formatting, clinical diagnosis, rest period, doctor signature line, and clinic seal placeholder.

### 4.3 Patient Directory & Excel/CSV Export (`/patients`)
- Instant search across Patient Code, English Name, Khmer Name, or Phone Number.
- Real-time duplicate telephone and national ID checking before intake submission.
- **1-Click CSV/Excel Export**: Downloads full patient registry with UTF-8 BOM encoding, ensuring proper rendering in Microsoft Excel without character corruption.

### 4.4 Dynamic KHQR Settlement & Direct Gateway Integration
- Dual-currency ledger supporting USD and KHR with configurable exchange rates.
- Instant checkout modal generating EMVCo Tag 01=12 dynamic QR codes with exact payable amount lock.
- Direct deep links for ABA Mobile (`abamobile://`) and Bakong.
- **Cloudflare Edge Compatibility**: Uses standardized mobile client profiling and session clearance management to ensure uninterrupted PayWay settlement check reliability on cloud hosting (Vercel, Railway, Render).

### 4.5 Hardware Peripheral Integration (`/settings` > Hardware)
- **Thermal Receipt Printers**: ESC/POS driver supporting WebSerial, WebUSB, and Network TCP proxy (`/api/hardware/print`).
- **Electronic Cash Drawer**: Triggered via standard ESC/POS pulse (`ESC p 0 25 250`) on settlement.
- **Barcode / QR Scanners**: Rapid input detection via Keyboard Wedge mode or Web HID API.
- **Auto-Print on Settlement**: Optional setting to immediately trigger thermal receipt printing upon payment confirmation.

---

## 5. Security & Production Hardening

### 5.1 Strict Route Authentication & Direct Redirect
- Protected route guard in `AppShell.tsx`: unauthenticated users visiting internal pages are immediately redirected to `/login`.
- When accessing `/login`, navigation bars, sidebars, and docks are hidden to ensure clean interface separation and privacy.
- Real-time token validation against `/api/auth/me` clears expired or invalid sessions from client storage immediately.

### 5.2 Rate-Limited Login Protection
- If 5 consecutive failed login attempts occur, the login interface enters a 60-second cooldown period with an active countdown timer.
- Password visibility toggle (Eye/EyeOff) to prevent typing errors.

### 5.3 Exception Sanitization & Information Masking
- The backend `AllExceptionsFilter` catches all unhandled exceptions.
- Database query parameters, Prisma error codes, and internal stack traces are logged securely on the server but never transmitted over HTTP to clients.

---

## 6. Installation & Development Setup

### Prerequisites
- Node.js `v20.x` or `v24.x` (verified on `v24.19.0`)
- npm `v10+`
- PostgreSQL `15` or `16`

### 1. Clone Repository
```bash
git clone https://github.com/Rotananob/Clinic_systems.git
cd Clinic_systems
```

### 2. Configure Environment Files
```bash
# Root environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Ensure `TELEGRAM_BOT_TOKEN="8822219627:AAHjLV4FeVD5XS55BpUil24UgLdR3WsiUsg"` and `TELEGRAM_BOT_USERNAME="Clinic_systemBot"` are present in `backend/.env`.

### 3. Install Monorepo Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 4. Initialize Database & Seed
```bash
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend API (port 4000)
npm run dev:backend

# Terminal 2: Frontend Web App (port 3000)
npm run dev:frontend
```

Access points:
- **Frontend Application**: `http://localhost:3000`
- **Backend API Base**: `http://localhost:4000/api`
- **Swagger Documentation**: `http://localhost:4000/api/docs`
- **Health Check Probe**: `http://localhost:4000/api/health`

---

## 7. Production Deployment Guide

### Deployment Option A: Docker Compose (Recommended)

```bash
docker compose up --build -d
```

Services launched:
- `clinic_postgres`: PostgreSQL 16 on port `5432`
- `clinic_backend`: NestJS API on port `4000`
- `clinic_frontend`: Next.js Web App on port `3000`

### Deployment Option B: Linux VPS (Ubuntu 22.04 / 24.04 LTS)

```bash
# Build backend
cd /var/www/clinic/backend
npm ci
npx prisma db push
npm run prisma:seed
npm run build

# Build frontend
cd ../frontend
npm ci
npm run build
cd ..

# Process Management with PM2
pm2 start backend/dist/src/main.js --name "clinic-backend"
pm2 start "npm --prefix frontend run start" --name "clinic-frontend"
pm2 save
pm2 startup
```

---

## 8. Role-Based Access Reference

| Clinical Role | Core Responsibilities & System Permissions |
| :--- | :--- |
| **ADMIN** | Full administrative governance, staff user accounts, clinic settings, Telegram Bot connection, fee schedule, and audit logs. |
| **DOCTOR** | Patient medical records, consultation notes, vital signs triage, clinical diagnosis, prescriptions, and medical certificates (.doc export). |
| **RECEPTIONIST** | Patient registration, duplicate identity prevention, visit queue intake, and appointment scheduling. |
| **CASHIER** | Consultation and pharmacy invoicing, dual-currency billing, dynamic KHQR settlement, and cash receipts. |
| **PHARMACIST** | Prescription review, medication inventory verification, and drug dispensation confirmation. |

---

## 9. License & Compliance

Houn Vannak Clinical Patient Management System is designed for professional outpatient clinics and polyclinics in the Kingdom of Cambodia, adhering to Ministry of Health (MoH) documentation standards and EMVCo/NBC Bakong payment integration standards.

- **Clinic Name**: មន្ទីរសម្រាកព្យាបាល ហួន វណ្ណៈ (Houn Vannak Medical Clinic & Polyclinic)
- **Release Version**: 1.0.0 Production Ready
- **Repository**: [https://github.com/Rotananob/Clinic_systems.git](https://github.com/Rotananob/Clinic_systems.git)
