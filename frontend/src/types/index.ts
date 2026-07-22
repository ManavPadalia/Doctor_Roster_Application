export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  phone: string | null;
  email: string;
  is_active: boolean;
  color: string;
  created_at?: string;
}

export interface DutyShift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  order_index: number;
}

export interface RosterEntry {
  id: string;
  month_year: string;
  day: number;
  doctor_id: string;
  shift_id: string;
  is_override: boolean;
  override_reason: string | null;
  doctor_name: string;
  doctor_color: string;
  doctor_specialty: string;
  shift_name: string;
  start_time: string;
  end_time: string;
}
