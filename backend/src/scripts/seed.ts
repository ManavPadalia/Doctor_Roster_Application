import { pool } from '../config/db';
import * as fs from 'fs';
import * as path from 'path';

async function seed() {
  console.log('🌱 Starting database initialization and seeding...');
  const client = await pool.connect();
  try {
    // 1. Read and execute schema.sql to ensure tables exist
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    console.log(`Reading database schema from: ${schemaPath}`);
    
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      console.log('Executing schema.sql queries...');
      await client.query(schemaSql);
      console.log('Schema tables and indexes verified/created.');
    } else {
      console.warn('⚠️ Warning: schema.sql file not found. Skipping auto-schema creation.');
    }

    await client.query('BEGIN');

    // 2. Create standard shifts
    console.log('Inserting standard duty shifts...');
    await client.query(`
      INSERT INTO duty_shifts (id, name, start_time, end_time, order_index) VALUES
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning', '08:00:00', '16:00:00', 1),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Evening', '16:00:00', '23:59:59', 2),
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Night', '00:00:00', '08:00:00', 3)
      ON CONFLICT (name) DO UPDATE SET
          start_time = EXCLUDED.start_time,
          end_time = EXCLUDED.end_time,
          order_index = EXCLUDED.order_index;
    `);

    // 3. Create standard doctors
    console.log('Inserting sample doctors...');
    await client.query(`
      INSERT INTO doctors (id, name, specialty, phone, email, is_active, color) VALUES
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'Dr. Sarah Connor', 'Cardiology', '+1-555-0101', 'sarah.connor@hospital.com', true, '#EF4444'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'Dr. John Watson', 'General Medicine', '+1-555-0102', 'john.watson@hospital.com', true, '#3B82F6'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'Dr. Gregory House', 'Diagnostics', '+1-555-0103', 'gregory.house@hospital.com', true, '#10B981'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04', 'Dr. Meredith Grey', 'General Surgery', '+1-555-0104', 'meredith.grey@hospital.com', true, '#F59E0B'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05', 'Dr. Stephen Strange', 'Neurosurgery', '+1-555-0105', 'stephen.strange@hospital.com', true, '#8B5CF6'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06', 'Dr. Doogie Howser', 'Pediatrics', '+1-555-0106', 'doogie.howser@hospital.com', true, '#EC4899'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07', 'Dr. Michaela Quinn', 'Family Medicine', '+1-555-0107', 'michaela.quinn@hospital.com', true, '#14B8A6'),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08', 'Dr. Christian Troy', 'Plastic Surgery', '+1-555-0108', 'christian.troy@hospital.com', true, '#6B7280')
      ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          specialty = EXCLUDED.specialty,
          phone = EXCLUDED.phone,
          is_active = EXCLUDED.is_active,
          color = EXCLUDED.color;
    `);

    await client.query('COMMIT');
    console.log('🎉 Database initialization and seeding completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Database initialization/seeding failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
