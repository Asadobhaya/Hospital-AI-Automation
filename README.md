# 🏥 MediPulse — Hospital AI Automation Platform

[![CI / Automated Tests](https://img.shields.io/badge/Tests-31%20Passed%20(100%25)-success)](backend/tests/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-blue)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-cyan)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

**MediPulse** is a full-stack, production-ready healthcare operations and AI automation platform. It seamlessly connects patient communications, doctor schedules, diagnostic reports, and automated follow-ups into a unified clinical hub.

---

## 🌟 Key Capabilities & Clinical Journeys

1. **24x7 WhatsApp AI Patient Support**
   - Autonomous multi-lingual triage (English & Hinglish).
   - Medical Emergency Detection: Intercepts acute distress (chest pain, breathing difficulty, severe bleeding) and triggers immediate Ambulance (108 / 112) routing.
   - Clinical Boundary Guardrails: Strictly refuses drug prescriptions or unverified diagnoses and directs patients to licensed physicians.
   - Live Staff Takeover: Real-time chat stream with one-click human override.

2. **Appointment Scheduling & Concurrency Guard**
   - 30-minute slot granularity aligned to doctor consulting hours and working days.
   - Multi-tier double-booking prevention enforced via DB partial unique index: `UNIQUE(doctor_id, slot_time) WHERE status != 'cancelled'`.
   - Atomic rescheduling and one-click cancellation with immediate slot release.

3. **AI Voice Calling & Webhook Reminders**
   - Automated 24-hour and 2-hour outbound reminder call dispatches.
   - HMAC-SHA256 authenticated callback processing for call outcomes (`confirmed`, `reschedule_requested`, `cancelled`, `no_answer`).
   - Automated retry counter with automatic front-desk human escalation after 2 failed attempts.

4. **Cryptographically Secure Diagnostic Lab Reports**
   - Generates 32-byte cryptographically secure random tokens (64-character hex).
   - Server-enforced 7-day automatic link expiry.
   - Instant staff revocation capability and access counting.
   - Public patient portal (`/reports/view?token=...`) requiring zero staff login.

5. **Automated Patient Feedback & NPS**
   - 1-to-5 star post-consultation survey routing.
   - Unhappy patients ($\le 3$ stars) trigger immediate front-desk recovery alerts.
   - Satisfied patients ($\ge 4$ stars) automatically receive Google Review request links.
   - One-click CSV export for clinical operations review.

6. **Hospital Operations Dashboard (10 Integrated Pages)**
   - Overview KPI telemetry, 7-day trend charts, patient records, physician rosters, voice logs, diagnostic reports, and security audit logs.

---

## 🏗️ Repository Architecture

```text
├── backend/                  # Node.js / Express REST API Server
│   ├── src/
│   │   ├── app.js            # Express application setup, security headers, rate limiting
│   │   ├── server.js         # HTTP server entry point & graceful shutdown
│   │   ├── config.js         # Parameterized environment configuration
│   │   ├── db/               # PostgreSQL / Supabase migration & Dual-Mode Adapter
│   │   ├── middleware/       # JWT auth, RBAC, error sanitization, rate limiters
│   │   ├── routes/           # REST endpoints (appointments, auth, reports, webhooks, etc.)
│   │   └── services/         # Business logic (appointments, aiSafety, reports, voice, etc.)
│   └── tests/                # Jest automated test suite (31 Unit, Integration & Adversarial tests)
│
├── frontend/                 # React 18 / Vite / Tailwind CSS Admin Dashboard
│   ├── src/
│   │   ├── pages/            # 10 clinical pages + Public Patient Report Viewer
│   │   ├── components/       # UI layout, modals, badges, data tables, skeletons
│   │   ├── contexts/         # AuthContext with session management
│   │   └── services/         # API client layer
│   └── dist/                 # Production-optimized build bundle
│
├── n8n-workflows/            # Production n8n automation exports
│   ├── hospital_workflow_repaired.json # Core 98-node clinical workflow
│   └── hospital_error_workflow.json    # Dedicated Error Trigger & alert workflow
│
├── docs/                     # Comprehensive engineering & compliance documentation
│   ├── API_DOCUMENTATION.md  # Detailed REST endpoint specifications
│   ├── DEPLOYMENT_GUIDE.md   # Production deployment runbook
│   ├── N8N_SETUP_GUIDE.md    # n8n import & credential configuration guide
│   └── SECURITY_AUDIT.md     # Adversarial audit results & threat modeling
└── .env.example              # Environment variables template with safe placeholders
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (v20 LTS recommended)
- Git

### 2. Backend API Setup
```bash
cd backend
npm install
npm start
```
- API Base URL: `http://localhost:3001/api`
- Health Endpoint: `http://localhost:3001/health`

### 3. Frontend Dashboard Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
- Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Pre-Configured Test Credentials
| Role | Email | Password |
|---|---|---|
| **Hospital Administrator** | `admin@hospital.test` | `Password@123` |
| **Cardiology Doctor** | `priya.sharma@hospital.test` | `Password@123` |
| **Front Desk Receptionist** | `reception@hospital.test` | `Password@123` |

---

## 🧪 Automated Testing

Execute the complete automated test suite (Unit, Integration, and Adversarial Security):
```bash
cd backend
npm test
```
*Current test suite passing status: **31 / 31 tests passed (100%)**.*

---

## 🌐 Deploying Live to the Cloud

For a complete step-by-step production deployment guide, refer to [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md):

1. **Frontend**: Deploy `frontend/` to **Vercel** or **Netlify** with 1-click GitHub connection.
2. **Backend**: Deploy `backend/` to **Render**, **Railway**, or **Fly.io**.
3. **Database**: Provision a free managed PostgreSQL instance on **Supabase** and run `backend/src/db/migrations/001_initial_schema.sql`.
4. **n8n Automation Engine**: Self-host n8n or use n8n Cloud and import the workflows in `n8n-workflows/`.

---

## 🔒 Security & Compliance

- **Zero Client Secret Leakage**: No database service-role keys or vendor secrets are exposed in the client bundle.
- **HMAC Verification**: Outbound voice callbacks are verified using HMAC-SHA256 with timing-safe comparison.
- **Immutable Audit Trail**: All clinical transactions are logged with actor ID, action type, IP address, and timestamp.
- Full details available in [`docs/SECURITY_AUDIT.md`](docs/SECURITY_AUDIT.md).

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
