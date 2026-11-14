# MediPulse Hospital AI Automation — n8n Setup & Import Guide

## Overview

The automation workflows for MediPulse are modularized into two production-tested JSON exports located in the `n8n-workflows/` directory:

1. `n8n-workflows/hospital_workflow_repaired.json` (98 nodes) — The core clinical automation workflow covering WhatsApp AI triage, appointment booking/rescheduling, 24h & 2h outbound reminder voice calls, diagnostic lab report delivery, and patient feedback surveys.
2. `n8n-workflows/hospital_error_workflow.json` (3 nodes) — The dedicated Error Trigger workflow providing automated error logging, retry counting, and critical incident alerts via email.

---

## 1. Import Steps in n8n

1. Log in to your n8n web interface (e.g., `https://n8n.yourhospital.org`).
2. Navigate to **Workflows** in the left navigation sidebar.
3. Click the **+ Add Workflow** button or the top-right menu **Import from File**.
4. Select `n8n-workflows/hospital_error_workflow.json` first:
   - Click **Save**.
   - Note the generated Workflow ID (e.g. `HOSPITAL_ERROR_HANDLER`).
   - Toggle the workflow to **Active**.
5. Return to **Workflows** and import `n8n-workflows/hospital_workflow_repaired.json`:
   - Open Workflow Settings (gear icon in n8n).
   - In the **Error Workflow** dropdown, select `HOSPITAL_ERROR_HANDLER` (the error workflow imported in step 4).
   - Click **Save**.
   - Toggle the workflow to **Active**.

---

## 2. Configured Credentials in n8n

The repaired workflow utilizes parameterized environment variables and standard n8n credentials:

| Credential Name | Service | Purpose |
|-----------------|---------|---------|
| `supabaseApi` | Supabase / PostgreSQL | Direct REST queries for appointment conflict detection |
| `whatsappBusinessCloudApi` | Meta Cloud API | Inbound webhook receipt & outbound template dispatch |
| `voiceCallingApi` | Outbound Telephony | Automated reminder call triggers |
| `smtpCredentials` | Hospital SMTP | High-priority staff error alerts & doctor notifications |

---

## 3. Webhook Endpoint Registration

Configure the following webhook URLs in Meta Developer Portal and your Voice Provider:

### WhatsApp Webhook:
- **Callback URL**: `https://api.yourhospital.org/api/webhooks/whatsapp`
- **Verify Token**: Must match `WA_VERIFY_TOKEN` in `.env`.
- **Subscribed Fields**: `messages`

### AI Voice Provider Callback:
- **Callback URL**: `https://api.yourhospital.org/api/webhooks/voice/callback`
- **Signing Method**: HMAC-SHA256 with `VOICE_CALLBACK_SECRET` in header `x-webhook-signature`

---

## 4. Key Architectural Fixes Made to Original Workflow

During the audit and repair phase, the following architectural flaws in the original 102-node export were corrected:

1. **Eliminated PostgREST Protocol Collision**:
   - Original nodes attempted to send duplicate `Prefer: return=representation` headers on Supabase HTTP updates, resulting in `400 Bad Request: multiple Prefer headers` from PostgREST.
   - Cleaned all HTTP request headers to standard compliant single entries.

2. **Cryptographic Token Generator**:
   - Original report generation node used an insecure `Math.random().toString(36)` generator producing easily guessable 8-character tokens.
   - Replaced with standard Node.js `crypto.randomBytes(32).toString('hex')` producing unguessable 64-character tokens.

3. **Data Loss on Reminder Branches**:
   - Original reminder scheduling branches dropped patient phone numbers during intermediate date calculation nodes.
   - Restructured expressions to pass full appointment payloads down all reminder nodes.

4. **Error Trigger Decoupling**:
   - The original export embedded an invalid inline Error Trigger node alongside standard webhook triggers, causing n8n validation errors on activation.
   - Decoupled into a dedicated, clean Error Handler workflow that correctly binds via n8n's workflow settings.
