MASTER DEVELOPMENT PREPARATION PROMPT
Clinic Patient Management System

You are the primary AI software development agent responsible for building a complete Clinic Patient Management System.

IMPORTANT:
The README specification provided below is a FUTURE DOCUMENTATION SPECIFICATION and DEVELOPMENT REFERENCE.

DO NOT create the final README.md yet.

DO NOT start deployment yet.

DO NOT start production maintenance/operations work yet.

DO NOT invent features just because they are mentioned in the future README specification.

Your current responsibility is to understand the complete requirements, inspect the actual codebase, plan the architecture, and develop the real system step by step.

The final README will only be created AFTER the system has been fully implemented and verified.

==================================================
1. PRIMARY OBJECTIVE
==================================================

Build a complete, professional Clinic Patient Management System.

The system should cover, where actually required and implemented:

- Frontend
- Backend
- PostgreSQL database
- Prisma ORM
- Authentication
- Role-Based Access Control (RBAC)
- Patient management
- Patient search
- Patient profile
- Patient 360
- Visit management
- Medical records
- Prescriptions
- Follow-ups
- Documents if required
- Dashboard
- Khmer + English
- PWA
- Local-first / offline / synchronization architecture if required
- REST API
- Swagger/OpenAPI if required
- Audit logs if required
- Testing
- Production-ready architecture

IMPORTANT:

Do not implement fake functionality.

Do not claim that a feature exists until it actually works.

The codebase must always be the source of truth.

==================================================
2. TARGET TECHNOLOGY STACK
==================================================

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- PWA
- Khmer + English

Backend:

- NestJS
- TypeScript
- REST API

Database:

- PostgreSQL
- Prisma ORM

Possible architecture:

Browser / PWA
    ↓
Next.js / React
    ↓
REST API
    ↓
NestJS
    ↓
Prisma
    ↓
PostgreSQL

If local-first/synchronization is actually required:

User
    ↓
Next.js / React
    ↓
Local persistence
    ↓
Synchronization engine
    ↓
REST API
    ↓
NestJS
    ↓
Prisma
    ↓
PostgreSQL

Do not implement local-first architecture unless it is actually required.

==================================================
3. DEVELOPMENT PRINCIPLE
==================================================

Always follow:

IMPLEMENT
    ↓
TEST
    ↓
VERIFY
    ↓
DOCUMENT

Never:

DOCUMENT
    ↓
ASSUME FEATURE EXISTS
    ↓
BUILD FAKE FEATURE

Every future README statement must be backed by actual implementation.

==================================================
4. FIRST TASK — INSPECT THE PROJECT
==================================================

Before writing or changing major code:

1. Inspect the entire repository.
2. Inspect package.json files.
3. Inspect frontend structure.
4. Inspect backend structure.
5. Inspect Prisma schema.
6. Inspect existing migrations.
7. Inspect authentication.
8. Inspect existing roles.
9. Inspect existing API modules.
10. Inspect existing UI components.
11. Inspect environment files/examples.
12. Inspect tests.
13. Inspect PWA configuration.
14. Inspect existing synchronization/offline implementation.
15. Identify what is already implemented.
16. Identify what is missing.
17. Identify contradictions.
18. Identify technical risks.

Do not rebuild working functionality unnecessarily.

Follow the existing architecture when it is good.

Only refactor when there is a clear technical reason.

==================================================
5. DEVELOPMENT PHASES
==================================================

Follow controlled development phases.

PHASE 1
Repository and Architecture Analysis

PHASE 2
Database and Prisma

PHASE 3
NestJS Backend and REST API

PHASE 4
Authentication and RBAC

PHASE 5
Next.js Frontend Foundation

PHASE 6
Patient Management

PHASE 7
Patient 360

PHASE 8
Visits and Medical Records

PHASE 9
Prescriptions

PHASE 10
Follow-ups

PHASE 11
Documents if required

PHASE 12
Dashboard

PHASE 13
Khmer + English

PHASE 14
PWA

PHASE 15
Offline / Local-first / Synchronization if required

PHASE 16
Testing and QA

PHASE 17
Security and Performance Review

PHASE 18
Production Preparation

PHASE 19
Final Documentation

Do not jump directly to deployment.

==================================================
6. AUTHENTICATION
==================================================

Implement secure authentication.

Potential functionality:

- Login
- Logout
- Session/token management
- Protected frontend routes
- Protected backend endpoints
- Authorization
- RBAC

Do not expose:

- Passwords
- JWT secrets
- Database credentials
- API keys
- Private tokens

Use environment variables for secrets.

==================================================
7. RBAC
==================================================

The application may require roles such as:

- Admin
- Doctor
- Receptionist

However:

DO NOT assume these roles exist automatically.

Inspect the actual requirements and implementation.

Each role must have clearly defined permissions.

Potential example:

Admin:
- Users
- Roles
- Patients
- Reports
- Settings
- Audit logs

Doctor:
- Patients
- Visits
- Medical records
- Prescriptions
- Follow-ups

Receptionist:
- Patient registration
- Patient search
- Basic patient management

These are examples only.

Only implement permissions that are actually required.

==================================================
8. PATIENT MANAGEMENT
==================================================

Implement patient management based on the actual requirements.

Potential patient information:

- Patient ID
- Name
- Gender
- Date of birth
- Phone
- Address
- Contact information
- Medical-related information
- Created date
- Updated date

Do not invent unnecessary medical fields.

Main workflow:

Login
↓
Dashboard
↓
Patients
↓
Search existing patient
↓
Register new patient if necessary
↓
Patient Profile
↓
Patient 360

==================================================
9. DUPLICATE PATIENT PREVENTION
==================================================

Before creating a new patient, staff should be able to search for an existing patient.

Potential search:

- Patient ID
- Name
- Phone number

If duplicate detection is implemented:

- Show possible duplicate patients.
- Prevent accidental duplicate creation where appropriate.
- Never automatically merge patient records unless explicitly designed.

==================================================
10. PATIENT 360
==================================================

Patient 360 should provide a centralized view of the patient's information.

Potential sections:

- Overview
- Patient information
- Medical history
- Visits
- Prescriptions
- Follow-ups
- Documents

Only implement sections that actually exist.

The interface should make patient history easy to understand.

==================================================
11. VISITS
==================================================

Patients can have multiple visits.

Example:

Patient
 ├── Visit 1
 ├── Visit 2
 ├── Visit 3
 └── Visit N

A new visit MUST NOT overwrite an old visit.

Potential visit information:

- Reason
- Symptoms
- Vitals
- Diagnosis
- Treatment
- Notes

Only implement fields required by the actual system.

==================================================
12. MEDICAL RECORDS
==================================================

Medical history must be preserved.

Important rule:

Creating a new visit must create a new historical record.

It must NOT overwrite previous visits.

Potential relationship:

Patient
 ├── Visits
 │    ├── Medical Record
 │    ├── Prescriptions
 │    └── Follow-ups
 └── Documents

Use appropriate relational database design.

==================================================
13. PRESCRIPTIONS
==================================================

Prescriptions may contain multiple medicine items.

Potential structure:

Prescription
 ├── Medicine
 ├── Dosage
 ├── Frequency
 ├── Duration
 ├── Quantity
 └── Instructions

Example:

Prescription
 ├── Medicine A
 ├── Medicine B
 └── Medicine C

Do not create unrelated prescription records for every medicine if the actual requirement expects one prescription containing multiple items.

==================================================
14. FOLLOW-UPS
==================================================

Support follow-up management if required.

Potential fields:

- Follow-up date
- Reason
- Status
- Notes

Only use statuses that are actually defined by the project requirements.

==================================================
15. DOCUMENT MANAGEMENT
==================================================

Only implement document management if required.

If implemented, determine:

- Supported file types
- Maximum file size
- Upload behavior
- Storage mechanism
- Permissions
- View behavior
- Download behavior
- Delete behavior
- Security

Never claim document management exists if it does not.

==================================================
16. DASHBOARD
==================================================

The dashboard may contain:

- Today's visits
- Recent patients
- Pending follow-ups
- Statistics
- Recent activity

Only display actual data.

Never create fake statistics.

==================================================
17. PATIENT SEARCH
==================================================

Patient search should be practical for clinic staff.

Potential capabilities:

- Search by Patient ID
- Search by name
- Search by phone
- Filters
- Pagination

For large datasets, consider:

- Database indexes
- Server-side pagination
- Debounced search
- Efficient database queries

Only implement optimizations that are actually needed.

==================================================
18. INTERNATIONALIZATION
==================================================

The application must support:

Khmer
and
English

The UI should:

- Support translated text
- Avoid unnecessary hardcoded strings
- Allow language switching
- Preserve language preference if required

Do not claim language persistence unless it is implemented.

==================================================
19. PWA
==================================================

Implement PWA functionality if required.

Potential components:

- Web App Manifest
- Service Worker
- Installability
- Icons
- Cache strategy
- Offline behavior

Important:

A PWA is still a web application.

Do not claim native Android/iOS application functionality.

==================================================
20. OFFLINE / LOCAL-FIRST / SYNCHRONIZATION
==================================================

This is a critical requirement ONLY if implemented.

If local-first architecture is required, clearly separate:

LOCAL SAVE

The data is stored on the device but may not yet exist on the server.

SYNCING

The application is currently synchronizing local changes with the server.

SYNCED

The local change has successfully synchronized with the server.

SYNC FAILED

The synchronization attempt failed and may need retry.

OFFLINE

The application cannot currently communicate with the backend.

Expected conceptual flow:

Offline
↓
User changes data
↓
Data saved locally
↓
Network returns
↓
Sync begins
↓
Server receives data
↓
Sync succeeds
↓
Status becomes Synced

If synchronization exists, handle:

- Retry
- Duplicate operations
- Network interruptions
- Partial failures
- Conflict handling
- Idempotency
- Reconciliation

Never tell users that locally stored data is automatically backed up to the cloud unless that is actually true.

==================================================
21. DATABASE
==================================================

Use:

PostgreSQL
+
Prisma

Potential entities:

- User
- Role
- Permission
- Patient
- Visit
- MedicalRecord
- Prescription
- PrescriptionItem
- FollowUp
- Document
- AuditLog

These are examples.

Only create models required by the actual business requirements.

Database design must include where appropriate:

- Primary keys
- Foreign keys
- Unique constraints
- Indexes
- Relations
- Created timestamps
- Updated timestamps
- Appropriate delete behavior

==================================================
22. PRISMA
==================================================

Use Prisma consistently.

Development examples:

npx prisma generate

npx prisma migrate dev

Only use commands that actually exist in the project.

Production database migrations must be handled safely.

Do not use destructive database commands without explicit warning.

Never run database reset commands against production.

==================================================
23. REST API
==================================================

NestJS should expose REST APIs.

Potential modules:

/auth
/users
/patients
/visits
/medical-records
/prescriptions
/follow-ups
/documents
/audit-logs

These are examples only.

The actual modules must match the implemented NestJS controllers.

Never invent API endpoints.

==================================================
24. SWAGGER / OPENAPI
==================================================

If Swagger/OpenAPI is implemented:

Document:

- API base URL
- Swagger URL
- Authentication method
- API modules
- Actual endpoints

Inspect the actual NestJS controllers before documenting endpoints.

Never manually invent endpoint paths.

==================================================
25. FRONTEND STRUCTURE
==================================================

Potential frontend folders:

app/
components/
lib/
hooks/
services/
messages/
public/

Only use/document folders that actually exist.

Keep:

- UI components
- Business logic
- API communication
- Hooks
- Utilities
- Translation files

reasonably separated.

Follow the existing project conventions.

==================================================
26. BACKEND STRUCTURE
==================================================

Potential backend:

src/
 ├── auth/
 ├── patients/
 ├── visits/
 ├── medical-records/
 ├── prescriptions/
 ├── follow-ups/
 ├── documents/
 └── audit-logs/

Only create modules required by the project.

==================================================
27. UI / UX
==================================================

The UI must be:

- Professional
- Clean
- Clinic-oriented
- Easy for non-technical staff
- Responsive
- Accessible
- Consistent

Avoid:

- Excessive animations
- Unnecessary gradients
- Generic AI-looking design
- Confusing navigation
- Excessive dashboard decoration

Prioritize usability.

==================================================
28. RESPONSIVE DESIGN
==================================================

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Test:

- Navigation
- Forms
- Tables
- Patient profile
- Patient 360
- Visit forms
- Prescription forms
- Dashboard

==================================================
29. SECURITY
==================================================

Treat this as a sensitive healthcare-related application.

Implement appropriate security.

Consider:

- Password hashing
- Authentication
- Authorization
- RBAC
- Input validation
- API validation
- Secure environment variables
- HTTPS in production
- Unauthorized access prevention
- Audit logging if required
- Secure document handling if implemented

Never expose sensitive patient information unnecessarily.

==================================================
30. VALIDATION
==================================================

Frontend validation improves UX.

Backend validation is mandatory.

Validate:

- Required fields
- Data types
- Formats
- Relationships
- Authorization
- Business rules

Never rely only on frontend validation.

==================================================
31. ERROR HANDLING
==================================================

Frontend should provide:

- Loading states
- Empty states
- User-friendly errors
- Network errors
- Retry actions

Backend should provide:

- Appropriate HTTP status codes
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Consistent error responses

Never expose raw stack traces to normal users.

==================================================
32. TESTING
==================================================

Prepare for:

- Unit tests
- Backend tests
- Integration tests
- End-to-end tests
- Playwright if used
- Lint
- Type checking
- Production build

Use the actual testing tools already selected by the project.

Do not add unnecessary testing frameworks.

==================================================
33. PERFORMANCE
==================================================

Consider:

- Pagination
- Debounced search
- Database indexes
- Lazy loading
- Code splitting
- Caching
- Optimistic UI
- Local-first operations
- Background synchronization

IMPORTANT:

Only claim performance techniques that are actually implemented.

==================================================
34. ENVIRONMENT VARIABLES
==================================================

All secrets/configuration must use environment variables.

Potential examples:

DATABASE_URL="your-database-url"

JWT_SECRET="your-secret"

API_URL="your-api-url"

NEXT_PUBLIC_API_URL="your-public-api-url"

These are examples only.

Inspect the actual codebase to determine the real variables.

Never commit:

- Production passwords
- Database credentials
- JWT secrets
- API keys
- Private tokens

==================================================
35. GIT DEVELOPMENT WORKFLOW
==================================================

Use safe Git practices.

Preferred workflow:

main
 ↓
feature branch
 ↓
development
 ↓
testing
 ↓
pull request
 ↓
review
 ↓
merge

Avoid directly changing main unless explicitly required.

Do not commit:

.env
node_modules/
dist/
.next/
secrets

unless the project specifically requires otherwise.

==================================================
36. DEPLOYMENT — FUTURE PHASE
==================================================

IMPORTANT:

Deployment is NOT the current task.

Do not deploy the application now unless explicitly instructed.

Do not assume the deployment provider.

Do not assume:

- Vercel
- Railway
- Render
- AWS
- DigitalOcean
- VPS
- Docker hosting

unless the deployment target is explicitly selected.

Later, the final README should document:

- Frontend deployment
- Backend deployment
- PostgreSQL deployment
- Environment variables
- Domain configuration
- HTTPS
- Database migration
- PWA requirements
- Production verification

==================================================
37. MAINTENANCE — FUTURE PHASE
==================================================

Maintenance is NOT the current task.

Do not build a full production maintenance/operations system now unless explicitly requested.

Future documentation may cover:

- Database backups
- Restore procedures
- Monitoring
- Logging
- Dependency updates
- Security updates
- Database migrations
- Incident handling

Do not claim these exist before they are actually configured.

==================================================
38. FUTURE README REQUIREMENTS
==================================================

After the implementation is complete, the final README.md should contain:

1. Project Overview
2. System Requirements
3. Project Structure
4. Installation
5. Environment Variables
6. Database Setup
7. Running the Application
8. Authentication and Roles
9. Clinic Staff User Guide
10. Patient Registration
11. Patient Search
12. Patient 360
13. Visit Creation
14. Visit History
15. Prescriptions
16. Follow-ups
17. Documents
18. Dashboard
19. Language Switching
20. PWA Installation
21. Offline / Local-first / Sync
22. Troubleshooting
23. Security Guidelines
24. Backup and Data Safety
25. API Documentation
26. Testing
27. Performance
28. Deployment
29. Production Checklist
30. User Workflow
31. FAQ
32. Documentation Audit

IMPORTANT:

Do not create this README now.

Create it only after the implementation is complete and verified.

==================================================
39. FUTURE README ACCURACY RULE
==================================================

The codebase is the source of truth.

If README says a feature exists:

The feature MUST actually exist.

If a command does not work:

DO NOT put it in README.

If an environment variable does not exist:

DO NOT invent it.

If a role does not exist:

DO NOT document it.

If an endpoint does not exist:

DO NOT invent it.

If offline synchronization is not implemented:

DO NOT claim offline synchronization exists.

If automatic backups are not implemented:

DO NOT claim automatic backups exist.

==================================================
40. DEVELOPMENT ACCEPTANCE CRITERIA
==================================================

Core:

[ ] Frontend works
[ ] Backend works
[ ] PostgreSQL works
[ ] Prisma works
[ ] Authentication works
[ ] RBAC works

Patient:

[ ] Patient registration works
[ ] Patient search works
[ ] Patient profile works
[ ] Patient 360 works
[ ] Duplicate prevention works if required

Medical:

[ ] Visits work
[ ] Medical records work
[ ] Prescriptions work
[ ] Follow-ups work
[ ] Documents work if required

UI:

[ ] Dashboard works
[ ] Khmer works
[ ] English works
[ ] Responsive UI works
[ ] PWA works if required

Data:

[ ] Historical visits are preserved
[ ] Database relationships are correct
[ ] Validation works
[ ] Authorization works

Offline / Sync if required:

[ ] Local persistence works
[ ] Offline behavior works
[ ] Sync works
[ ] Retry works
[ ] Sync status works
[ ] Sync failure handling works

Quality:

[ ] Lint passes
[ ] Type checking passes
[ ] Tests pass
[ ] Production build passes
[ ] No critical console errors
[ ] No exposed secrets

==================================================
41. FINAL DEVELOPMENT RULE
==================================================

Do not attempt to implement the entire system blindly in one step.

Work phase by phase.

After each major phase:

1. Inspect the implementation.
2. Run relevant tests.
3. Fix errors.
4. Verify database/API/frontend integration.
5. Continue only when the phase is stable.

==================================================
42. CURRENT AGENT TASK
==================================================

For now, DO NOT create README.md.

Your immediate task is:

STEP 1:
Inspect the complete existing repository.

STEP 2:
Understand the current architecture.

STEP 3:
Identify what is already implemented.

STEP 4:
Identify what is missing.

STEP 5:
Create a detailed development plan.

STEP 6:
Identify:

- Frontend requirements
- Backend requirements
- Database requirements
- Authentication requirements
- RBAC requirements
- Patient requirements
- Visit requirements
- Medical record requirements
- Prescription requirements
- Follow-up requirements
- Document requirements
- Dashboard requirements
- Translation requirements
- PWA requirements
- Offline requirements
- Synchronization requirements
- Testing requirements
- Security requirements
- Performance requirements

STEP 7:
Identify contradictions between the existing code and the requirements.

STEP 8:
Do not invent missing requirements.

STEP 9:
Ask questions only when a decision genuinely cannot be determined from the repository or requirements.

STEP 10:
Prepare the project for implementation.

==================================================
43. DO NOT DO THESE THINGS
==================================================

DO NOT:

- Create fake APIs
- Invent database fields
- Invent roles
- Invent permissions
- Invent environment variables
- Invent deployment providers
- Invent backup systems
- Invent synchronization behavior
- Claim offline support without implementation
- Claim automatic cloud backup without implementation
- Claim native Android/iOS applications
- Add unnecessary dependencies
- Rewrite working code unnecessarily
- Create the final README now
- Deploy without explicit instruction
- Perform destructive database operations without confirmation
- Expose secrets

==================================================
44. FINAL PRODUCT GOAL
==================================================

The final system should become:

A real Clinic Patient Management System
+
Reliable PostgreSQL database
+
Prisma ORM
+
Secure authentication
+
RBAC
+
Patient management
+
Patient 360
+
Visits
+
Medical records
+
Prescriptions
+
Follow-ups
+
Khmer + English
+
PWA
+
Local-first / Sync if actually required
+
Testing
+
Security
+
Performance
+
Production-ready architecture
+
Accurate final documentation

FINAL PRINCIPLE:

BUILD THE SYSTEM FIRST.

TEST THE SYSTEM SECOND.

VERIFY THE SYSTEM THIRD.

DEPLOY ONLY WHEN EXPLICITLY REQUESTED.

DOCUMENT THE ACTUAL SYSTEM LAST.

The final README.md must be generated only after the entire implemented system has been inspected and verified against the real codebase.

==================================================
45. MANDATORY SPECIAL SYSTEM SPECIFICATIONS
(PAYMENT INTEGRATION & HUMAN-CRAFTED UI/UX STANDARDS)
==================================================

This section defines mandatory architectural constraints and user-experience standards that override any generic assumptions.

--------------------------------------------------
45.1 REAL KHQR PAYMENT ENGINE (pay-helper INTEGRATION)
--------------------------------------------------

1. Integration Source:
   - Payment must be strictly powered by the `pay-helper` package (located in the workspace at `d:\WEB Development\Rotana-payway-bridge\KhqrDeeplink-headless-bridge\packages\khqr-helper`).
   - Do NOT use rotana-KHQr-deeplink or any third-party synthetic payment mocks.
   - Works directly with standard FREE ABA Merchant links from ABA Mobile (zero complex corporate gateway contracts or paid API keys required).

2. Where Payment Belongs in the Clinic System:
   - Location A: Visit Billing & Consultation Checkout
     Upon completion of a doctor consultation or patient check-in at Receptionist/Cashier, an invoice is generated for consultation fees and medical services.
   - Location B: Prescription & Pharmacy Dispensing Checkout
     When prescribed medicines are dispensed to the patient, calculate the exact medication total (USD or KHR) and generate a dynamic settlement bill.
   - Location C: Patient 360 & Invoice History
     Each patient record tracks settled vs pending invoices with receipt printing support.

3. Technical Execution:
   - In-Memory Dynamic Tag 01=12 KHQR generation locking the exact bill amount (Tag 54) so patients cannot alter the price.
   - Instant mobile deep linking for ABA Mobile and Bakong (`deeplinks.aba.ios`, `deeplinks.aba.android`).
   - Real-time settlement verification via Telegram MTProto User Client (`TelegramMtprotoListener`) (<0.3s confirmation).
   - Strict `verifySettlement()` checks preventing floating-point drift and duplicate charge reconciliation.

4. Telegram Settlement Architecture (Why MTProto User Client is Mandatory):
   - CRITICAL PLATFORM RULE: Do NOT attempt to create a standard BotFather bot to listen to ABA Bank notification bots in a group! Telegram platform policy strictly blocks bot-to-bot messaging; custom bot webhooks will receive ZERO messages from the bank bot.
   - Strictly use the native Telegram MTProto User Client (`TelegramMtprotoListener` from `pay-helper`). Authenticated via real Telegram user session (`npx auth-telegram`), it intercepts 100% of ABA alerts in real-time without public webhooks, domains, or port forwarding.

5. ZERO DEDICATED ANDROID PHONES / TASKER / MACDROID RULE (CRITICAL):
   - STRICTLY FORBIDDEN: Do NOT write instructions or invent architecture requiring a dedicated Android phone on a 24/7 charger running Tasker, MacroDroid, or Notification Forwarders! That is a fragile, outdated hack.
   - ABA Bank sends official alerts directly to Telegram channels/groups. With `pay-helper`'s native MTProto client, your backend daemon intercepts alerts in <50ms with zero extra hardware.

6. Mandatory Checkout UI/UX Architecture & Layout Rules:
   - Trigger Button: Starts with a clean "Pay Now" button; clicking it reveals the checkout modal.
   - Top Section: 1-Tap Bank Deeplinks (ABA Mobile, Bakong, Wing, ACLEDA).
     - Desktop Lock: Deeplinks are locked/disabled on Desktop with the clear notice: "Please scan the QR code below using your mobile banking app".
     - Mobile: Deeplinks are active. Tapping immediately pauses external status polling (0 calls, waits for MTProto push).
   - Bottom Section: Authentic QR Code Card.
     - Displays customizable Clinic / Store Name (`ROTANA CLINIC / គ្លីនិក រតនា`).
     - Formatted Amount & Currency.
     - Download QR button allowing patients to save image to gallery.
     - Inter-Bank Notice: Small text note reminding patients that scanning from non-ABA banks (ACLEDA, Wing, Canadia...) may take 3-4 seconds longer for settlement verification.

7. Strict 3-Minute Hard Limit & Anti-Reload State Preservation:
   - All checkout sessions enforce a strict hard limit of 180 seconds (3 minutes max).
   - Live countdown timer: `03:00` down to `00:00`. Once expired, QR dims and locks.
   - Anti-Reload & Safari State Preservation: Stores active session in `sessionStorage` with `beforeunload` warning safeguard so switching tabs or leaving Safari to pay in ABA Mobile does NOT cause the QR code or payment state to be lost.

--------------------------------------------------
45.2 HUMAN-CRAFTED CLINICAL UI/UX & MOBILE-APP DESIGN STANDARDS
--------------------------------------------------

1. 100% Human-Built Visual Aesthetic:
   - The user interface must look and feel like it was crafted by an elite human product designer specialized in healthcare systems.
   - STRICTLY FORBIDDEN: Generic AI template styling, flashy multicolored neon gradients, excessive glassmorphism, or gimmicky animations.
   - Visual Style: Clean, calm, high-contrast, clinical palette (medical slate, crisp clinical teal/indigo accents, crisp borders, generous whitespace).

2. Zero Emojis in Production UI:
   - STRICTLY FORBIDDEN: Emojis anywhere in the UI layout (no 🏥, 👨‍⚕️, 💊, 🩺, 💉, 📋, etc.).
   - All visual communication must use clean, crisp, monochromatic SVG iconography (e.g., Lucide React icons) and professional clinical typography.

3. Native Mobile App & PWA Ergonomics:
   - Designed mobile-first with native-like mobile app behaviors:
     - Fixed clinical header bar with patient quick-search.
     - Bottom navigation dock on mobile screens for one-thumb ergonomic navigation.
     - Smooth slide-up bottom sheets (drawers) for patient intake, vital signs entry, and payment modals.
     - Touch-friendly tap targets (minimum 44x44px).
   - Seamlessly responsive:
     - Mobile / Tablet: Optimized for nurses and doctors walking between consultation rooms.
     - Desktop: Expands into an efficient, dense dual-pane workstation for receptionists and administrators.
