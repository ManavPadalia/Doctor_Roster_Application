import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: databaseUrl,
  // For production environments, configure SSL as needed
  ssl: databaseUrl?.includes('localhost') ? false : { rejectUnauthorized: false }
});

// Helper for raw queries
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};
