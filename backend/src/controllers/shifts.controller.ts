import { Request, Response } from 'express';
import { query } from '../config/db';

export const getShifts = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM duty_shifts ORDER BY order_index ASC');
    return res.json(result.rows);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch shifts', details: err.message });
  }
};
