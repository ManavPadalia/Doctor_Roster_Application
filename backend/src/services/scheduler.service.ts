import { pool, query } from '../config/db';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  color: string;
  is_active: boolean;
}

interface Shift {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  order_index: number;
}

interface AssignedEntry {
  day: number;
  shift_id: string;
  doctor_id: string;
}

export class SchedulerService {
  /**
   * Generates a base roster for the specified month-year (YYYY-MM).
   * It fetches active doctors and shifts, then distributes shifts fairly.
   * Does NOT overwrite manual overrides.
   */
  static async generateRoster(monthYear: string, userId?: string): Promise<any[]> {
    // 1. Get days in the month
    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    // 2. Fetch active doctors
    const doctorsResult = await query(
      'SELECT id, name, specialty, color, is_active FROM doctors WHERE is_active = true'
    );
    const doctors: Doctor[] = doctorsResult.rows;

    if (doctors.length === 0) {
      throw new Error('No active doctors found in the database. Please add doctors first.');
    }

    // 3. Fetch duty shifts ordered by order_index
    const shiftsResult = await query(
      'SELECT id, name, start_time, end_time, order_index FROM duty_shifts ORDER BY order_index ASC'
    );
    const shifts: Shift[] = shiftsResult.rows;

    if (shifts.length === 0) {
      throw new Error('No duty shifts found in the database. Please initialize shifts first.');
    }

    // 4. Fetch existing manual overrides for this month to protect them
    const existingOverridesResult = await query(
      'SELECT day, shift_id, doctor_id, is_override, override_reason FROM roster_entries WHERE month_year = $1 AND is_override = true',
      [monthYear]
    );
    const overrides: Map<string, string> = new Map(); // key: "day-shiftId", value: doctorId
    const overrideReasons: Map<string, string> = new Map(); // key: "day-shiftId", value: reason
    
    existingOverridesResult.rows.forEach((row) => {
      overrides.set(`${row.day}-${row.shift_id}`, row.doctor_id);
      overrideReasons.set(`${row.day}-${row.shift_id}`, row.override_reason);
    });

    // 5. Build assignments
    // Keep track of assignments count per doctor for fairness
    const doctorAssignmentCounts = new Map<string, number>();
    doctors.forEach((doc) => doctorAssignmentCounts.set(doc.id, 0));

    // Keep track of when doctors were last assigned
    // We store the last day and shift order index they were assigned to
    const doctorLastAssigned = new Map<string, { day: number; orderIndex: number }>();

    const assignments: AssignedEntry[] = [];

    // First, register already existing overrides in our statistics to ensure scheduling remains fair
    overrides.forEach((doctorId, key) => {
      const [dayStr, shiftId] = key.split('-');
      const day = parseInt(dayStr, 10);
      const shift = shifts.find((s) => s.id === shiftId);
      
      doctorAssignmentCounts.set(doctorId, (doctorAssignmentCounts.get(doctorId) || 0) + 1);
      if (shift) {
        const last = doctorLastAssigned.get(doctorId);
        // Update if it's later than current record
        if (!last || day > last.day || (day === last.day && shift.order_index > last.orderIndex)) {
          doctorLastAssigned.set(doctorId, { day, orderIndex: shift.order_index });
        }
      }
    });

    // Run the scheduler day by day, shift by shift
    for (let day = 1; day <= daysInMonth; day++) {
      for (const shift of shifts) {
        const key = `${day}-${shift.id}`;

        // If this shift is manually overridden, keep it
        if (overrides.has(key)) {
          assignments.push({
            day,
            shift_id: shift.id,
            doctor_id: overrides.get(key)!,
          });
          continue;
        }

        // Find the best doctor for this shift using a scoring formula
        let bestDoctorId = '';
        let lowestScore = Infinity;

        for (const doctor of doctors) {
          const docId = doctor.id;
          const currentCount = doctorAssignmentCounts.get(docId) || 0;
          const lastAssignment = doctorLastAssigned.get(docId);

          let penalty = 0;

          if (lastAssignment) {
            // Calculate distance in shifts
            // Each day has shifts.length shifts
            const lastShiftRank = lastAssignment.day * shifts.length + lastAssignment.orderIndex;
            const currentShiftRank = day * shifts.length + shift.order_index;
            const distance = currentShiftRank - lastShiftRank;

            if (distance <= 0) {
              // Should not happen unless database entries are messed up, but check just in case
              penalty += 1000;
            } else if (distance === 1) {
              // Consecutive shifts (e.g. Morning after Night, or Evening after Morning) -> Extremely bad
              penalty += 500;
            } else if (distance === 2) {
              // Close shifts (e.g. Night after Morning) -> Highly discouraged
              penalty += 200;
            } else if (lastAssignment.day === day) {
              // Same day duty (double shift) -> Discouraged
              penalty += 150;
            }
          }

          // Score: prioritize doctors with fewer total assignments + apply constraints penalty
          // 10 * assignment_count + penalty
          const score = currentCount * 10 + penalty;

          if (score < lowestScore) {
            lowestScore = score;
            bestDoctorId = docId;
          }
        }

        // Assign the best candidate
        assignments.push({
          day,
          shift_id: shift.id,
          doctor_id: bestDoctorId,
        });

        // Update statistics
        doctorAssignmentCounts.set(bestDoctorId, (doctorAssignmentCounts.get(bestDoctorId) || 0) + 1);
        doctorLastAssigned.set(bestDoctorId, { day, orderIndex: shift.order_index });
      }
    }

    // 6. Persist to Database (Raw SQL queries with proper upsert)
    // We use a transaction to delete non-override entries first, then insert new assignments.
    const client = await poolConnect();
    try {
      await client.query('BEGIN');

      // Clear existing generated (non-override) entries for the month
      await client.query(
        'DELETE FROM roster_entries WHERE month_year = $1 AND is_override = false',
        [monthYear]
      );

      // Insert new roster entries
      for (const entry of assignments) {
        const isOverride = overrides.has(`${entry.day}-${entry.shift_id}`);
        const reason = isOverride ? overrideReasons.get(`${entry.day}-${entry.shift_id}`) : null;

        await client.query(
          `INSERT INTO roster_entries (month_year, day, doctor_id, shift_id, is_override, override_reason, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (month_year, day, shift_id) DO UPDATE 
           SET doctor_id = EXCLUDED.doctor_id,
               is_override = EXCLUDED.is_override,
               override_reason = EXCLUDED.override_reason,
               created_by = EXCLUDED.created_by`,
          [monthYear, entry.day, entry.doctor_id, entry.shift_id, isOverride, reason, userId || null]
        );
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    // Fetch the final generated roster to return
    const finalRoster = await query(
      `SELECT r.id, r.month_year, r.day, r.doctor_id, r.shift_id, r.is_override, r.override_reason,
              d.name as doctor_name, d.color as doctor_color, d.specialty as doctor_specialty,
              s.name as shift_name, s.start_time, s.end_time
       FROM roster_entries r
       JOIN doctors d ON r.doctor_id = d.id
       JOIN duty_shifts s ON r.shift_id = s.id
       WHERE r.month_year = $1
       ORDER BY r.day ASC, s.order_index ASC`,
      [monthYear]
    );

    return finalRoster.rows;
  }
}

// Helper to get connected client from Pool
async function poolConnect() {
  return await pool.connect();
}
