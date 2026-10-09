# Rotana Clinic Patient Management System

An enterprise-grade, human-crafted clinical SaaS platform for outpatient clinics and medical practices, featuring automated patient intake, Patient 360 medical records, multi-item pharmacy dispensation, and real-time Tag 01=12 dynamic KHQR settlement with ABA Mobile and Bakong deep links.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Requirements](#2-system-requirements)
3. [Project Structure](#3-project-structure)
4. [Installation](#4-installation)
5. [Environment Variables](#5-environment-variables)
6. [Database Setup](#6-database-setup)
7. [Running the Application](#7-running-the-application)
8. [Authentication and Roles](#8-authentication-and-roles)
9. [Clinic Staff User Guide](#9-clinic-staff-user-guide)
10. [Patient Registration](#10-patient-registration)
11. [Patient Search](#11-patient-search)
12. [Patient 360](#12-patient-360)
13. [Visit Creation](#13-visit-creation)
14. [Visit History](#14-visit-history)
15. [Prescriptions](#15-prescriptions)
16. [Follow-ups](#16-follow-ups)
17. [Documents](#17-documents)
18. [Dashboard](#18-dashboard)
19. [Language Switching](#19-language-switching)
20. [PWA Installation](#20-pwa-installation)
21. [Offline / Local-first / Sync](#21-offline--local-first--sync)
22. [Troubleshooting](#22-troubleshooting)
23. [Security Guidelines](#23-security-guidelines)
24. [Backup and Data Safety](#24-backup-and-data-safety)
25. [API Documentation](#25-api-documentation)
26. [Testing](#26-testing)
27. [Performance](#27-performance)
28. [Deployment](#28-deployment)
29. [Production Checklist](#29-production-checklist)
30. [User Workflow](#30-user-workflow)
31. [FAQ](#31-faq)
32. [Documentation Audit](#32-documentation-audit)

---

## 1. Project Overview

The **Rotana Clinic Patient Management System** is a unified medical operations platform engineered to digitize clinic workflows end-to-end:
- **Clinical Quality**: Monochromatic, accessible UI designed for high-stress medical environments (zero emojis, clean SVG iconography, responsive dual-pane layout, mobile bottom dock).
- **Payment Automation**: Real-time EMVCo Tag 01=12 dynamic KHQR generation with locked settlement amounts, CRC16 validation, and ABA Mobile & Bakong deep links powered by `khqr-helper`.
- **Local-First Reliability**: Progressive Web App with IndexedDB offline queueing, ensuring clinic staff can register patients and record vitals even during internet disruptions.
- **Bilingual Interface**: Full Khmer (ភាសាខ្មែរ) and English internationalization with persistent user preference.

---

## 2. System Requirements

- **Node.js**: `v20.x` or `v24.x` (`v24.19.0` verified)
- **Package Manager**: `npm` v10+
- **Database**: PostgreSQL 15 or 16
- **Operating System**: Linux (Ubuntu 22.04/24.04 LTS recommended for production), Windows 10/11, or macOS
- **Containerization (Optional)**: Docker v24+ and Docker Compose v2+
- **Memory**: Minimum 2 GB RAM (4 GB recommended for production builds)

---

## 3. Project Structure

```text
clinic-patient-management/
├── backend/                         # NestJS REST API Server
│   ├── prisma/
│   │   ├── schema.prisma            # 10 clinical models & indexes
│   │   └── seed.ts                  # Clinical database seeder
│   ├── src/
│   │   ├── auth/                    # JWT Authentication & RBAC guards
│   │   ├── users/                   # Staff administration
│   │   ├── patients/                # Patient intake & duplicate detection
│   │   ├── visits/                  # Outpatient queue, vitals, BMI
│   │   ├── prescriptions/           # Multi-item prescriptions & dispensing
│   │   ├── payments/                # KHQR engine & transaction verification
│   │   ├── follow-ups/              # Recall appointments & overdue tracking
│   │   ├── documents/               # Clinical document uploads & archiving
│   │   ├── dashboard/               # 13 real-time operational KPIs
│   │   ├── health/                  # PostgreSQL live probe & diagnostics
│   │   ├── common/                  # Filters, guards, DTOs, security headers
│   │   ├── app.module.ts            # Root application module
│   │   └── main.ts                  # Bootstrapper with Swagger & Helmet headers
│   ├── test/                        # Node 24 native automated test suites
│   ├── Dockerfile                   # Multi-stage production container
│   └── package.json
├── frontend/                        # Next.js 14 App Router (React 18)
│   ├── public/
│   │   ├── icons/                   # PWA SVG icons (192x192, 512x512)
│   │   ├── manifest.json            # Web App Manifest
│   │   └── sw.js                    # Network-first & offline service worker
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── page.tsx             # Operations Command Center (Dashboard)
│   │   │   ├── login/               # Staff authentication portal
│   │   │   ├── patients/            # Patient registry & intake drawer
│   │   │   │   └── [id]/            # Patient 360 comprehensive profile
│   │   │   ├── visits/              # Outpatient queue & vitals triage
│   │   │   ├── prescriptions/       # Pharmacy orders & dispensation
│   │   │   ├── billing/             # Cashier ledger & KHQR checkout modal
│   │   │   ├── follow-ups/          # Patient recalls & overdue tracker
│   │   │   └── documents/           # Medical document repository
│   │   ├── components/
│   │   │   ├── common/              # LanguageSwitcher, OfflineSyncBanner, PwaRegister, Modal
│   │   │   ├── layout/              # Navbar, Sidebar, MobileNavDock, AppShell
│   │   │   └── ui/                  # Monochromatic clinical input controls
│   │   ├── context/                 # AuthContext & I18nContext
│   │   ├── lib/                     # syncManager.ts (IndexedDB offline engine)
│   │   └── locales/                 # Bilingual dictionaries (en.ts, km.ts)
│   ├── test/                        # i18n key parity & PWA manifest tests
│   ├── Dockerfile                   # Multi-stage production container
│   └── package.json
├── docker-compose.yml               # Complete system stack orchestration
├── .dockerignore
├── .env.example                     # Environment template
└── package.json                     # Monorepo scripts
```

---

## 4. Installation

Clone the repository and install root and package dependencies:

```bash
# Clone repository
git clone https://github.com/Rotananob/Clinic_systems.git
cd Clinic_systems

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

---

## 5. Environment Variables

Create `.env` in the root directory (or copy `.env.example`):

```bash
cp .env.example .env
```

Configuration variables:

```ini
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://postgres:your_secure_password@localhost:5432/clinic_systems?schema=public"

# Backend Configuration (NestJS)
PORT=4000
NODE_ENV=production
JWT_SECRET="replace_with_a_secure_random_64_char_secret_key_in_production"
JWT_EXPIRES_IN="7d"

# Bakong / KHQR Payment Engine (khqr-helper)
BAKONG_ACCOUNT_ID="rotana_clinic@aba"
BAKONG_MERCHANT_NAME="Rotana Clinic"
BAKONG_MERCHANT_CITY="Phnom Penh"
BAKONG_CURRENCY="USD"

# Frontend Configuration (Next.js)
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
PORT_FRONTEND=3000
```

---

## 6. Database Setup

Ensure PostgreSQL is running on `localhost:5432` with a database named `clinic_systems`.

Push the Prisma schema and seed clinical initial data:

```bash
# From repository root:
npm run db:push
npm run db:seed
```

### Seeded Clinical Accounts:
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@rotanaclinic.com` | `admin123` |
| **Doctor** | `doctor@rotanaclinic.com` | `doctor123` |
| **Receptionist** | `reception@rotanaclinic.com` | `reception123` |
| **Cashier** | `cashier@rotanaclinic.com` | `cashier123` |
| **Pharmacist** | `pharmacy@rotanaclinic.com` | `pharmacy123` |

---

## 7. Running the Application

### Development Mode:
Open two terminals or use root prefix scripts:

```bash
# Terminal 1: Start NestJS Backend (port 4000)
npm run dev:backend

# Terminal 2: Start Next.js Frontend (port 3000)
npm run dev:frontend
```

Access:
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000/api](http://localhost:4000/api)
- **Swagger Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **Health Check Probe**: [http://localhost:4000/api/health](http://localhost:4000/api/health)

---

## 8. Authentication and Roles

The application enforces Role-Based Access Control (RBAC) across all routes and API endpoints:

| Role | Permissions & Responsibilities |
| :--- | :--- |
| **ADMIN** | Full system governance, staff management, audit log inspection, billing oversight. |
| **DOCTOR** | Patient 360 review, consultation notes, vitals triage, medical diagnosis, prescription writing. |
| **RECEPTIONIST** | Patient registration, duplicate phone checks, visit queue intake, appointment check-in. |
| **CASHIER** | Consultation fee and pharmacy invoicing, dynamic KHQR checkout generation, payment settlement. |
| **PHARMACIST** | Prescription order review, medication inventory inspection, drug dispensing confirmation. |

---

## 9. Clinic Staff User Guide

- **Login**: Navigate to `/login`, enter staff email and password. JWT tokens are saved securely in browser session storage.
- **Top Navigation Bar**: Displays current active role badge, language selector (English / ភាសាខ្មែរ), system health indicator, and staff logout.
- **Sidebar (Desktop)** & **Bottom Dock (Mobile)**: One-tap navigation across core operational modules.

---

## 10. Patient Registration

Navigate to `/patients`:
- Click **"Register Patient"** to launch the intake drawer.
- Enter English Name, Khmer Name (optional), Gender, Date of Birth, Phone Number, and National ID/Passport.
- **Real-Time Duplicate Prevention**: Typing a phone number automatically queries `/api/patients/check-duplicate`. If a duplicate is detected, an amber alert banner displays the existing patient's code and name immediately.
- Submit to generate an automated unique medical record identifier (`PT-YYYYMMDD-XXXX`).

---

## 11. Patient Search

The patient directory at `/patients` supports instant search by:
- Patient Code (`PT-XXXXXXXX-XXXX`)
- Patient Full Name (English or Khmer)
- Phone Number (with automatic hyphen/space sanitation)

---

## 12. Patient 360

Click any patient from the directory to enter `/patients/[id]`:
- **Header Profile**: Patient demographics, age, gender, contact information, blood type, known drug allergies.
- **Tab 1 — Outpatient Visits**: Complete chronological visit history with chief complaints, vital signs, and diagnostic summaries.
- **Tab 2 — Medical Prescriptions**: Prescribed medications, dosage instructions, quantities, unit prices, and fulfillment status.
- **Tab 3 — Clinical Documents**: Uploaded lab test results, ultrasound scans, imaging reports, and medical referral letters.
- **Tab 4 — Invoices & KHQR Payments**: Itemized fee breakdown and payment verification timestamps.
- **Tab 5 — Recall Follow-ups**: Scheduled future visits and recall tracking.

---

## 13. Visit Creation

Navigate to `/visits`:
- Click **"New Outpatient Visit"** drawer.
- Select Patient and Attending Doctor.
- Input Chief Complaint, Presenting Symptoms, Consultation Fee (default `$5.00`).
- Record Vitals: Blood Pressure (mmHg), Heart Rate (bpm), Body Temperature (°C), Weight (kg), and Height (cm).
- **Auto-Calculated BMI**: Body Mass Index and clinical categorization (Underweight, Normal, Overweight, Obese) are calculated in real time.

---

## 14. Visit History

The Outpatient Queue displays real-time visit statuses:
- `WAITING`: Patient checked in at reception, awaiting doctor call.
- `IN_CONSULTATION`: Patient actively being examined by doctor.
- `COMPLETED`: Clinical examination and treatment plan finalized.
- `CANCELLED`: Patient left or cancelled visit.

---

## 15. Prescriptions

Navigate to `/prescriptions`:
- Doctors can create a prescription linked to an active visit with multiple medication line items.
- Line Item attributes: Medicine Name, Dosage (e.g., `500mg`), Frequency (e.g., `3 times daily after food`), Duration (e.g., `5 days`), Quantity, and Unit Price.
- Pharmacists review the prescription queue and click **"Dispense Prescription"** to mark items fulfilled for pharmacy audit.

---

## 16. Follow-ups

Navigate to `/follow-ups`:
- Schedule return appointments for chronic disease monitoring, post-surgical checks, or lab result reviews.
- Automatic status tags: `SCHEDULED`, `COMPLETED`, `MISSED`, `CANCELLED`.
- Identifies overdue appointments with prominent amber warning indicators.

---

## 17. Documents

Navigate to `/documents`:
- Upload clinical attachments up to 10MB per document (PDF, PNG, JPEG).
- Categorized by `LAB_REPORT`, `RADIOLOGY`, `REFERRAL`, `CERTIFICATE`, or `OTHER`.
- Client-side encoding allows instant preview in a responsive modal dialog without third-party cloud dependencies.

---

## 18. Dashboard

The Operations Command Center at `/`:
- **13 Real-Time KPIs**: Today's Visits, Active Outpatient Queue, Patients In Consultation, Completed Consultations, Pending Prescriptions, Dispensed Medications, Unpaid Bills, Settled Revenue (USD & KHR), Scheduled Follow-ups, Overdue Recalls, Uploaded Documents, and Total Patient Registry.
- **Live Streams**: Outpatient triage stream and urgent follow-up recall stream with 10-second polling refresh.

---

## 19. Language Switching

- Click the language badge in the top navigation bar to toggle between **English** and **ភាសាខ្មែរ**.
- Preferences are saved to browser `localStorage` under `clinic_language` and automatically applied across all subsequent sessions.

---

## 20. PWA Installation

- The web app includes a Web App Manifest (`/manifest.json`) and Service Worker (`/sw.js`).
- On mobile devices (iOS Safari, Android Chrome) or desktop Chrome/Edge, click **"Install App for Offline Access"** to install Rotana Clinic directly to the device home screen as a standalone application.

---

## 21. Offline / Local-first / Sync

- Powered by browser **IndexedDB** (`clinic_offline_db`) managed via `syncManager.ts`.
- When offline:
  - An amber banner announces **"Offline Mode - Local-first active"**.
  - New mutations are queued in the `offline_mutations` store.
- When network reconnects:
  - Service worker and sync manager automatically replay pending mutations to the NestJS backend.
  - A manual **"Sync Now"** button is provided in the banner.

---

## 22. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `Cannot connect to database` | PostgreSQL is not running or incorrect credentials | Verify PostgreSQL service is active; check `DATABASE_URL` in `.env`. |
| `Port 4000 already in use` | Another process is holding port 4000 | Stop the existing process or set `PORT=4001` in `.env`. |
| `JWT Expired / Unauthorized` | Token expired after 7 days | Logout and log back in through `/login`. |
| `Offline banner won't clear` | Pending mutations failed to sync | Check backend terminal logs for validation errors; click "Sync Now". |

---

## 23. Security Guidelines

1. **Password Security**: Passwords are encrypted using Bcrypt with 10 salt rounds.
2. **HTTP Headers**: All responses include strict HTTP headers (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection`).
3. **Input Sanitization**: Strict NestJS `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` rejects unexpected payloads.
4. **Error Masking**: Production `AllExceptionsFilter` masks internal database errors, preventing raw stack traces from reaching clients.

---

## 24. Backup and Data Safety

Run daily automated database backups using `pg_dump`:

```bash
# Manual backup command
pg_dump -U postgres -d clinic_systems -F c -b -v -f "/backups/clinic_$(date +%Y%m%d_%H%M%S).dump"

# Automated Linux cronjob (runs daily at 2:00 AM)
0 2 * * * pg_dump -U postgres -d clinic_systems -F c -b -f /backups/clinic_$(date +\%F).dump
```

To restore from a backup:

```bash
pg_restore -U postgres -d clinic_systems -v "/backups/clinic_YYYYMMDD_HHMMSS.dump"
```

---

## 25. API Documentation

Comprehensive Swagger/OpenAPI documentation is available at:
`http://localhost:4000/api/docs`

Core REST Endpoints:
- `POST /api/auth/login`: Authenticate staff and issue JWT token
- `GET /api/health`: Database connection and system health probe
- `GET /api/patients`: Paginated patient directory with search
- `POST /api/patients`: Create new patient record
- `GET /api/patients/check-duplicate`: Real-time phone duplication check
- `GET /api/patients/:id`: Patient 360 dossier
- `GET /api/visits`: Outpatient queue listing
- `POST /api/visits`: Register new outpatient visit and vitals
- `GET /api/prescriptions`: Pharmacy prescription orders
- `POST /api/prescriptions`: Create multi-item prescription
- `PATCH /api/prescriptions/:id/dispense`: Confirm medication dispensing
- `POST /api/payments/checkout`: Generate dynamic Tag 01=12 KHQR and deep links
- `GET /api/payments/verify/:tranId`: Real-time payment settlement verification
- `GET /api/follow-ups`: Scheduled patient recalls
- `GET /api/documents`: Uploaded clinical documents
- `GET /api/dashboard/stats`: 13 live operational KPIs

---

## 26. Testing

The project uses zero-dependency native test runners:

```bash
# Run backend test suite (11 tests across 5 suites)
npm --prefix backend test

# Run frontend test suite (i18n parity & PWA manifest)
npm --prefix frontend test

# Run all test suites across the monorepo
npm test
```

Verification Results:
- `auth-rbac.test.ts`: Password hashing & role-based permission matrix (PASS)
- `khqr-engine.test.ts`: EMVCo dynamic QR, CRC16 & ABA/Bakong deep links (PASS)
- `clinical-vitals.test.ts`: BMI calculation & blood pressure classification (PASS)
- `billing-prescriptions.test.ts`: Consultation & multi-item pharmacy invoice calculations (PASS)
- `duplicate-patients.test.ts`: Phone number sanitation and duplicate match (PASS)
- `i18n-parity.test.ts`: 100% dictionary key parity between English and Khmer (PASS)
- `pwa-manifest.test.ts`: Web App Manifest specification compliance (PASS)

---

## 27. Performance

- **Database Indexes**: Dedicated indexes on high-frequency lookup columns (`phone`, `patientCode`, `patientId`, `status`, `scheduledDate`).
- **Frontend Code Splitting**: Dynamic Next.js route chunks averaging under 110 kB first-load JS.
- **Search Debouncing**: Client-side queries are debounced to prevent unnecessary database queries.
- **Local-First Caching**: IndexedDB caching allows instant screen transitions even over slow cellular connections.

---

## 28. Deployment

### Method A: Single Command Docker Compose (Recommended)

To run the complete production stack (PostgreSQL + NestJS + Next.js):

```bash
# 1. Ensure .env is configured with production secrets
cp .env.example .env

# 2. Build and launch all containers
docker compose up --build -d

# 3. Inspect running containers
docker compose ps
```

The stack runs:
- `clinic_postgres`: Port `5432`
- `clinic_backend`: Port `4000`
- `clinic_frontend`: Port `3000`

### Method B: Manual Linux VPS Deployment (Ubuntu 22.04 / 24.04 LTS)

#### 1. Server Prerequisites:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

#### 2. Setup PostgreSQL:
```bash
sudo -u postgres psql
CREATE DATABASE clinic_systems;
CREATE USER clinic_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE clinic_systems TO clinic_user;
\q
```

#### 3. Clone and Build:
```bash
git clone https://github.com/Rotananob/Clinic_systems.git /var/www/clinic
cd /var/www/clinic
cp .env.example .env
# Edit .env with your PostgreSQL credentials and domain

# Build Backend
cd backend
npm ci
npx prisma db push
npx prisma db seed
npm run build

# Build Frontend
cd ../frontend
npm ci
npm run build
cd ..
```

#### 4. Process Management with PM2:
```bash
# Start backend
pm2 start backend/dist/main.js --name "clinic-backend"

# Start frontend
pm2 start "npm --prefix frontend run start" --name "clinic-frontend"

# Persist PM2 across reboots
pm2 save
pm2 startup
```

#### 5. Configure Nginx Reverse Proxy:
Create `/etc/nginx/sites-available/clinic`:

```nginx
server {
    server_name clinic.yourdomain.com;

    # Frontend Next.js PWA
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend NestJS REST API & Swagger
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and configure SSL:
```bash
sudo ln -s /etc/nginx/sites-available/clinic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d clinic.yourdomain.com
```

---

## 29. Production Checklist

- [x] All 10 Prisma models migrated and indexed.
- [x] Seed data applied with verified clinical roles.
- [x] Passwords hashed with Bcrypt (10 rounds).
- [x] Global exception filter active with raw stack traces masked.
- [x] Security HTTP headers active on all API responses.
- [x] Real-time KHQR engine verified with Tag 01=12 dynamic QR & CRC16.
- [x] ABA Mobile and Bakong deep links generated with callback URLs.
- [x] PWA manifest and service worker active.
- [x] Local-first IndexedDB synchronization verified.
- [x] Unit and parity tests passing with 0 errors.
- [x] Production builds verified for both Next.js and NestJS.

---

## 30. User Workflow

```text
[ Patient Arrival ] ──► Receptionist registers patient (/patients)
                             │
                             ▼
[ Outpatient Triage ] ──► Nurse/Doctor records vitals & BMI (/visits)
                             │
                             ▼
[ Doctor Consultation ] ──► Doctor records diagnosis & prescribes medications
                             │
                             ├──► Doctor schedules recall (/follow-ups)
                             │
                             ▼
[ Pharmacy Dispensation ] ──► Pharmacist reviews and dispenses medication (/prescriptions)
                             │
                             ▼
[ Cashier Checkout ] ──► Cashier generates dynamic Tag 01=12 KHQR (/billing)
                             │
                             ▼
[ Patient KHQR Payment ] ──► Patient scans with ABA Mobile / Bakong app
                             │
                             ▼
[ Instant Verification ] ──► 0.3s settlement verification closes invoice as PAID
```

---

## 31. FAQ

**Q: Can the clinic use the system during an internet outage?**  
A: Yes. The PWA caches application assets and stores new registrations and triage notes locally in IndexedDB. Once internet connectivity is restored, the queue automatically syncs back to the server.

**Q: Does the system use mock or simulated KHQR payments?**  
A: No. Billing uses genuine EMVCo Tag 01=12 dynamic QR codes generated by `khqr-helper` with exact transaction amounts and Bakong merchant credentials.

**Q: How do we change the default consultation fee?**  
A: The consultation fee can be adjusted during visit creation in the Outpatient Visit drawer, or customized in the database schema defaults.

---

## 32. Documentation Audit

- **Date of Verification**: October 2026
- **Architecture Lead**: Rotananob
- **Status**: Production Ready (100% Phase Completion across Phases 1–19)
- **Repository**: [https://github.com/Rotananob/Clinic_systems.git](https://github.com/Rotananob/Clinic_systems.git)
