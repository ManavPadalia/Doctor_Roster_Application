import { Router } from 'express';
import { getDoctors, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctors.controller';
import { getRoster, generateRoster, overrideShift, exportRosterCSV } from '../controllers/roster.controller';
import { getShifts } from '../controllers/shifts.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Doctors CRUD
router.get('/doctors', getDoctors);
router.post('/doctors', requireAuth, createDoctor);
router.put('/doctors/:id', requireAuth, updateDoctor);
router.delete('/doctors/:id', requireAuth, deleteDoctor);

// Shifts
router.get('/shifts', getShifts);

// Roster operations
router.get('/roster', getRoster);
router.post('/roster/generate', requireAuth, generateRoster);
router.post('/roster/override', requireAuth, overrideShift);
router.get('/roster/export/csv', exportRosterCSV);

export default router;
