import { Doctor, DutyShift, RosterEntry } from '../types';

const API_BASE = '/api';

// Helper to get authorization headers
const getHeaders = () => {
  const token = localStorage.getItem('roster_auth_token') || 'dev-token';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

export const api = {
  // Doctors CRUD
  async getDoctors(search?: string): Promise<Doctor[]> {
    const url = search ? `${API_BASE}/doctors?search=${encodeURIComponent(search)}` : `${API_BASE}/doctors`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch doctors');
    return res.json();
  },

  async createDoctor(doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const res = await fetch(`${API_BASE}/doctors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(doctor),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create doctor');
    }
    return res.json();
  },

  async updateDoctor(id: string, doctor: Omit<Doctor, 'id'>): Promise<Doctor> {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(doctor),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update doctor');
    }
    return res.json();
  },

  async deleteDoctor(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete doctor');
  },

  // Shifts
  async getShifts(): Promise<DutyShift[]> {
    const res = await fetch(`${API_BASE}/shifts`);
    if (!res.ok) throw new Error('Failed to fetch shifts');
    return res.json();
  },

  // Roster Operations
  async getRoster(month: string): Promise<RosterEntry[]> {
    const res = await fetch(`${API_BASE}/roster?month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch roster');
    return res.json();
  },

  async generateRoster(month: string): Promise<RosterEntry[]> {
    const res = await fetch(`${API_BASE}/roster/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ month }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate roster');
    }
    const data = await res.json();
    return data.roster;
  },

  async overrideShift(params: {
    month_year: string;
    day: number;
    shift_id: string;
    doctor_id: string;
    override_reason: string;
  }): Promise<RosterEntry> {
    const res = await fetch(`${API_BASE}/roster/override`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply override');
    }
    const data = await res.json();
    return data.entry;
  },

  // Export URL helper
  getExportUrl(month: string): string {
    return `${API_BASE}/roster/export/csv?month=${month}`;
  }
};
