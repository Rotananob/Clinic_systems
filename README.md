# Rotana Medical Center & Polyclinic
## Enterprise Clinical Patient Management & KHQR Billing System

A comprehensive, hospital-grade Clinical SaaS Platform engineered for outpatient polyclinics, maternity centers, and medical practices. Built with Next.js 14 App Router, NestJS, Prisma ORM, PostgreSQL, native ESC/POS hardware integration, and EMVCo Tag 01=12 dynamic KHQR settlement with ABA Mobile and Bakong deep links.

---

## 1. Executive Summary

Rotana Clinical Patient Management System is a unified, local-first medical operations system built to digitize end-to-end outpatient workflows while maintaining strict medical record confidentiality, real-time revenue settlement, and zero clinical data loss during connectivity drops.

### Core Architectural Pillars
- **Medical SaaS UX/UI**: Warm milk-coffee palette (`#F7F4EE`, `#FDFBF7`, `#E7E1D4`, `#231F1C`) optimized for medical eye comfort, responsive desktop sidebar, mobile bottom navigation dock, and zero distracting visual artifacts.
- **Enterprise Security**: Role-Based Access Control (RBAC), bcrypt 12-round cryptographic hashing, anti-brute-force login lockout defense, sanitized HTTP error filtering preventing database query leaks, and strict route guards.
- **Dynamic KHQR Engine**: Genuine EMVCo Tag 01=12 dynamic QR generation with locked settlement amounts, CRC16 checksum verification, dual-currency support (USD / KHR), and instantaneous ABA Mobile and Bakong deep link routing.
- **Direct Hardware Peripherals**: In-browser ESC/POS driver supporting WebSerial, WebUSB, and Network TCP printing for 80mm and 58mm thermal receipt printers, electronic cash drawer kick pulse, and barcode scanner integration (Keyboard Wedge & USB HID).
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
- **Payment & QR Engine**: EMVCo QR specification, `khqr-helper` (pay-helper), CRC16 calculation
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
│   │   ├── payments/                      # KHQR generator, deep links, verification
│   │   ├── prescriptions/                 # Pharmacy orders & dispensation audit
│   │   ├── users/                         # Clinic staff governance
│   │   ├── visits/                        # Outpatient triage, vitals, BMI engine
│   │   ├── app.module.ts                  # Root application module
│   │   └── main.ts                        # Application bootstrap & security headers
│   ├── test/                              # Automated unit & integration tests
│   ├── Dockerfile                         # Production multi-stage Docker build
│   └── package.json
├── frontend/                               # Next.js 14 App Router
│   ├── public/
│   │   ├── icons/                         # PWA icons (192x192, 512x512)
│   │   ├── manifest.json                  # Web App Manifest
│   │   └── sw.js                          # Service Worker for offline asset caching
│   ├── src/
│   │   ├── app/                           # App Router routes
│   │   │   ├── billing/                   # Cashier ledger, KHQR checkout, receipts
│   │   │   ├── certificates/              # Medical fitness & sick leave certificates
│   │   │   ├── documents/                 # Medical attachments repository
│   │   │   ├── follow-ups/                # Recall schedule & overdue tracker
│   │   │   ├── invoice-template/          # Custom invoice template designer
│   │   │   ├── login/                     # Staff authentication with lockout defense
│   │   │   ├── page.tsx                   # Operations command center (Dashboard)
│   │   │   ├── patients/                  # Patient directory & registration drawer
│   │   │   │   └── [id]/                  # Patient 360 comprehensive medical dossier
│   │   │   ├── prescriptions/             # Pharmacy dispensing management
│   │   │   ├── queue/                     # Outpatient live waiting line
│   │   │   ├── reports/                   # Financial & clinical analytics by date
│   │   │   ├── settings/                  # Clinic profile, KHQR, hardware, fees
│   │   │   ├── staff/                     # Staff accounts & role assignments
│   │   │   └── visits/                    # Outpatient triage & vital signs
│   │   ├── components/
│   │   │   ├── common/                    # Logo, LanguageSwitcher, CommandPalette, Modals
│   │   │   ├── hardware/                  # Hardware peripheral connection panel
│   │   │   ├── layout/                    # AppShell, Navbar, Sidebar, MobileNavDock
│   │   │   ├── patients/                  # Patient list & intake drawer
│   │   │   └── payments/                  # KHQR checkout, cash modal, receipt modal
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
│   └── package.json
├── docker-compose.yml                     # Unified container orchestration stack
├── .dockerignore
├── .env.example                           # Root environment variable template
├── .gitignore                             # Strict exclusion rules for secrets & logs
└── package.json                           # Monorepo management scripts
```

---

## 4. Key Clinical Modules

### 4.1 Patient Intake & Duplicate Detection
- Instant search across Patient Code (`PT-YYYYMMDD-XXXX`), English Name, Khmer Name, or Phone Number.
- Real-time duplicate telephone and national ID checking before registration submission to prevent duplicated medical records.
- Comprehensive intake attributes: full name (EN/KH), gender, date of birth, phone, national ID, address, blood group, known drug allergies, and emergency contact.

### 4.2 Patient 360 Comprehensive Medical Dossier
- Consolidated chronological timeline of all medical interactions at `/patients/[id]`.
- Direct access to Outpatient Visits, Diagnoses, Prescriptions, Dispensing Status, Invoices, Payment Confirmations, Uploaded Lab Documents, and Scheduled Follow-ups.

### 4.3 Outpatient Triage, Vital Signs & BMI Engine
- Clinical vitals recording: Blood Pressure (systolic/diastolic in mmHg), Heart Rate (bpm), Body Temperature (°C), Weight (kg), and Height (cm).
- Real-time automated Body Mass Index (BMI) computation with international medical classifications (Underweight, Normal, Overweight, Obese).
- Blood pressure evaluation according to standard clinical ranges (Normal, Elevated, Stage 1 Hypertension, Stage 2 Hypertension).

### 4.4 Multi-Item Prescription & Pharmacy Dispensation
- Attending doctors create detailed prescriptions linked to active visits.
- Individual line items specify Medication Name, Dosage, Frequency, Duration, Quantity, and Unit Price.
- Pharmacists review orders in real time and confirm dispensation with an immutable audit timestamp.

### 4.5 Billing, Dual-Currency & Dynamic KHQR Settlement
- Dual currency ledger supporting United States Dollar (USD) and Khmer Riel (KHR) with configurable exchange rates.
- Instant checkout modal generating genuine EMVCo Tag 01=12 dynamic QR codes with exact payable amount lock.
- Direct deep link generation for ABA Mobile (`abamobile://`) and Bakong app.
- Non-blocking payment verification polling with manual cancellation option.

### 4.6 Custom Invoice Template Designer (`/invoice-template`)
- Live WYSIWYG editor for clinic receipts and invoices.
- Customizable parameters: Accent Color, Clinic Logo (Data URL/Base64), Header Style, Ministry of Health License, Slogan, Itemized Service Breakdown, KHR Equivalent Amount, Footer Notes, and Paper Format.
- Responsive live preview supporting 80mm Thermal, A4 Standard, and A5 formats.

### 4.7 Hardware Peripheral Integration
- Accessible under **Settings > Hardware & Devices**.
- **Thermal Receipt Printers**: ESC/POS driver supporting:
  1. Web Serial API (`navigator.serial`) for USB-to-Serial and direct USB POS printers.
  2. WebUSB API (`navigator.usb`) for direct USB ESC/POS devices.
  3. Network TCP proxy via backend (`/api/hardware/print`) for LAN/Ethernet receipt printers.
- **Electronic Cash Drawer**: Triggered via standard ESC/POS pulse (`ESC p 0 25 250`) on bill settlement or manual test button.
- **Barcode / QR Scanners**: Automatic rapid input detection via Keyboard Wedge mode or Web HID API (`navigator.hid`).
- **Auto-Print on Settlement**: Optional setting to immediately trigger thermal printing upon payment confirmation.

### 4.8 Reports & Clinical Analytics (`/reports`)
- Financial and operational reporting with custom date range filters (Today, This Week, This Month, or Custom Exact Dates).
- Summarizes Total Revenue (USD & KHR), Consultation Volume, Prescription Totals, and Cashier Settlement Methods.

### 4.9 Offline-First Local Operations (PWA)
- Progressive Web App capability installable on iOS Safari, Android Chrome, and Desktop browsers.
- Service worker caching for offline shell availability.
- IndexedDB mutation buffer (`clinic_offline_db`) automatically queues registrations and vitals recorded during network outages and replays them when connectivity returns.

---

## 5. Security & Production Hardening

### 5.1 Strict Route Authentication & Direct Redirect
- Protected route guard in `AppShell.tsx`: unauthenticated users visiting internal pages are immediately redirected to `/login`.
- When accessing `/login`, navigation bars, sidebars, and docks are hidden to prevent UI leakage.
- Real-time token validation against `/api/auth/me` purges corrupted or forged sessions from client storage immediately.

### 5.2 Anti-Brute-Force Lockout Defense
- In `frontend/src/app/login/page.tsx`, if 5 consecutive failed login attempts occur, the login interface automatically locks for 60 seconds with an active countdown.
- Password visibility toggle (Eye/EyeOff) to prevent typing errors.
- Demo one-click login buttons have been completely removed for production safety.

### 5.3 Exception Sanitization & Information Masking
- The backend `AllExceptionsFilter` catches all unhandled exceptions.
- Database query parameters, Prisma error codes (e.g., `P2002`, `P2025`), and internal stack traces are logged securely on the server but never transmitted over HTTP to clients.
- Status codes are mapped to sanitized, user-friendly messages.

### 5.4 Human-Friendly Error Translation
- Frontend centralized translator (`errorHandler.ts`) maps technical network disconnects, 401 unauthorized, 403 forbidden, and 409 duplicate errors to clean, respectful Khmer and English.

### 5.5 Repository & Secrets Exclusion Policy
- Strict `.gitignore` rules prevent accidental commits of `.env`, `.env.*`, cryptographic keys (`*.pem`, `*.key`), database files (`*.db`, `*.sql`, `*.dump`), and log files (`*.log`).
- Docker Compose files use environment variable interpolation with validation guards (`${VARIABLE:?Error: Required}`).

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
Create local environment files from templates:

```bash
# Root environment
cp .env.example .env

# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Open `.env` and `backend/.env` to configure your PostgreSQL credentials, JWT secret, and Bakong merchant credentials.

### 3. Install Monorepo Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### 4. Initialize Database & Seed
Ensure PostgreSQL is active on port `5432` with a database named `clinic_systems`:

```bash
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```

> Note: Initial user passwords are configured via `SEED_*_PASSWORD` in your private `.env` file or default to secure development credentials.

### 5. Start Development Servers
Open two terminal windows:

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

1. Ensure `.env` is configured with production passwords and a strong 64-character `JWT_SECRET`.
2. Build and launch all containerized services:

```bash
docker compose up --build -d
```

3. Verify running containers:
```bash
docker compose ps
```

Services launched:
- `clinic_postgres`: PostgreSQL 16 on port `5432`
- `clinic_backend`: NestJS API on port `4000`
- `clinic_frontend`: Next.js Web App on port `3000`

### Deployment Option B: Linux VPS (Ubuntu 22.04 / 24.04 LTS)

#### 1. Server Packages Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

#### 2. PostgreSQL Configuration
```bash
sudo -u postgres psql
CREATE DATABASE clinic_systems;
CREATE USER clinic_user WITH ENCRYPTED PASSWORD '<YOUR_STRONG_PASSWORD>';
GRANT ALL PRIVILEGES ON DATABASE clinic_systems TO clinic_user;
\q
```

#### 3. Clone and Build Codebase
```bash
git clone https://github.com/Rotananob/Clinic_systems.git /var/www/clinic
cd /var/www/clinic
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update environment files with production database credentials and strong secrets

# Build backend
cd backend
npm ci
npx prisma db push
npm run prisma:seed
npm run build

# Build frontend
cd ../frontend
npm ci
npm run build
cd ..
```

#### 4. Process Management with PM2
```bash
# Start backend API
pm2 start backend/dist/src/main.js --name "clinic-backend"

# Start frontend application
pm2 start "npm --prefix frontend run start" --name "clinic-frontend"

# Persist processes across server reboots
pm2 save
pm2 startup
```

#### 5. Configure Nginx Reverse Proxy & SSL
Create `/etc/nginx/sites-available/clinic`:

```nginx
server {
    server_name clinic.yourdomain.com;

    # Frontend Next.js Web Application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend NestJS REST API
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

Enable site and configure SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/clinic /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d clinic.yourdomain.com
```

---

## 8. Hardware Peripherals Configuration

| Peripheral | Connection Protocol | Browser API / Endpoint | Configuration Details |
| :--- | :--- | :--- | :--- |
| **80mm Thermal Printer** | USB / Serial | Web Serial (`navigator.serial`) | Baud rate 9600, 48 characters/line, auto cut paper command |
| **Direct USB Printer** | WebUSB | WebUSB (`navigator.usb`) | Direct raw byte stream transfer out |
| **LAN / Network Printer** | Network TCP | Backend `/api/hardware/print` | Connects to printer IP:Port (default 9100) via raw socket |
| **Electronic Cash Drawer** | RJ11 / RJ12 via Printer | ESC/POS Drawer Kick Pulse | Pin 2 pulse (`ESC p 0 25 250`) on checkout settlement |
| **Barcode / QR Scanner** | USB / Bluetooth | Keyboard Wedge or Web HID | Auto-detects input sequences under 50ms interval ending in Enter |

---

## 9. Automated Testing & Verification

The repository includes comprehensive native test suites with zero external testing dependencies:

```bash
# Run backend test suite (11 tests across 5 clinical suites)
npm --prefix backend test

# Run frontend test suite (i18n dictionary parity and PWA manifest)
npm --prefix frontend test

# Run monorepo test validation
npm test
```

### Verified Test Suites
- `auth-rbac.test.ts`: Password hashing verification and role permission matrix enforcement.
- `khqr-engine.test.ts`: EMVCo dynamic QR Tag 01=12 payload formatting, CRC16 generation, and deep links.
- `clinical-vitals.test.ts`: Accurate Body Mass Index (BMI) and blood pressure categorization.
- `billing-prescriptions.test.ts`: Exact subtotal calculations for consultation fees and pharmacy line items.
- `duplicate-patients.test.ts`: Phone number sanitation and duplicate patient prevention.
- `i18n-parity.test.ts`: 100% dictionary key parity between English and Khmer.
- `pwa-manifest.test.ts`: Web App Manifest specification compliance.

---

## 10. Database Backup & Disaster Recovery

Run daily automated database backups using `pg_dump`:

```bash
# Manual immediate backup
pg_dump -U postgres -d clinic_systems -F c -b -v -f "/backups/clinic_$(date +%Y%m%d_%H%M%S).dump"

# Linux cron job for automated daily backup at 2:00 AM
0 2 * * * pg_dump -U postgres -d clinic_systems -F c -b -f /backups/clinic_$(date +\%F).dump
```

To restore from a backup:
```bash
pg_restore -U postgres -d clinic_systems -v "/backups/clinic_YYYYMMDD_HHMMSS.dump"
```

---

## 11. Role-Based Access Reference

| Clinical Role | Core Responsibilities & System Permissions |
| :--- | :--- |
| **ADMIN** | Full administrative governance, staff user accounts, clinic settings, fee schedule, and audit logs. |
| **DOCTOR** | Patient medical records, consultation notes, vital signs triage, clinical diagnosis, and prescriptions. |
| **RECEPTIONIST** | Patient registration, duplicate identity prevention, visit queue intake, and appointment scheduling. |
| **CASHIER** | Consultation and pharmacy invoicing, dual-currency billing, dynamic KHQR settlement, and cash receipts. |
| **PHARMACIST** | Prescription review, medication inventory verification, and drug dispensation confirmation. |

---

## 12. License & Compliance

Rotana Clinical Patient Management System is designed for professional outpatient clinics and polyclinics in the Kingdom of Cambodia, adhering to Ministry of Health (MoH) documentation standards and EMVCo/NBC Bakong payment integration standards.

- **Lead Architect**: Rotananob
- **Release Version**: 2.0.0 Enterprise Production Ready
- **Repository**: [https://github.com/Rotananob/Clinic_systems.git](https://github.com/Rotananob/Clinic_systems.git)
