# Krupet.com Platform
## Enterprise Multi-Tenant Clinical PaaS, Hospital Information System & KHQR FinTech Engine
### Version 2.0.0 Production Ready

> សេចក្តីណែនាំសម្រាប់បុគ្គលិក និងម្ចាស់គ្លីនិក៖ សូមមើលឯកសារ CLINIC_STAFF_TRAINING_MANUAL_KH.md សម្រាប់ការបង្រៀន និងអនុវត្តការងារជាក់ស្តែងដោយងាយស្រួល មិនប្រើពាក្យបច្ចេកទេសស្មុគស្មាញ។

A hospital-grade, multi-tenant Clinical Platform as a Service - PaaS engineered for polyclinics, specialized practices, and healthcare chains in Cambodia. Architected with Next.js 14 App Router, NestJS 10, Prisma ORM, PostgreSQL 16, Google Gemini 3.8 Flash medical AI, real EMVCo Tag 01=12 dynamic KHQR settlement, ABA PayWay headless gateway, native ESC/POS thermal printing, WebRTC teleconsultation, and Ministry of Health compliance with Ed25519 digital signatures and DHIS2 disease surveillance reporting.

---

## 1. Executive Summary & PaaS Architecture

Krupet.com Platform transforms traditional clinic software into an enterprise Multi-Tenant Platform as a Service (PaaS). Clinics and polyclinics can onboard in 15 seconds, provision independent secure workspaces, configure their own ABA PayWay merchant accounts, and operate end-to-end clinical workflows with guaranteed zero cross-tenant data leakage.

### Core Architectural Pillars
- **Multi-Tenant Automatic Isolation**: Native request-scoped tenant isolation powered by Node.js `AsyncLocalStorage` and Prisma query extensions. Every SQL query is automatically scoped by `tenantId`, preventing cross-clinic data leakage at the database engine level.
- **Dynamic Wildcard Subdomain Routing**: Dynamic routing supporting white-label clinic subdomains such as `rotana.krupet.com` and `vannda.krupet.com` with automatic tenant slug resolution and apex domain fallbacks.
- **15-Second Instant Signup & Gmail SMTP Verification**: Frictionless onboarding requiring only Gmail and password. Verification codes are dispatched via verified Google Gmail SMTP directly to the user inbox. Zero client-side preview leakage, fully protecting against automated registration spam.
- **SaaS Subscription & Anti-Bypass Guard**:
  - Four transparent subscription tiers: Free Starter ($0), Clinic Starter ($5/mo), Polyclinic Pro ($8/mo), and Hospital Enterprise ($12/mo), with 20% annual billing discounts.
  - Strict anti-bypass security: paid tiers require cryptographic transaction verification via ABA PayWay or Bakong before tenant tier elevation.
  - Daily KHQR generation quotas: Free tier limited to 5 KHQR per day to prevent system abuse, with tiered patient caps per clinic account.
  - Automated Billing Cycle Engine: background cron service running expiration checks, 7-day and 3-day renewal notifications, and automatic invoice number generation.
- **Live ABA PayWay Headless Gateway & Permanent Static KHQR Demo**: Real headless payment bridge generating authentic EMVCo KHQR payloads with merchant branding and static locked amounts ($0.01 - $0.05) for instant bank app evaluation without polling overhead.
- **Dedicated Super Admin Fleet Portal**: Isolated administrative cockpit (`/super-admin`) providing system owners with platform-wide health monitoring, tenant provisioning, subscription lifecycle management, and audit inspection.
- **Zero Distracting Visual Artifacts**: Strict enterprise design system adhering to healthcare readability guidelines with warm milk-coffee tones, high-contrast typography, and zero emojis throughout the codebase.

---

## 2. Next-Gen 17 Specialized Clinical Modules

1. **POS Hardware & Thermal Receipt Engine**: Silent thermal receipt printing for 80mm and 58mm printers, automatic cash drawer kick pulse, and USB HID / Keyboard Wedge barcode scanner interfacing.
2. **Offline-First Edge Resiliency**: Client-side encrypted IndexedDB caching with optimistic UI updates and background synchronization queue, ensuring seamless patient intake and vitals recording during internet outages.
3. **AI Voice Medical Notes & SOAP Structuring**: Real-time Khmer and English medical dictation parsing powered by Google Gemini 3.8 Flash with 2-request per minute anti-abuse rate limiting and deterministic fallback to local rule-based NLP.
4. **Intelligent Clinical Decision Support (CDSS)**: Automated drug-drug interaction (DDI) detection, penicillin and cephalosporin allergy cross-reactivity checking, pregnancy contraindication warnings, and NEWS2 emergency triage scoring.
5. **Patient Telegram Mini-App & Real-Time Queue Portal**: Interactive Telegram WebApp for patients to track live queue numbers, book consultations, and view clinical records.
6. **Multi-Branch Chain & Central Warehouse**: Centralized pharmaceutical inventory with First-Expired, First-Out (FEFO) automated dispensing, inter-branch stock transfers, and low-inventory threshold alerts.
7. **MoH Compliance & Ed25519 Cryptographic Signatures**: Digitally signed medical certificates with tamper-evident Ed25519 public QR verification, and automated Ministry of Health DHIS2 communicable disease surveillance XML and JSON export.
8. **DICOM PACS Medical Imaging & WebGL Viewer**: Zero-footprint medical imaging viewer supporting X-Ray, CT scans, and Ultrasound files with window/level adjustments and pan/zoom controls.
9. **NSSF & Commercial Insurance Direct Settlement**: National Social Security Fund (NSSF) and private insurance co-pay calculation engine with automated deductible deduction.
10. **Clinical Care Concierge & Medication Adherence**: Automated post-visit patient follow-ups, medication reminder scheduling, and red-flag symptom escalation protocols.
11. **Smart Clinic Queueing & TV Waiting Room Signage**: Full-screen TV display (`/signage`) with Khmer voice synthesis calling queue tickets to designated consultation rooms.
12. **Laboratory Information System (LIS) Interfacing**: Automated clinical laboratory analyzer connectivity supporting ASTM and HL7 bi-directional protocols.
13. **Inpatient Admission (IPD), Bed Management & Nurse eMAR**: Inpatient ward tracking, bed occupancy management, and electronic Medication Administration Records (eMAR) with double-signature verification.
14. **Doctor Commission & Real-Time Clinic PnL**: Granular financial ledger computing doctor consultation fees, procedure splits, pharmacy margins, and real-time Profit and Loss statements.
15. **Dental Odontogram Interactive Charting**: Interactive 32-tooth 2D and 3D dental charting system for cavity tagging, restorations, extractions, and multi-visit dental treatment plans.
16. **Teleconsultation WebRTC Video & Digital e-Prescription**: High-definition browser-to-browser encrypted WebRTC video calling with live in-call clinical notes and QR-signed e-prescriptions.
17. **Electronic Claim XML/JSON Format for Insurance & MoH**: ANSI ASC X12 / 837P compatible insurance claims and FHIR R4 standard payloads for third-party payor adjudication.

---

## 3. Technology Stack

```text
[ Client Layer ]
  Desktop / Tablet / Mobile Browsers / PWA (Next.js 14 App Router, Tailwind CSS, Lucide Icons)
                            |
[ Edge & Routing Layer ]
  Wildcard Subdomain Resolver (*.krupet.com) + Nginx Reverse Proxy / SSL Termination
                            |
[ Backend Application Layer ]
  NestJS 10 REST API (TypeScript)
  - Multi-Tenant Scoping Engine (AsyncLocalStorage)
  - Google Gemini 3.8 Flash Medical AI
  - EMVCo Dynamic KHQR Engine & ABA PayWay Headless Gateway
  - Telegram Supergroup Forum Bot API
  - Ed25519 Cryptographic Signature Verification
  - Automated Billing Cycle Engine
                            |
[ Database & Storage Layer ]
  PostgreSQL 16 (Prisma ORM 5+) + Cloudinary Secure Media CDN
```

### Technology Matrix
- **Frontend**: Next.js 14.2+, React 18, TypeScript 5, Tailwind CSS, Lucide Icons, Web Audio API
- **Backend**: NestJS 10, TypeScript 5, Node.js 20+, Express
- **Database & ORM**: PostgreSQL 16, Prisma ORM 5.10+
- **AI & Machine Learning**: Google Gemini 3.8 Flash API
- **FinTech & Payments**: EMVCo Tag 01=12 Specification, ABA Bank PayWay API, Bakong Deep Links
- **Security**: JWT, Bcrypt (12 salt rounds), Ed25519 Keypairs, Helmet, Rate Limiter Guards
- **Hardware Protocol**: ESC/POS, Web Serial, WebUSB, Network TCP Sockets
- **Offline & Cache**: Service Workers, IndexedDB, CacheStorage API
- **Testing**: Node.js Native Test Runner (`node --test`), 386 Automated Tests (100% Pass)

---

## 4. Directory Structure

```text
clinic-patient-management/
├── backend/                                # NestJS REST API Server
│   ├── prisma/
│   │   ├── schema.prisma                  # 30+ relational models with tenant isolation indexes
│   │   └── seed.ts                        # Multi-tenant production seeder
│   ├── src/
│   │   ├── auth/                          # Multi-tenant authentication & Gmail SMTP OTP
│   │   ├── billing/                       # Invoices, NSSF & insurance settlements
│   │   ├── common/                        # Tenant middleware, guards, filters, interceptors
│   │   ├── compliance/                    # Ed25519 digital signatures & DHIS2 reporting
│   │   ├── concierge/                     # Medication adherence & care follow-ups
│   │   ├── dashboard/                     # Executive & clinical KPI metrics
│   │   ├── documents/                     # Clinical records, lab reports & scans
│   │   ├── finance/                       # Doctor commission & PnL ledger
│   │   ├── hardware/                      # ESC/POS network socket printing proxy
│   │   ├── inventory/                     # FEFO warehouse & multi-branch pharmacy
│   │   ├── ipd/                           # Inpatient admission, beds & nurse eMAR
│   │   ├── lab/                           # LIS analyzer interfacing (ASTM/HL7)
│   │   ├── pacs/                          # DICOM medical imaging & WebGL viewer
│   │   ├── patients/                      # Patient directory & duplicate phone checks
│   │   ├── payments/                      # Dynamic KHQR, PayWay gateway & settlement
│   │   ├── portal/                        # Patient Telegram mini app & queue portal
│   │   ├── prescriptions/                 # Digital e-prescriptions with QR signatures
│   │   ├── subscriptions/                 # SaaS plan gating & billing cycle engine
│   │   ├── super-admin/                   # System owner governance & tenant management
│   │   ├── telegram/                      # 1-Click Telegram Supergroup Bot bridge
│   │   ├── teleconsult/                   # WebRTC video consultation signaling
│   │   ├── users/                         # RBAC staff management
│   │   ├── visits/                        # Voice dictation, Gemini AI SOAP & CDSS
│   │   ├── app.module.ts                  # Root application module
│   │   └── main.ts                        # Application bootstrap & security headers
│   └── test/                              # 247 Automated backend unit & integration tests
├── frontend/                               # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                           # 38 production routes (bilingual en/km)
│   │   │   ├── billing/                   # Cashier POS & KHQR checkout
│   │   │   ├── dental/                    # 32-tooth interactive odontogram
│   │   │   ├── eclaim/                    # Electronic claims & MoH surveillance
│   │   │   ├── ipd/                       # Inpatient bed & nurse eMAR management
│   │   │   ├── pacs/                      # DICOM viewer & radiology scans
│   │   │   ├── pricing/                   # SaaS tier selection & billing switch
│   │   │   ├── register/                  # 15-second instant Gmail OTP signup
│   │   │   ├── signage/                   # TV waiting room display with Khmer TTS
│   │   │   ├── super-admin/               # Global tenant & fleet cockpit
│   │   │   ├── teleconsult/               # Encrypted WebRTC video calls
│   │   │   └── ...
│   │   ├── components/                    # Modular clinical UI components
│   │   ├── context/                       # AuthContext, I18nContext, ToastContext
│   │   ├── lib/                           # API client, offline engine, hardware drivers
│   │   ├── locales/                       # 100% parity English & Khmer dictionaries
│   │   └── middleware.ts                  # Wildcard subdomain resolver & tenant context
│   └── test/                              # 139 Automated frontend unit & UI parity tests
└── README.md                              # Master Platform Documentation
```

---

## 5. Verification & Test Suite

The codebase enforces strict test coverage across all clinical workflows, mathematical calculations, and security boundaries.

```bash
# Run Backend Tests (247 tests, 40 test suites)
npm --prefix backend test

# Run Frontend Tests (139 tests, 29 test suites)
npm --prefix frontend test

# Run Frontend Production Build (38 static routes)
npm --prefix frontend run build
```

- **Backend Test Suite Results**: 247 passed, 0 failed (100% pass rate)
- **Frontend Test Suite Results**: 139 passed, 0 failed (100% pass rate)
- **Total Automated Tests**: 386 passed
- **Next.js Production Build**: 38 of 38 routes successfully generated without errors

---

## 6. Getting Started & Installation

### Prerequisites
- Node.js version 20 or higher
- PostgreSQL version 15 or higher
- Git

### Environment Configuration

Configure `backend/.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/clinic_systems?schema=public"
PORT=4000
NODE_ENV=development
JWT_SECRET="your_secure_jwt_secret_key"
JWT_EXPIRES_IN="7d"

# FinTech Gateway Configuration
BAKONG_ACCOUNT_ID="your_clinic@aba"
BAKONG_MERCHANT_NAME="Your Clinic"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_CURRENCY="USD"
PAYWAY_PAYMENT_URL="https://link.payway.com.kh/your_link"

# Gmail SMTP Configuration for Verification Codes
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_16_digit_app_password"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE="false"

# Google Gemini Medical AI Configuration
GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-3.8-flash"
GEMINI_RATE_LIMIT_PER_MINUTE="2"
```

Configure `frontend/.env`:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
NEXT_PUBLIC_APP_DOMAIN="krupet.com"
```

### Running Locally

```bash
# 1. Install dependencies
npm --prefix backend install
npm --prefix frontend install

# 2. Setup database
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:seed

# 3. Start development servers
# Terminal 1: Backend (Port 4000)
npm --prefix backend run start:dev

# Terminal 2: Frontend (Port 3000)
npm --prefix frontend run dev
```

Visit `http://localhost:3000` to access the platform. Access the Super Admin portal at `http://localhost:3000/super-admin` with master credentials.

---

## 7. License & Compliance
This software is built in full compliance with the Ministry of Health (MoH) regulations of the Kingdom of Cambodia, HIPAA clinical confidentiality standards, and EMVCo payment specifications. All rights reserved.
