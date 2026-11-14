# MediPulse Hospital AI Automation Platform — Deployment & Operations Guide

## Architecture Overview

MediPulse is built as a cloud-native, modular healthcare automation system comprising:
1. **n8n Automation Engine**: Self-hosted workflow orchestrator running 98 production nodes across 5 clinical flows with a dedicated error handling workflow.
2. **Node.js/Express Backend**: RESTful API server with JWT authentication, role-based access control, cryptographic token issuance, rate limiting, and webhook listeners.
3. **PostgreSQL / Supabase Database**: High-concurrency relational schema with triggers, partial unique indexes preventing double-booking, and immutable audit logs.
4. **React / Vite Admin Dashboard**: Single-page application providing clinical telemetry, appointment scheduling, live WhatsApp chat, and system settings.

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **Database**: PostgreSQL 14+ or Supabase instance
- **n8n**: v1.0.0 or higher
- **Meta WhatsApp Business Cloud API**: Phone Number ID and System User Access Token
- **Voice Calling Gateway**: Webhook-capable outbound telephony provider

---

## 2. Environment Configuration

Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

Ensure all mandatory variables are populated:
```ini
NODE_ENV=production
PORT=3001
JWT_SECRET=use-a-strong-32-character-random-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
WA_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WA_ACCESS_TOKEN=your-meta-access-token
WA_VERIFY_TOKEN=your-random-webhook-verify-token
VOICE_CALLBACK_SECRET=your-hmac-sha256-callback-secret
```

---

## 3. Database Migration

Execute the Supabase / PostgreSQL migration to provision the 14 core clinical tables, indexes, triggers, and constraints:
```bash
# In Supabase SQL Editor or via psql CLI:
psql -h <db_host> -U postgres -d postgres -f backend/src/db/migrations/001_initial_schema.sql
```

The migration automatically creates:
- `departments` & `doctors`
- `patients` & `appointments` (with `UNIQUE(doctor_id, slot_time) WHERE status != 'cancelled'`)
- `reports` & `feedback`
- `call_logs`, `message_log`, `reminder_delivery`
- `escalations`, `error_log`, `audit_log`, `users`

---

## 4. Backend Deployment

### Local / PM2 Process Manager:
```bash
cd backend
npm install --production
npm run start
```

Or using PM2 for automated restarts and clustering:
```bash
npm install -g pm2
pm2 start src/server.js --name "hospital-api" -i max
pm2 save
pm2 startup
```

---

## 5. Frontend Deployment

### Production Build:
```bash
cd frontend
npm install
npm run build
```

Serve the resulting `dist/` folder via Nginx, Caddy, Vercel, or AWS S3 + CloudFront:
```nginx
server {
    listen 80;
    server_name hospital.yourdomain.com;

    root /var/www/hospital-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 6. Docker Containerization

To run the complete platform via Docker:
```dockerfile
# Backend Dockerfile example
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src
EXPOSE 3001
CMD ["node", "src/server.js"]
```

---

## 7. Operational Health Checks

Verify system readiness via automated liveness endpoints:
```bash
curl -i http://localhost:3001/health
```
A 200 OK response with `"status": "pass"` confirms active database connectivity and healthy process memory limits.
