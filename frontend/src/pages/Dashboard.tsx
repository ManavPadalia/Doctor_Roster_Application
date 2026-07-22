import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileDown, RotateCw, AlertTriangle, CalendarRange, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { Doctor, DutyShift, RosterEntry } from '../types';
import { OverrideModal } from '../components/OverrideModal';

export const Dashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [shifts, setShifts] = useState<DutyShift[]>([]);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modal State
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const [rosterData, doctorsData, shiftsData] = await Promise.all([
        api.getRoster(monthYear),
        api.getDoctors(),
        api.getShifts()
      ]);
      setRoster(rosterData);
      setDoctors(doctorsData);
      setShifts(shiftsData);
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to fetch roster details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [monthYear]);

  // Actions
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleGenerateRoster = async () => {
    if (!window.confirm(`Are you sure you want to generate (or regenerate) the base roster for ${monthYear}? Existing manual overrides will be PRESERVED, but other assignments will be replaced.`)) {
      return;
    }
    setActionMessage({ text: 'Generating fair roster rotation...', type: 'info' });
    try {
      const newRoster = await api.generateRoster(monthYear);
      setRoster(newRoster);
      setActionMessage({ text: 'Roster generated successfully!', type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to generate roster', type: 'error' });
    }
  };

  const handleOverrideSubmit = async (params: {
    shift_id: string;
    doctor_id: string;
    override_reason: string;
  }) => {
    if (selectedDay === null) return;
    try {
      const updatedEntry = await api.overrideShift({
        month_year: monthYear,
        day: selectedDay,
        shift_id: params.shift_id,
        doctor_id: params.doctor_id,
        override_reason: params.override_reason
      });

      // Update local state
      setRoster(prev => {
        const index = prev.findIndex(
          e => e.month_year === monthYear && e.day === selectedDay && e.shift_id === params.shift_id
        );
        if (index > -1) {
          const next = [...prev];
          next[index] = updatedEntry;
          return next;
        }
        return [...prev, updatedEntry];
      });

      setActionMessage({ text: 'Override applied successfully!', type: 'success' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to apply override', type: 'error' });
      throw err;
    }
  };

  // Calendar Math
  const getDaysInMonth = () => {
    return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfWeek = () => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });

  // Render Calendar Grid Helper
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfWeek();
    const cells = [];

    // Empty cells before start of month
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div 
          key={`empty-${i}`} 
          className="min-h-[120px] bg-slate-50/50 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/40 opacity-40"
        />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Find entries for this day
      const dayEntries = roster.filter(e => e.day === day);
      
      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => {
            setSelectedDay(day);
            setIsOverrideOpen(true);
          }}
          className="min-h-[130px] p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 cursor-pointer transition-all duration-150 flex flex-col group hover:shadow-md rounded-lg"
        >
          {/* Day number */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
              {day}
            </span>
            {dayEntries.some(e => e.is_override) && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
                <AlertTriangle className="w-2.5 h-2.5" />
                Override
              </span>
            )}
          </div>

          {/* Shifts display */}
          <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px] pr-0.5">
            {shifts.map(shift => {
              const entry = dayEntries.find(e => e.shift_id === shift.id);
              return (
                <div 
                  key={shift.id} 
                  className={`text-[10px] p-1 rounded border transition-colors flex items-center justify-between ${
                    entry 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/50' 
                      : 'bg-red-50/50 dark:bg-red-950/10 border-dashed border-red-200 dark:border-red-900/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span 
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry?.doctor_color || '#EF4444' }}
                    />
                    <span className="font-medium text-slate-500 dark:text-slate-400 truncate">
                      {shift.name.slice(0, 1)}:
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                      {entry ? entry.doctor_name.split(' ').pop() : 'Unassigned'}
                    </span>
                  </div>
                  {entry?.is_override && (
                    <span className="w-1 h-1 bg-amber-500 rounded-full flex-shrink-0" title={`Override: ${entry.override_reason}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6">
      
      {/* Messages */}
      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-semibold border flex items-center justify-between shadow-sm transition-all duration-300 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' :
          actionMessage.type === 'error' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/40' :
          'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
        }`}>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-current animate-ping" />
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-xs hover:underline uppercase font-bold tracking-wider"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header controls card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        
        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevMonth}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
          
          <div className="text-center sm:text-left">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-primary" />
              {monthName}
            </h2>
            <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
              Shift scheduling dashboard
            </p>
          </div>

          <button 
            onClick={handleNextMonth}
            className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Action button triggers */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleGenerateRoster}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all scale-100 active:scale-[0.98]"
          >
            <RotateCw className="h-4.5 w-4.5" />
            Generate Base
          </button>
          
          <a
            href={api.getExportUrl(monthYear)}
            download
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 transition-all"
          >
            <FileDown className="h-4.5 w-4.5" />
            Export CSV
          </a>
        </div>

      </div>

      {/* Roster Calendar Grid */}
      {loading ? (
        <div className="min-h-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-primary animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Loading monthly shift calendar...</span>
        </div>
      ) : roster.length === 0 ? (
        <div className="min-h-[400px] bg-slate-50 border border-dashed border-slate-300 dark:border-slate-800 dark:bg-slate-950/20 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full text-slate-400">
            <CalendarRange className="h-10 w-10" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Roster Generated Yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              There is no duty schedule for {monthName} yet. Click "Generate Base" to run the automated scheduler.
            </p>
          </div>
          <button
            onClick={handleGenerateRoster}
            className="bg-primary hover:bg-primary/95 text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all"
          >
            Auto-Generate Now
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 py-3 text-center">
            {daysOfWeek.map(d => (
              <span key={d} className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-px bg-slate-100 dark:bg-slate-800 p-px">
            {renderCalendar()}
          </div>
        </div>
      )}

      {/* Shift Legend / Info Card */}
      <div className="bg-slate-50 border border-slate-200/50 dark:bg-slate-900/30 dark:border-slate-800/80 rounded-2xl p-6 flex flex-wrap gap-6 items-center justify-between text-xs">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="font-bold text-slate-500 uppercase tracking-wider">Shift Types:</span>
          {shifts.map(s => (
            <div key={s.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border shadow-sm">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-bold text-slate-700 dark:text-slate-300">{s.name}</span>
              <span className="text-slate-400 font-medium">({s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)})</span>
            </div>
          ))}
        </div>
        <div className="text-slate-400 font-medium">
          💡 Click any day card to override assignments manually.
        </div>
      </div>

      {/* Override Modal */}
      {selectedDay !== null && (
        <OverrideModal
          isOpen={isOverrideOpen}
          onClose={() => {
            setIsOverrideOpen(false);
            setSelectedDay(null);
          }}
          day={selectedDay}
          monthYear={monthYear}
          shifts={shifts}
          doctors={doctors}
          entries={roster}
          onSubmit={handleOverrideSubmit}
        />
      )}

    </div>
  );
};
