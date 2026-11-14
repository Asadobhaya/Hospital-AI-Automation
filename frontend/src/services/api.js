const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config).catch((err) => {
    throw new Error('Cannot connect to backend API server at http://localhost:3001. Please ensure the backend is started.');
  });

  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/me') {
    if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/reports/view')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    let msg = errorData?.error?.message 
      || errorData?.message 
      || (typeof errorData?.error === 'string' ? errorData.error : null);
    
    if (!msg) {
      if (response.status === 500 || response.status === 502 || response.status === 504) {
        msg = 'Cannot reach backend server. Please make sure the backend is running on port 3001 (`npm start` in backend folder).';
      } else {
        msg = `HTTP ${response.status}: ${response.statusText || 'Failed to communicate with server'}`;
      }
    }
    throw new Error(msg);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Auth
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  me: () =>
    request('/auth/me'),
};

// Dashboard
export const dashboardAPI = {
  getSummary: () => request('/dashboard/summary'),
  getAppointmentTrend: () => request('/dashboard/appointment-trend'),
  getRecentErrors: () => request('/dashboard/recent-errors'),
  getVoiceCallSummary: () => request('/dashboard/voice-call-summary'),
};

// Appointments
export const appointmentsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/appointments${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/appointments/${id}`),
  create: (data) => request('/appointments', { method: 'POST', body: data }),
  update: (id, data) => request(`/appointments/${id}`, { method: 'PUT', body: data }),
  cancel: (id) => request(`/appointments/${id}/cancel`, { method: 'POST' }),
  reschedule: (id, data) => request(`/appointments/${id}/reschedule`, { method: 'POST', body: data }),
};

// Patients
export const patientsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/patients${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/patients/${id}`),
  getAppointments: (id) => request(`/patients/${id}/appointments`),
  getReports: (id) => request(`/patients/${id}/reports`),
  getFeedback: (id) => request(`/patients/${id}/feedback`),
};

// Doctors
export const doctorsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/doctors${qs ? `?${qs}` : ''}`);
  },
  getById: (id) => request(`/doctors/${id}`),
  create: (data) => request('/doctors', { method: 'POST', body: data }),
  update: (id, data) => request(`/doctors/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/doctors/${id}`, { method: 'DELETE' }),
};

// Departments
export const departmentsAPI = {
  list: () => request('/departments'),
  create: (data) => request('/departments', { method: 'POST', body: data }),
  update: (id, data) => request(`/departments/${id}`, { method: 'PUT', body: data }),
  delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
};

// Messages (WhatsApp)
export const messagesAPI = {
  conversations: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/messages/conversations${qs ? `?${qs}` : ''}`);
  },
  getMessages: (patientId) => request(`/messages/${patientId}`),
  getErrorLog: () => request('/messages/errors'),
};

// Voice Calls
export const callsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/calls${qs ? `?${qs}` : ''}`);
  },
  retry: (id) => request(`/calls/${id}/retry`, { method: 'POST' }),
};

// Reports
export const reportsAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },
  revoke: (id) => request(`/reports/${id}/revoke`, { method: 'POST' }),
};

// Feedback
export const feedbackAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/feedback${qs ? `?${qs}` : ''}`);
  },
  export: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    const qs = query.toString();
    return request(`/feedback/export${qs ? `?${qs}` : ''}`);
  },
};

// Settings
export const settingsAPI = {
  getIntegrations: () => request('/settings/integrations'),
  testConnection: (service) => request(`/settings/test/${service}`, { method: 'POST' }),
};
