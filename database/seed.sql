-- Seed data for Monthly Duty Doctor Roster Application

-- 1. Insert standard duty shifts
INSERT INTO duty_shifts (id, name, start_time, end_time, order_index) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Morning', '08:00:00', '16:00:00', 1),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Evening', '16:00:00', '23:59:59', 2),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Night', '00:00:00', '08:00:00', 3)
ON CONFLICT (name) DO UPDATE SET
    start_time = EXCLUDED.start_time,
    end_time = EXCLUDED.end_time,
    order_index = EXCLUDED.order_index;

-- 2. Insert sample doctors
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
