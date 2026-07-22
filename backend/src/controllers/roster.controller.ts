import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { SchedulerService } from '../services/scheduler.service';
import { AuthenticatedRequest } from '../middleware/auth';

const RosterQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
});

const GenerateRosterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format')
});

const RosterOverrideSchema = z.object({
  month_year: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  day: z.number().int().min(1).max(31),
  shift_id: z.string().uuid(),
  doctor_id: z.string().uuid(),
  override_reason: z.string().min(1, 'Override reason is required')
});

export const getRoster = async (req: Request, res: Response) => {
  try {
    const parsed = RosterQuerySchema.parse(req.query);
    const monthYear = parsed.month;

    const sql = `
      SELECT r.id, r.month_year, r.day, r.doctor_id, r.shift_id, r.is_override, r.override_reason,
             d.name as doctor_name, d.color as doctor_color, d.specialty as doctor_specialty,
             s.name as shift_name, s.start_time, s.end_time
      FROM roster_entries r
      JOIN doctors d ON r.doctor_id = d.id
      JOIN duty_shifts s ON r.shift_id = s.id
      WHERE r.month_year = $1
      ORDER BY r.day ASC, s.order_index ASC
    `;
    const result = await query(sql, [monthYear]);
    return res.json(result.rows);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to fetch roster', details: err.message });
  }
};

export const generateRoster = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = GenerateRosterSchema.parse(req.body);
    const monthYear = parsed.month;
    const userId = req.user?.id;

    const roster = await SchedulerService.generateRoster(monthYear, userId);
    return res.json({ message: 'Roster generated successfully', roster });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to generate roster', details: err.message });
  }
};

export const overrideShift = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = RosterOverrideSchema.parse(req.body);
    const userId = req.user?.id;

    // Check if the doctor is active
    const doctorCheck = await query('SELECT is_active FROM doctors WHERE id = $1', [parsed.doctor_id]);
    if (doctorCheck.rows.length === 0 || !doctorCheck.rows[0].is_active) {
      return res.status(400).json({ error: 'Doctor not found or is currently inactive' });
    }

    // Insert or update override entry
    const sql = `
      INSERT INTO roster_entries (month_year, day, doctor_id, shift_id, is_override, override_reason, created_by)
      VALUES ($1, $2, $3, $4, true, $5, $6)
      ON CONFLICT (month_year, day, shift_id) 
      DO UPDATE SET 
        doctor_id = EXCLUDED.doctor_id,
        is_override = true,
        override_reason = EXCLUDED.override_reason,
        created_by = EXCLUDED.created_by
      RETURNING *
    `;

    const result = await query(sql, [
      parsed.month_year,
      parsed.day,
      parsed.doctor_id,
      parsed.shift_id,
      parsed.override_reason,
      userId || null
    ]);

    // Fetch full detail for the returned row
    const detailSql = `
      SELECT r.id, r.month_year, r.day, r.doctor_id, r.shift_id, r.is_override, r.override_reason,
             d.name as doctor_name, d.color as doctor_color, d.specialty as doctor_specialty,
             s.name as shift_name, s.start_time, s.end_time
      FROM roster_entries r
      JOIN doctors d ON r.doctor_id = d.id
      JOIN duty_shifts s ON r.shift_id = s.id
      WHERE r.id = $1
    `;
    const detailResult = await query(detailSql, [result.rows[0].id]);

    return res.json({ message: 'Override applied successfully', entry: detailResult.rows[0] });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to apply override', details: err.message });
  }
};

export const exportRosterCSV = async (req: Request, res: Response) => {
  try {
    const parsed = RosterQuerySchema.parse(req.query);
    const monthYear = parsed.month;

    const sql = `
      SELECT r.day, d.name as doctor_name, d.specialty as doctor_specialty,
             s.name as shift_name, s.start_time, s.end_time, r.is_override, r.override_reason
      FROM roster_entries r
      JOIN doctors d ON r.doctor_id = d.id
      JOIN duty_shifts s ON r.shift_id = s.id
      WHERE r.month_year = $1
      ORDER BY r.day ASC, s.order_index ASC
    `;
    const result = await query(sql, [monthYear]);
    const rows = result.rows;

    let csvContent = 'Day,Doctor,Specialty,Shift,Start Time,End Time,Is Override,Override Reason\n';
    
    rows.forEach((row) => {
      csvContent += `${row.day},"${row.doctor_name.replace(/"/g, '""')}","${row.doctor_specialty.replace(/"/g, '""')}","${row.shift_name}",${row.start_time},${row.end_time},${row.is_override ? 'YES' : 'NO'},"${(row.override_reason || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=roster_${monthYear}.csv`);
    return res.status(200).send(csvContent);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
};
