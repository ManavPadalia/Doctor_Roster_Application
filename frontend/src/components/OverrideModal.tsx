import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Doctor, DutyShift, RosterEntry } from '../types';

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: number;
  monthYear: string;
  shifts: DutyShift[];
  doctors: Doctor[];
  entries: RosterEntry[];
  onSubmit: (params: {
    shift_id: string;
    doctor_id: string;
    override_reason: string;
  }) => Promise<void>;
}

export const OverrideModal: React.FC<OverrideModalProps> = ({
  isOpen,
  onClose,
  day,
  monthYear,
  shifts,
  doctors,
  entries,
  onSubmit
}) => {
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-select first shift when modal loads or day changes
  useEffect(() => {
    if (shifts.length > 0) {
      const firstShift = shifts[0].id;
      setSelectedShiftId(firstShift);
    }
  }, [shifts, day]);

  // When shift selection changes, find existing doctor assignment
  useEffect(() => {
    if (selectedShiftId) {
      const match = entries.find(e => e.day === day && e.shift_id === selectedShiftId);
      if (match) {
        setSelectedDoctorId(match.doctor_id);
        setReason(match.override_reason || '');
      } else {
        setSelectedDoctorId('');
        setReason('');
      }
      setError('');
    }
  }, [selectedShiftId, day, entries]);

  if (!isOpen) return null;

  const currentAssignment = entries.find(e => e.day === day && e.shift_id === selectedShiftId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId || !selectedDoctorId) {
      setError('Please select both a shift and a doctor.');
      return;
    }
    if (!reason.trim()) {
      setError('Please provide a reason for the manual override.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmit({
        shift_id: selectedShiftId,
        doctor_id: selectedDoctorId,
        override_reason: reason
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update roster entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMonthName = (my: string) => {
    const [y, m] = my.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Manual Override
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Day {day} • {getMonthName(monthYear)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900/50">
              <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shift Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Select Shift
            </label>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
            >
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})
                </option>
              ))}
            </select>
          </div>

          {/* Current Assignment Info */}
          {currentAssignment && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-800 text-xs space-y-1">
              <div className="text-slate-500 font-semibold uppercase tracking-wider">Currently Assigned:</div>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: currentAssignment.doctor_color }}
                />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {currentAssignment.doctor_name}
                </span>
                <span className="text-slate-500 font-medium">({currentAssignment.doctor_specialty})</span>
              </div>
              {currentAssignment.is_override && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  ⚠️ This is already an override: "{currentAssignment.override_reason}"
                </div>
              )}
            </div>
          )}

          {/* Doctor Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Assign Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id} disabled={!d.is_active}>
                  {d.name} ({d.specialty}) {!d.is_active ? '[INACTIVE]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Override Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide reason for this manual duty shift adjustment..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Apply Override'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
