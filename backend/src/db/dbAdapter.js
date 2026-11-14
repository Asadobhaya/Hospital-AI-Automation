// src/db/dbAdapter.js — Unified Database Adapter with Supabase Parity
'use strict';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const config = require('../config');
const logger = require('../utils/logger');

let supabase = null;
let isSupabaseOnline = false;
const isSupabaseConfigured = Boolean(
  config.supabase.url &&
  config.supabase.serviceRoleKey &&
  !config.supabase.url.includes('your-project') &&
  !config.supabase.serviceRoleKey.includes('your-supabase')
);

if (isSupabaseConfigured) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    // Verify actual remote connectivity asynchronously
    supabase.from('departments').select('id').limit(1)
      .then(({ error }) => {
        if (error) {
          logger.warn('Supabase remote query returned error, using resilient local storage', error);
          isSupabaseOnline = false;
        } else {
          logger.info('Connected and verified remote Supabase database');
          isSupabaseOnline = true;
        }
      })
      .catch((err) => {
        logger.warn('Supabase remote connection unreachable, using resilient local storage', err);
        isSupabaseOnline = false;
      });
  } catch (err) {
    logger.warn('Failed to initialize Supabase client, falling back to local database adapter', err);
    supabase = null;
    isSupabaseOnline = false;
  }
}

// Local persistent database store (isolated from tests to prevent test pollution of operational data)
const isTestEnv = process.env.NODE_ENV === 'test';
const dataFile = isTestEnv
  ? path.join(__dirname, 'test_db.json')
  : path.join(__dirname, 'local_db.json');

// Initialize default dataset
function getDefaultData() {
  const adminPasswordHash = bcrypt.hashSync('Password@123', 10);
  const now = new Date();
  const todayMorning = new Date(now);
  todayMorning.setHours(10, 0, 0, 0);
  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(14, 30, 0, 0);
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
  tomorrow.setHours(11, 0, 0, 0);

  return {
    departments: [
      { id: 1, name: 'General Medicine', description: 'General health checkups and consultations', is_active: true },
      { id: 2, name: 'Cardiology', description: 'Heart and cardiovascular conditions', is_active: true },
      { id: 3, name: 'Orthopedics', description: 'Bone, joint, and muscle conditions', is_active: true },
      { id: 4, name: 'Dermatology', description: 'Skin, hair, and nail conditions', is_active: true },
      { id: 5, name: 'Pediatrics', description: 'Children and infant healthcare', is_active: true },
      { id: 6, name: 'ENT', description: 'Ear, Nose, and Throat specialist', is_active: true },
      { id: 7, name: 'Neurology', description: 'Brain and nervous system', is_active: true },
    ],
    doctors: [
      { id: 1, name: 'Dr. Muhammad Tariq', department: 'General Medicine', department_id: 1, fee: 1500, available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
      { id: 2, name: 'Dr. Ayesha Khan', department: 'Cardiology', department_id: 2, fee: 3000, available_days: ['Monday', 'Wednesday', 'Friday'], start_time: '10:00', end_time: '16:00', slot_duration_minutes: 45, is_active: true },
      { id: 3, name: 'Dr. Usman Farooq', department: 'Orthopedics', department_id: 3, fee: 2500, available_days: ['Tuesday', 'Thursday', 'Saturday'], start_time: '09:00', end_time: '14:00', slot_duration_minutes: 30, is_active: true },
      { id: 4, name: 'Dr. Fatima Zahra', department: 'Dermatology', department_id: 4, fee: 2000, available_days: ['Monday', 'Tuesday', 'Thursday', 'Friday'], start_time: '11:00', end_time: '18:00', slot_duration_minutes: 20, is_active: true },
      { id: 5, name: 'Dr. Bilal Ahmed', department: 'Pediatrics', department_id: 5, fee: 2000, available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], start_time: '09:00', end_time: '13:00', slot_duration_minutes: 30, is_active: true },
      { id: 6, name: 'Dr. Zainab Malik', department: 'ENT', department_id: 6, fee: 2200, available_days: ['Monday', 'Wednesday', 'Friday'], start_time: '10:00', end_time: '15:00', slot_duration_minutes: 30, is_active: true },
      { id: 7, name: 'Dr. Hamza Ali', department: 'Neurology', department_id: 7, fee: 3500, available_days: ['Tuesday', 'Thursday'], start_time: '10:00', end_time: '16:00', slot_duration_minutes: 45, is_active: true },
      { id: 8, name: 'Dr. Babar Azam', department: 'Cardiology', department_id: 2, fee: 3000, available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], start_time: '09:00', end_time: '17:00', slot_duration_minutes: 30, is_active: true },
    ],
    patients: [
      { id: 1, phone: '+923001234567', name: 'Muhammad Ali Khan', email: 'ali.khan@example.com', gender: 'male', is_active: true, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: 2, phone: '+923011234568', name: 'Fatima Bibi', email: 'fatima.bibi@example.com', gender: 'female', is_active: true, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 3, phone: '+923021234569', name: 'Ahmed Raza', email: 'ahmed.raza@example.com', gender: 'male', is_active: true, created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 4, phone: '+923031234570', name: 'Zainab Noor', email: 'zainab.noor@example.com', gender: 'female', is_active: true, created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
      { id: 5, phone: '+923041234571', name: 'Tariq Mehmood', email: 'tariq.mehmood@example.com', gender: 'male', is_active: true, created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
      { id: 6, phone: '+923004634494', name: 'Asad Ullah', email: 'asad.ullah@example.com', gender: 'male', is_active: true, created_at: new Date().toISOString() },
    ],
    appointments: [
      {
        id: 1,
        patient_id: 1,
        doctor_id: 1,
        slot_time: todayMorning.toISOString(),
        status: 'confirmed',
        source: 'whatsapp',
        reminder_24h_sent: true,
        reminder_2h_sent: false,
        confirmed_via_call: false,
        rescheduled: false,
        feedback_sent: false,
        retry_count: 0,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 2,
        patient_id: 2,
        doctor_id: 2,
        slot_time: todayAfternoon.toISOString(),
        status: 'confirmed',
        source: 'dashboard',
        reminder_24h_sent: true,
        reminder_2h_sent: true,
        confirmed_via_call: true,
        rescheduled: false,
        feedback_sent: false,
        retry_count: 0,
        created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 3,
        patient_id: 3,
        doctor_id: 3,
        slot_time: tomorrow.toISOString(),
        status: 'confirmed',
        source: 'whatsapp',
        reminder_24h_sent: false,
        reminder_2h_sent: false,
        confirmed_via_call: false,
        rescheduled: false,
        feedback_sent: false,
        retry_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: 4,
        patient_id: 1,
        doctor_id: 4,
        slot_time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        status: 'completed',
        source: 'dashboard',
        reminder_24h_sent: true,
        reminder_2h_sent: true,
        confirmed_via_call: false,
        rescheduled: false,
        feedback_sent: true,
        completed_at: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        retry_count: 0,
        created_at: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      }
    ],
    reports: [
      {
        id: 1,
        patient_id: 1,
        report_type: 'Complete Blood Count (CBC)',
        report_url: 'https://storage.hospital.internal/reports/cbc_test_patient_1.pdf',
        secure_token: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        expires_at: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
        is_critical: false,
        doctor_notes: 'Hemoglobin slightly low, all other parameters within normal limits.',
        is_revoked: false,
        access_count: 1,
        created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 2,
        patient_id: 2,
        report_type: 'Lipid Profile & ECG',
        report_url: 'https://storage.hospital.internal/reports/ecg_test_patient_2.pdf',
        secure_token: 'f9e8d7c6b5a4031234567890abcdef1234567890abcdef1234567890abcdef12',
        expires_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
        is_critical: true,
        doctor_notes: 'Elevated LDL cholesterol. Follow up required urgently.',
        is_revoked: false,
        access_count: 0,
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      }
    ],
    feedback: [
      {
        id: 1,
        appointment_id: 4,
        patient_id: 1,
        patient_phone: '+923001234567',
        rating: 5,
        comment: 'Very polite doctor and zero waiting time. Highly satisfied with the consultation!',
        requested_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        responded_at: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      }
    ],
    call_logs: [
      {
        id: 1,
        appointment_id: 2,
        patient_phone: '+923011234568',
        call_type: 'reminder_2h',
        status: 'completed',
        outcome: 'confirmed',
        transcript_summary: 'Patient confirmed arrival for 2:30 PM appointment with Dr. Ayesha Khan.',
        duration_seconds: 45,
        created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      }
    ],
    escalations: [
      {
        id: 1,
        patient_phone: '+923021234569',
        reason: 'Patient inquired about chest tightness and shortness of breath while asking about cardiology slot.',
        urgency: 'urgent',
        resolved: false,
        created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      }
    ],
    error_log: [
      {
        id: 1,
        source: 'whatsapp_webhook',
        patient_phone: '+923009999999',
        error_detail: 'WhatsApp API rate limit warning: message delivery queued for retry.',
        severity: 'warning',
        resolved: false,
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      }
    ],
    users: [
      {
        id: '11111111-2222-3333-4444-555555555555',
        email: 'admin@hospital.test',
        password_hash: adminPasswordHash,
        name: 'Hospital Administrator',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '22222222-3333-4444-5555-666666666666',
        email: 'reception@hospital.test',
        password_hash: adminPasswordHash,
        name: 'Front Desk Officer',
        role: 'receptionist',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      {
        id: '33333333-4444-5555-6666-777777777777',
        email: 'doctor@hospital.test',
        password_hash: adminPasswordHash,
        name: 'Dr. Muhammad Tariq',
        role: 'doctor',
        is_active: true,
        created_at: new Date().toISOString(),
      }
    ],
    audit_log: [
      {
        id: 1,
        user_id: '11111111-2222-3333-4444-555555555555',
        action: 'SYSTEM_INIT',
        resource_type: 'platform',
        resource_id: 'init',
        details: { status: 'Database schema verified and operational' },
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      }
    ],
    message_log: [
      {
        id: 1,
        patient_phone: '+923001234567',
        direction: 'inbound',
        message_type: 'text',
        content: 'Assalam-o-Alaikum, I need to check my appointment status for today.',
        wa_message_id: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAEhgUM0FBQzI5QkRDMUZC',
        status: 'received',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      },
      {
        id: 2,
        patient_phone: '+923001234567',
        direction: 'outbound',
        message_type: 'text',
        content: 'Walaikum Assalam Muhammad Ali sb! Aapka appointment Dr. Muhammad Tariq ke saath aaj subah 10:00 AM par confirmed hai. Room 102 mein tashreef layein.',
        wa_message_id: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAERgUM0FBQzI5QkRDMUZD',
        status: 'delivered',
        created_at: new Date(Date.now() - 4 * 3600 * 1000 + 5000).toISOString(),
      }
    ]
  };
}

let localStore = null;

function loadLocalStore() {
  if (localStore) return localStore;
  try {
    if (fs.existsSync(dataFile)) {
      const content = fs.readFileSync(dataFile, 'utf8');
      localStore = JSON.parse(content);
    } else {
      localStore = getDefaultData();
      saveLocalStore();
    }
  } catch (err) {
    logger.warn('Error reading local_db.json, using fresh default dataset', err);
    localStore = getDefaultData();
  }
  return localStore;
}

function saveLocalStore() {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(localStore, null, 2), 'utf8');
  } catch (err) {
    logger.error('Error saving local_db.json', err);
  }
}

// Chainable query builder matching Supabase API
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectedFields = null;
    this.filters = [];
    this.sortField = null;
    this.ascending = true;
    this.limitCount = null;
    this.offsetCount = null;
    this.isSingle = false;
    this.countOnly = false;
  }

  select(fields = '*', options = {}) {
    this.selectedFields = fields;
    if (options.count) {
      this.countType = options.count;
    }
    return this;
  }

  eq(field, value) {
    this.filters.push((item) => String(item[field]) === String(value));
    return this;
  }

  neq(field, value) {
    this.filters.push((item) => String(item[field]) !== String(value));
    return this;
  }

  gte(field, value) {
    this.filters.push((item) => new Date(item[field]).getTime() >= new Date(value).getTime() || item[field] >= value);
    return this;
  }

  lte(field, value) {
    this.filters.push((item) => new Date(item[field]).getTime() <= new Date(value).getTime() || item[field] <= value);
    return this;
  }

  lt(field, value) {
    this.filters.push((item) => new Date(item[field]).getTime() < new Date(value).getTime() || item[field] < value);
    return this;
  }

  gt(field, value) {
    this.filters.push((item) => new Date(item[field]).getTime() > new Date(value).getTime() || item[field] > value);
    return this;
  }

  is(field, value) {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  ilike(field, pattern) {
    const raw = pattern.replace(/%/g, '');
    this.filters.push((item) => item[field] && String(item[field]).toLowerCase().includes(raw.toLowerCase()));
    return this;
  }

  or(expr) {
    return this;
  }

  order(field, { ascending = true } = {}) {
    this.sortField = field;
    this.ascending = ascending;
    return this;
  }

  range(from, to) {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }

  limit(n) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  _enrichRelations(item) {
    const enriched = { ...item };
    const store = loadLocalStore();
    if (this.table === 'appointments') {
      if (item.patient_id) {
        enriched.patient = store.patients?.find((p) => p.id === item.patient_id) || null;
      }
      if (item.doctor_id) {
        enriched.doctor = store.doctors?.find((d) => d.id === item.doctor_id) || null;
      }
    } else if (this.table === 'reports') {
      if (item.patient_id) {
        enriched.patient = store.patients?.find((p) => p.id === item.patient_id) || null;
      }
    } else if (this.table === 'feedback') {
      if (item.appointment_id) {
        enriched.appointment = store.appointments?.find((a) => a.id === item.appointment_id) || null;
      }
      if (item.patient_id) {
        enriched.patient = store.patients?.find((p) => p.id === item.patient_id) || null;
      }
    }
    return enriched;
  }

  async _executeGet() {
    const store = loadLocalStore();
    let rows = store[this.table] || [];

    for (const f of this.filters) {
      rows = rows.filter(f);
    }

    const totalCount = rows.length;

    if (this.sortField) {
      rows = [...rows].sort((a, b) => {
        let valA = a[this.sortField];
        let valB = b[this.sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return this.ascending ? -1 : 1;
        if (valA > valB) return this.ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.offsetCount !== null) {
      rows = rows.slice(this.offsetCount);
    }
    if (this.limitCount !== null) {
      rows = rows.slice(0, this.limitCount);
    }

    const enrichedRows = rows.map((r) => this._enrichRelations(r));

    if (this.isSingle) {
      const data = enrichedRows[0] || null;
      return { data, error: data ? null : { message: 'Row not found' }, count: totalCount };
    }

    return { data: enrichedRows, error: null, count: totalCount };
  }

  // Then handler for async/await resolution
  then(resolve, reject) {
    if (this.pendingUpdates) {
      this._executeUpdate().then(resolve, reject);
    } else if (this.pendingDelete) {
      this._executeDelete().then(resolve, reject);
    } else {
      this._executeGet().then(resolve, reject);
    }
  }

  async insert(rows) {
    const store = loadLocalStore();
    if (!store[this.table]) store[this.table] = [];

    const isArray = Array.isArray(rows);
    const toInsert = isArray ? rows : [rows];
    const inserted = [];

    for (const row of toInsert) {
      // Check double-booking constraint for appointments: unique doctor_id + slot_time window where status != 'cancelled'
      if (this.table === 'appointments') {
        const conflict = store.appointments.find(
          (a) => a.doctor_id === row.doctor_id &&
                 Math.abs(new Date(a.slot_time).getTime() - new Date(row.slot_time).getTime()) < 30 * 60 * 1000 &&
                 a.status !== 'cancelled'
        );
        if (conflict) {
          return { data: null, error: { message: 'Double-booking conflict: Doctor already has an active appointment at or near this slot.', code: '23505' } };
        }
      }

      // Check unique phone for patients
      if (this.table === 'patients' && row.phone) {
        const existing = store.patients.find((p) => p.phone === row.phone);
        if (existing) {
          Object.assign(existing, row, { updated_at: new Date().toISOString() });
          inserted.push(existing);
          continue;
        }
      }

      const id = typeof row.id !== 'undefined' ? row.id : (store[this.table].length > 0 ? Math.max(...store[this.table].map((r) => Number(r.id) || 0)) + 1 : 1);
      const newRecord = {
        ...row,
        id,
        created_at: row.created_at || new Date().toISOString(),
      };
      store[this.table].push(newRecord);
      inserted.push(newRecord);
    }

    saveLocalStore();
    return { data: isArray ? inserted : inserted[0], error: null };
  }

  update(updates) {
    this.pendingUpdates = updates;
    return this;
  }

  async _executeUpdate() {
    const updates = this.pendingUpdates || {};
    const store = loadLocalStore();
    if (!store[this.table]) return { data: [], error: null };

    // Check double-booking constraint if slot_time or doctor_id is updated for appointments
    if (this.table === 'appointments' && (updates.slot_time || updates.doctor_id)) {
      for (const item of store.appointments) {
        if (this.filters.every((f) => f(item))) {
          const doctorId = updates.doctor_id || item.doctor_id;
          const slotTime = updates.slot_time || item.slot_time;
          const conflict = store.appointments.find(
            (a) => a.id !== item.id &&
                   a.doctor_id === doctorId &&
                   Math.abs(new Date(a.slot_time).getTime() - new Date(slotTime).getTime()) < 30 * 60 * 1000 &&
                   a.status !== 'cancelled'
          );
          if (conflict) {
            return { data: null, error: { message: 'Double-booking conflict on update: Target slot is already booked.', code: '23505' } };
          }
        }
      }
    }

    const updated = [];
    store[this.table] = store[this.table].map((item) => {
      const match = this.filters.every((f) => f(item));
      if (match) {
        const merged = { ...item, ...updates, updated_at: new Date().toISOString() };
        updated.push(merged);
        return merged;
      }
      return item;
    });

    saveLocalStore();
    return { data: this.isSingle ? updated[0] : updated, error: null };
  }

  delete() {
    this.pendingDelete = true;
    return this;
  }

  async _executeDelete() {
    const store = loadLocalStore();
    if (!store[this.table]) return { data: [], error: null };

    const deleted = [];
    store[this.table] = store[this.table].filter((item) => {
      const match = this.filters.every((f) => f(item));
      if (match) {
        deleted.push(item);
        return false;
      }
      return true;
    });

    saveLocalStore();
    return { data: deleted, error: null };
  }
}

// Database interface
const db = {
  from(table) {
    if (isSupabaseConfigured && supabase && isSupabaseOnline) {
      return supabase.from(table);
    }
    return new QueryBuilder(table);
  },
  isSupabaseConnected() {
    return isSupabaseConfigured && Boolean(supabase) && isSupabaseOnline;
  },
  getDb() {
    return db;
  },
  resetLocalStore() {
    localStore = getDefaultData();
    saveLocalStore();
    return localStore;
  }
};

module.exports = db;
