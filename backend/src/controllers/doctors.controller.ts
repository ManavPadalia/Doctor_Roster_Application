import { Request, Response } from 'express';
import { z } from 'zod';
import { query } from '../config/db';

const DoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  specialty: z.string().min(2, 'Specialty must be at least 2 characters'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address'),
  is_active: z.boolean().default(true),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color code').default('#3B82F6')
});

export const getDoctors = async (req: Request, res: Response) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let sql = 'SELECT * FROM doctors';
    const params: any[] = [];

    if (search) {
      sql += ' WHERE name ILIKE $1 OR specialty ILIKE $1 OR email ILIKE $1';
      params.push(search);
    }

    sql += ' ORDER BY name ASC';
    const result = await query(sql, params);
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch doctors', details: err.message });
  }
};

export const createDoctor = async (req: Request, res: Response) => {
  try {
    const parsed = DoctorSchema.parse(req.body);
    
    // Check if email already exists
    const emailCheck = await query('SELECT id FROM doctors WHERE email = $1', [parsed.email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Doctor with this email already exists' });
    }

    const sql = `
      INSERT INTO doctors (name, specialty, phone, email, is_active, color)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await query(sql, [
      parsed.name,
      parsed.specialty,
      parsed.phone || null,
      parsed.email,
      parsed.is_active,
      parsed.color
    ]);

    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to create doctor', details: err.message });
  }
};

export const updateDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = DoctorSchema.parse(req.body);

    // Check if email already exists for another doctor
    const emailCheck = await query('SELECT id FROM doctors WHERE email = $1 AND id != $2', [parsed.email, id]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Another doctor with this email already exists' });
    }

    const sql = `
      UPDATE doctors
      SET name = $1, specialty = $2, phone = $3, email = $4, is_active = $5, color = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await query(sql, [
      parsed.name,
      parsed.specialty,
      parsed.phone || null,
      parsed.email,
      parsed.is_active,
      parsed.color,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json(result.rows[0]);
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    return res.status(500).json({ error: 'Failed to update doctor', details: err.message });
  }
};

export const deleteDoctor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM doctors WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json({ message: 'Doctor deleted successfully', doctor: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete doctor', details: err.message });
  }
};
