# Krupet.com Platform Architecture & Evolution Roadmap
## Enterprise Multi-Tenant Clinical PaaS & Hospital Information System

---

## 1. Architectural Philosophy

Krupet.com Platform is engineered as a zero-trust, multi-tenant healthcare operating system tailored for the Cambodian clinical ecosystem. The system unifies outpatient clinical care, pharmacy supply chains, medical imaging, government health compliance, and digital banking into a resilient, local-first web architecture.

### Key Architectural Tenets
1. **Multi-Tenant Isolation**: Native database scoping via `AsyncLocalStorage` and Prisma query middleware guarantees strict logical tenant separation without the operational cost of individual database instances.
2. **Clinical Data Integrity**: Cryptographic Ed25519 digital signatures on clinical records, audit-logged role permissions, and tamper-evident public QR verification.
3. **FinTech Convergence**: Real-time integration with the National Bank of Cambodia Bakong network and ABA Bank PayWay headless gateway, supporting instant dynamic KHQR settlement with zero reconciliation friction.
4. **Clinical Decision Safety**: Rule-based and AI-assisted safety nets running concurrently to catch drug interactions, allergies, and patient deterioration.

---

## 2. Platform Architecture Layers

```text
+-----------------------------------------------------------------------------------+
|                                 CLIENT APPLICATIONS                               |
|   Desktop Browser   |   Tablet Ward POS   |   Mobile PWA   |   Telegram Mini App  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             EDGE & REVERSE PROXY LAYER                            |
|       Nginx / Cloudflare SSL Termination  |  Wildcard Subdomain Tenant Router     |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             BACKEND API LAYER (NestJS 10)                         |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Tenant Middleware  |  | RBAC Guard (JWT)   |  | Exception Sanitizer Filter  |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Gemini 3.8 Flash AI|  | Bakong KHQR Engine |  | ESC/POS Printer Driver      |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
|  | Ed25519 Signatures |  | CDSS Safety Engine |  | Automated Billing Engine    |  |
|  +--------------------+  +--------------------+  +-----------------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                             DATA PERSISTENCE & STORAGE                            |
|       PostgreSQL 16 (Prisma ORM 5+)  |  Cloudinary Encrypted Medical Media CDN    |
+-----------------------------------------------------------------------------------+
```

---

## 3. Comprehensive Evolution Milestones

### Foundation Iterations (Phases 1 - 9)
- **Phase 1: POS Hardware & Thermal Printing Engine**: Silent printing engine interfacing with WebSerial, WebUSB, and raw TCP sockets for 80mm and 58mm thermal printers. Automated cash drawer pulse.
- **Phase 2: Offline-First Edge Resiliency**: PWA service worker with encrypted IndexedDB storage and bidirectional queue synchronization.
- **Phase 3: Telegram Voice Medical Notes & SOAP Structuring**: Automated transcription and parsing of Khmer and English medical consultations into standard Subjective, Objective, Assessment, Plan (SOAP) notes using Google Gemini 3.8 Flash with 2 req/min rate limiting.
- **Phase 4: Clinical Decision Support System (CDSS)**: Real-time Drug-Drug Interaction (DDI) detection, Penicillin/Sulfa allergy cross-reactivity guards, and National Early Warning Score 2 (NEWS2) triage risk categorization.
- **Phase 5: Patient Telegram Mini-App & Live Queue**: Telegram WebApp integration allowing patients to track live queue numbers and consult schedules.
- **Phase 6: Multi-Branch Chain & Central Warehouse**: Multi-branch inventory tracking, automated First-Expired, First-Out (FEFO) dispensation rules, and stock transfer requests.
- **Phase 7: MoH Compliance & Ed25519 Digital Signatures**: Publicly verifiable cryptographic signatures on medical certificates and automated DHIS2 disease surveillance XML and JSON exports.
- **Phase 8: DICOM PACS Medical Imaging**: Zero-footprint WebGL medical image viewer supporting X-Ray, CT, and Ultrasound studies with window leveling and measurements.
- **Phase 9: NSSF & Commercial Insurance Direct Settlement**: Automated National Social Security Fund (NSSF) co-pay calculations, insurance pre-approvals, and deductible settlements.

### Advanced Specialization Iterations (Phases 10 - 17)
- **Phase 10: Clinical Care Concierge & Adherence**: Post-discharge patient recall schedules, SMS/Telegram medication alerts, and red-flag symptom escalations.
- **Phase 11: Smart TV Waiting Room Signage**: Full-screen TV display (`/signage`) with Khmer voice synthesis calling patient ticket numbers to doctor consultation rooms.
- **Phase 12: Laboratory Information System (LIS)**: Bi-directional medical analyzer interfacing using ASTM E1381/E1394 and HL7 v2.x messaging standards.
- **Phase 13: Inpatient Admission (IPD) & Nurse eMAR**: Inpatient ward and bed census tracking, electronic Medication Administration Record (eMAR) with dual-nurse verification.
- **Phase 14: Doctor Commission & Real-Time Clinic PnL**: Granular financial ledger allocating consultation and procedure splits to attending physicians and rendering real-time clinic Profit and Loss statements.
- **Phase 15: Dental Odontogram Interactive Charting**: Interactive 32-tooth 2D and 3D dental charting module for tooth numbering, restorations, extractions, and periodontal treatment tracking.
- **Phase 16: Teleconsultation WebRTC Video & Digital e-Prescription**: Browser-to-browser encrypted WebRTC video consultation signaling with live in-call prescription drafting and QR anti-tamper signing.
- **Phase 17: Electronic Claim XML/JSON for Insurance & MoH Surveillance**: Generation of ANSI ASC X12 / 837P compatible claim files and FHIR R4 standard payloads for private insurer adjudication and Ministry of Health communicable disease tracking.

### Platform as a Service (PaaS) Evolution
- **Tenant Context Engine**: Thread-safe multi-tenant isolation utilizing Node.js `AsyncLocalStorage` and Prisma Client extensions.
- **Dynamic Subdomain Resolution**: Wildcard routing supporting independent clinic tenant hostnames.
- **15-Second Instant Onboarding**: Fast registration requiring only Gmail, validated via real Gmail SMTP with zero preview code leakage.
- **SaaS Subscription Engine**: Gated feature tiers (Free Starter, Clinic Starter $5, Polyclinic Pro $8, Hospital Enterprise $12) with 20% annual discount options, 100% anti-bypass security, and automated background billing cycle monitoring.
- **Real Headless PayWay Bridge & Static KHQR Demo**: Integration with ABA PayWay headless gateway featuring locked demonstration amounts ($0.01 - $0.05) and custom merchant branding.
- **Super Admin Governance Cockpit**: Centralized portal (`/super-admin`) providing system owners with platform-wide tenant telemetry, subscription management, and system-wide audits.

---

## 4. Test Suite Metrics

| Component | Test Suites | Total Tests | Pass Rate | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Backend NestJS REST API** | 40 | 247 | 100% | Verified |
| **Frontend Next.js App Router** | 29 | 139 | 100% | Verified |
| **Next.js Production Build** | N/A | 38 Pages | 100% | Generated |
| **Total Automated Tests** | **69** | **386** | **100%** | **Production Ready** |
