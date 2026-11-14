-- ============================================
-- Hospital AI Automation Platform
-- Database Migration: Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. DEPARTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. DOCTORS
-- ============================================
CREATE TABLE IF NOT EXISTS doctors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  department_id BIGINT REFERENCES departments(id),
  fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  available_days TEXT[] NOT NULL DEFAULT '{}',
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
  phone TEXT,
  email TEXT,
  qualification TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_doctors_department ON doctors(department);
CREATE INDEX idx_doctors_active ON doctors(is_active);

-- ============================================
-- 3. PATIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS patients (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Patient',
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  address TEXT,
  last_message_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(name);

-- ============================================
-- 4. APPOINTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  slot_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'completed', 'cancelled', 'missed', 'reschedule_pending', 'no_show')),
  source TEXT NOT NULL DEFAULT 'dashboard'
    CHECK (source IN ('whatsapp', 'dashboard', 'phone', 'walk_in')),
  notes TEXT,
  reminder_24h_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_2h_sent BOOLEAN NOT NULL DEFAULT false,
  confirmed_via_call BOOLEAN NOT NULL DEFAULT false,
  rescheduled BOOLEAN NOT NULL DEFAULT false,
  feedback_sent BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent double-booking: unique constraint on doctor + slot for active appointments
CREATE UNIQUE INDEX idx_appointments_no_double_booking
  ON appointments (doctor_id, slot_time)
  WHERE status NOT IN ('cancelled');

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_slot_time ON appointments(slot_time);
CREATE INDEX idx_appointments_reminders ON appointments(status, slot_time, reminder_24h_sent, reminder_2h_sent)
  WHERE status = 'confirmed';
CREATE INDEX idx_appointments_feedback ON appointments(status, feedback_sent, completed_at)
  WHERE status = 'completed' AND feedback_sent = false;

-- ============================================
-- 5. REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  report_type TEXT NOT NULL,
  report_url TEXT NOT NULL,
  secure_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  doctor_notes TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_reports_token ON reports(secure_token);
CREATE INDEX idx_reports_expires ON reports(expires_at);

-- ============================================
-- 6. FEEDBACK
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  patient_id BIGINT REFERENCES patients(id) ON DELETE SET NULL,
  patient_phone TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate feedback per appointment
CREATE UNIQUE INDEX idx_feedback_unique_appointment
  ON feedback(appointment_id)
  WHERE appointment_id IS NOT NULL;

CREATE INDEX idx_feedback_patient_phone ON feedback(patient_phone);
CREATE INDEX idx_feedback_pending ON feedback(patient_phone, rating)
  WHERE rating IS NULL;

-- ============================================
-- 7. CALL LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS call_logs (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
  patient_phone TEXT NOT NULL,
  call_type TEXT NOT NULL
    CHECK (call_type IN ('reminder_2h', 'missed_followup', 'critical_report', 'patient_requested', 'status_callback')),
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'initiated', 'ringing', 'in_progress', 'completed', 'failed', 'busy', 'no_answer', 'cancelled', 'unknown')),
  outcome TEXT
    CHECK (outcome IN ('confirmed', 'reschedule_requested', 'cancelled', 'no_answer', 'failed', NULL)),
  transcript_summary TEXT,
  external_call_id TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_call_logs_appointment ON call_logs(appointment_id);
CREATE INDEX idx_call_logs_patient ON call_logs(patient_phone);
CREATE INDEX idx_call_logs_status ON call_logs(status);

-- ============================================
-- 8. ERROR LOG
-- ============================================
CREATE TABLE IF NOT EXISTS error_log (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL,
  patient_phone TEXT,
  error_detail TEXT,
  execution_id TEXT,
  node_name TEXT,
  severity TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_log_source ON error_log(source);
CREATE INDEX idx_error_log_severity ON error_log(severity);
CREATE INDEX idx_error_log_created ON error_log(created_at DESC);

-- ============================================
-- 9. ESCALATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS escalations (
  id BIGSERIAL PRIMARY KEY,
  patient_phone TEXT NOT NULL,
  reason TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal'
    CHECK (urgency IN ('normal', 'urgent', 'emergency')),
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escalations_resolved ON escalations(resolved);
CREATE INDEX idx_escalations_urgency ON escalations(urgency);

-- ============================================
-- 10. USERS (Dashboard Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer'
    CHECK (role IN ('admin', 'doctor', 'receptionist', 'viewer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- 11. AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================
-- 12. MESSAGE LOG (WhatsApp message tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS message_log (
  id BIGSERIAL PRIMARY KEY,
  patient_phone TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT NOT NULL DEFAULT 'text',
  content TEXT,
  wa_message_id TEXT UNIQUE,
  template_name TEXT,
  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
  error_detail TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_log_patient ON message_log(patient_phone);
CREATE INDEX idx_message_log_wa_id ON message_log(wa_message_id);
CREATE INDEX idx_message_log_created ON message_log(created_at DESC);

-- ============================================
-- 13. REMINDER DELIVERY (separate from appointment flags)
-- ============================================
CREATE TABLE IF NOT EXISTS reminder_delivery (
  id BIGSERIAL PRIMARY KEY,
  appointment_id BIGINT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h_whatsapp', '2h_whatsapp', '2h_voice')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  wa_message_id TEXT,
  call_log_id BIGINT REFERENCES call_logs(id),
  error_detail TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(appointment_id, reminder_type)
);

CREATE INDEX idx_reminder_delivery_appointment ON reminder_delivery(appointment_id);

-- ============================================
-- 14. DOCTOR LEAVE / HOLIDAYS
-- ============================================
CREATE TABLE IF NOT EXISTS doctor_leaves (
  id BIGSERIAL PRIMARY KEY,
  doctor_id BIGINT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(doctor_id, leave_date)
);

CREATE INDEX idx_doctor_leaves_doctor ON doctor_leaves(doctor_id);
CREATE INDEX idx_doctor_leaves_date ON doctor_leaves(leave_date);

-- ============================================
-- UPDATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS on sensitive tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so n8n (using service_role key) works fine
-- For anon key access (frontend via backend proxy), we don't expose directly
-- Backend uses service_role key server-side only

-- ============================================
-- SEED DATA (Synthetic — clearly labeled)
-- ============================================

-- Departments
INSERT INTO departments (name, description) VALUES
  ('General Medicine', 'General health checkups and consultations'),
  ('Cardiology', 'Heart and cardiovascular conditions'),
  ('Orthopedics', 'Bone, joint, and muscle conditions'),
  ('Dermatology', 'Skin, hair, and nail conditions'),
  ('Pediatrics', 'Children and infant healthcare'),
  ('ENT', 'Ear, Nose, and Throat specialist'),
  ('Ophthalmology', 'Eye care and vision'),
  ('Gynecology', 'Women health and reproductive care'),
  ('Dental', 'Dental and oral health'),
  ('Neurology', 'Brain and nervous system')
ON CONFLICT (name) DO NOTHING;

-- Doctors (SYNTHETIC DATA)
INSERT INTO doctors (name, department, department_id, fee, available_days, start_time, end_time, slot_duration_minutes) VALUES
  ('Dr. Muhammad Tariq [TEST]', 'General Medicine', 1, 1500, '{Monday,Tuesday,Wednesday,Thursday,Friday}', '09:00', '17:00', 30),
  ('Dr. Ayesha Khan [TEST]', 'Cardiology', 2, 3000, '{Monday,Wednesday,Friday}', '10:00', '16:00', 45),
  ('Dr. Usman Farooq [TEST]', 'Orthopedics', 3, 2500, '{Tuesday,Thursday,Saturday}', '09:00', '14:00', 30),
  ('Dr. Fatima Zahra [TEST]', 'Dermatology', 4, 2000, '{Monday,Tuesday,Thursday,Friday}', '11:00', '18:00', 20),
  ('Dr. Bilal Ahmed [TEST]', 'Pediatrics', 5, 2000, '{Monday,Tuesday,Wednesday,Thursday,Friday,Saturday}', '09:00', '13:00', 30),
  ('Dr. Zainab Malik [TEST]', 'ENT', 6, 2200, '{Monday,Wednesday,Friday}', '10:00', '15:00', 30),
  ('Dr. Hamza Ali [TEST]', 'Neurology', 10, 3500, '{Tuesday,Thursday}', '10:00', '16:00', 45)
ON CONFLICT DO NOTHING;

-- Admin user (password: Admin@Hospital123 — CHANGE IN PRODUCTION)
-- bcrypt hash for 'Admin@Hospital123' with 12 rounds
INSERT INTO users (email, password_hash, name, role) VALUES
  ('admin@hospital.test', '$2b$12$LJ3m4ys6Gx0bHkVYQvKIIeQJmOGq5nYFhBKgVqDuvfFdN5P9YXKW.', 'Hospital Admin [TEST]', 'admin'),
  ('reception@hospital.test', '$2b$12$LJ3m4ys6Gx0bHkVYQvKIIeQJmOGq5nYFhBKgVqDuvfFdN5P9YXKW.', 'Front Desk [TEST]', 'receptionist'),
  ('viewer@hospital.test', '$2b$12$LJ3m4ys6Gx0bHkVYQvKIIeQJmOGq5nYFhBKgVqDuvfFdN5P9YXKW.', 'Viewer [TEST]', 'viewer')
ON CONFLICT (email) DO NOTHING;

-- Sample patients (SYNTHETIC — clearly labeled)
INSERT INTO patients (phone, name) VALUES
  ('+923001234567', 'Test Patient Muhammad Ali [SYNTHETIC]'),
  ('+923011234568', 'Test Patient Fatima Bibi [SYNTHETIC]'),
  ('+923021234569', 'Test Patient Ahmed Raza [SYNTHETIC]')
ON CONFLICT (phone) DO NOTHING;
