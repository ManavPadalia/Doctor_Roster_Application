-- Schema for Monthly Duty Doctor Roster Application
-- PostgreSQL Dialect (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code for calendar visualization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for doctor searches
CREATE INDEX IF NOT EXISTS idx_doctors_active_name ON doctors(is_active, name);

-- Duty Shifts Table
CREATE TABLE IF NOT EXISTS duty_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Morning', 'Evening', 'Night'
    start_time TIME NOT NULL,          -- e.g., '08:00:00'
    end_time TIME NOT NULL,            -- e.g., '16:00:00'
    order_index INT NOT NULL UNIQUE,   -- Order in which they appear in a day (1, 2, 3)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roster Entries Table
CREATE TABLE IF NOT EXISTS roster_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(7) NOT NULL,    -- Format: 'YYYY-MM'
    day INT NOT NULL CHECK (day >= 1 AND day <= 31),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES duty_shifts(id) ON DELETE CASCADE,
    is_override BOOLEAN NOT NULL DEFAULT false,
    override_reason TEXT,
    created_by UUID, -- Can link to auth.users if Supabase Auth is used
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure only one assignment per day + shift
    CONSTRAINT unique_month_day_shift UNIQUE (month_year, day, shift_id)
);

-- Index for roster queries filtered by month
CREATE INDEX IF NOT EXISTS idx_roster_month_day ON roster_entries(month_year, day);
CREATE INDEX IF NOT EXISTS idx_roster_doctor ON roster_entries(doctor_id);
