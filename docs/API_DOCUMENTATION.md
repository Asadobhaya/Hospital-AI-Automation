# MediPulse Hospital AI Automation Platform — API Documentation

## Overview

The MediPulse Hospital API provides a production-grade backend for automated patient journeys, WhatsApp AI conversational support, outbound AI voice calling callbacks, diagnostic lab reports with cryptographic token validation, patient feedback collection, and the Hospital Staff Operations Dashboard.

**Base URL**: `http://localhost:3001/api`  
**Protocol**: HTTPS (Production) / HTTP (Local Development)  
**Authentication**: HTTP-Only Secure JWT Cookie (`hospital_token`) or `Authorization: Bearer <token>`  

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticates hospital staff and issues signed JWT tokens (24h validity) with HttpOnly cookies.
- **Rate Limit**: 10 attempts per 15 minutes per IP.
- **Request Body**:
  ```json
  {
    "email": "admin@hospital.test",
    "password": "Password@123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "11111111-2222-3333-4444-555555555555",
        "email": "admin@hospital.test",
        "name": "Hospital Administrator [TEST]",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
    }
  }
  ```

### `GET /api/auth/me`
Returns currently authenticated user profile.
- **Headers**: `Authorization: Bearer <token>` or Cookie.
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "11111111-2222-3333-4444-555555555555",
      "email": "admin@hospital.test",
      "role": "admin"
    }
  }
  ```

### `POST /api/auth/logout`
Clears HTTP-only authentication cookies.

---

## 2. Appointments API

### `GET /api/appointments`
Retrieves paginated appointments with doctor and patient relations.
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: `confirmed`, `reschedule_pending`, `completed`, `cancelled`, `missed`
  - `doctor_id`: Filter by doctor ID
  - `date`: Filter by `YYYY-MM-DD`
  - `search`: Search by patient name or phone number

### `POST /api/appointments`
Books a new appointment with strict working hours and double-booking conflict detection.
- **Request Body**:
  ```json
  {
    "patientName": "Ramesh Kumar",
    "patientPhone": "+919876543210",
    "doctorId": 1,
    "slotTime": "2026-11-20T10:30:00.000Z",
    "notes": "Routine cardiology checkup"
  }
  ```
- **Error Response (409 Conflict)**:
  ```json
  {
    "success": false,
    "error": {
      "message": "Time slot conflict: Doctor Dr. Priya Sharma already has an appointment booked at or near this time."
    }
  }
  ```

### `POST /api/appointments/:id/reschedule`
Atomically moves an appointment to a new slot with concurrency guard.
- **Request Body**:
  ```json
  {
    "newSlotTime": "2026-11-21T14:30:00.000Z",
    "reason": "Patient requested afternoon slot via WhatsApp"
  }
  ```

### `POST /api/appointments/:id/cancel`
Marks appointment as cancelled and frees up the doctor's slot for other patients.

---

## 3. Webhooks & Integrations

### `GET /api/webhooks/whatsapp`
Meta Cloud API Webhook handshake verification.
- **Query Parameters**: `hub.mode`, `hub.verify_token`, `hub.challenge`

### `POST /api/webhooks/whatsapp`
Inbound WhatsApp message ingestion. Automatically performs:
1. Message deduplication (idempotency check via `wa_message_id`).
2. Medical Safety & Triage screening:
   - **Emergency Detection**: Keywords like chest pain, breathing difficulty, severe bleeding, or poisoning trigger instant 108 / 112 emergency routing and alert front desk.
   - **Clinical Boundaries**: Drug prescription requests or diagnosis questions trigger a disclaimer directing patient to consult a licensed physician.
   - **Prompt Injection Defense**: Blocks system prompt extraction or SQL injection attempts.

### `POST /api/webhooks/voice/callback`
Outcome callback from Outbound AI Voice Calling Gateway.
- **Headers**: `x-webhook-signature` or `x-voice-signature` (HMAC-SHA256 signature).
- **Payload**:
  ```json
  {
    "call_id": "call_123456",
    "appointment_id": 1,
    "status": "completed",
    "outcome": "confirmed",
    "duration_seconds": 45,
    "transcript_summary": "Patient confirmed attendance for tomorrow's appointment."
  }
  ```
- **Automated Routing**:
  - `confirmed` -> sets `confirmed_via_call = true` on appointment.
  - `reschedule_requested` -> sets appointment status to `reschedule_pending` and dispatches WhatsApp reschedule calendar link.
  - `cancelled` -> cancels appointment and notifies doctor.
  - `failed` / `no_answer` -> increments retry counter; escalates to staff after 2 failures.

---

## 4. Reports API & Secure Patient Portal

### `POST /api/reports`
Issues a diagnostic lab report and generates a cryptographically random 32-byte hex token.
- **Validity**: Exactly 7 days from creation.
- **Request Body**:
  ```json
  {
    "patientId": 1,
    "reportType": "Complete Blood Count (CBC)",
    "reportUrl": "https://storage.hospital.internal/reports/cbc_123.pdf",
    "doctorNotes": "WBC count normal",
    "isCritical": false
  }
  ```

### `GET /api/reports/view/:token`
Public secure verification endpoint. Accessible by patients without staff login.
- **Enforces**:
  1. Token must be valid 64-character hex string.
  2. Token must not be expired (`expires_at > now()`).
  3. Token must not be revoked (`is_revoked === false`).
- Returns sanitized patient view payload without exposing secret tokens.

### `POST /api/reports/:id/revoke`
Staff-initiated revocation of report access link.

---

## 5. Feedback & Survey API

### `GET /api/feedback`
Lists patient survey ratings (1 to 5 stars).

### `POST /api/feedback`
Receives post-consultation survey response.
- **Rating 1-3**: Automatically creates high-priority escalation for front desk patient recovery.
- **Rating 4-5**: Dispatches automated Google Review request link.

### `GET /api/feedback/export`
Exports all feedback responses in CSV format for hospital operations reporting.

---

## 6. System Health & Telemetry

### `GET /health`
Liveness and readiness probe for container orchestrators and monitoring tools.
```json
{
  "status": "pass",
  "service": "hospital-ai-automation-api",
  "version": "1.0.0",
  "environment": "development",
  "uptimeSeconds": 124,
  "checks": {
    "database": {
      "status": "healthy",
      "latencyMs": 2,
      "provider": "local_json_adapter"
    },
    "memory": {
      "status": "healthy",
      "heapUsedMb": 38.45,
      "rssMb": 82.11
    }
  }
}
```
