import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Trash2, Mail, Phone, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { api } from '../lib/api';
import { Doctor } from '../types';

export const Doctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F43F5E', 
    '#06B6D4', '#84CC16', '#6366F1', '#A855F7'
  ];

  const fetchDoctors = async (queryStr?: string) => {
    setLoading(true);
    try {
      const data = await api.getDoctors(queryStr);
      setDoctors(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDoctors(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const openAddModal = () => {
    setEditingDoctor(null);
    setName('');
    setSpecialty('');
    setEmail('');
    setPhone('');
    setColor('#3B82F6');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setName(doctor.name);
    setSpecialty(doctor.specialty);
    setEmail(doctor.email);
    setPhone(doctor.phone || '');
    setColor(doctor.color);
    setIsActive(doctor.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${docName}? This will permanently remove them from the database and any scheduled duties.`)) {
      return;
    }
    try {
      await api.deleteDoctor(id);
      setDoctors(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete doctor');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!name.trim() || !specialty.trim() || !email.trim()) {
      setFormError('Name, specialty, and email are required.');
      return;
    }

    const payload = {
      name: name.trim(),
      specialty: specialty.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      color,
      is_active: isActive
    };

    setIsSaving(true);
    try {
      if (editingDoctor) {
        const updated = await api.updateDoctor(editingDoctor.id, payload);
        setDoctors(prev => prev.map(d => d.id === editingDoctor.id ? updated : d));
      } else {
        const created = await api.createDoctor(payload);
        setDoctors(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error saving doctor details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Header Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Doctor Directory
          </h2>
          <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
            Add, update, or search active duty physicians
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>

          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary/95 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Doctor
          </button>
        </div>
      </div>

      {/* Grid List */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold border border-red-100 dark:border-red-900/40">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="min-h-[300px] border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-8 space-y-3">
          <p className="text-sm font-bold text-slate-500">No Doctors Found</p>
          <p className="text-xs text-slate-400 max-w-xs">
            Try adjusting your search criteria or add a new doctor using the "Add Doctor" button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map(doctor => (
            <div 
              key={doctor.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                doctor.is_active ? 'border-slate-200 dark:border-slate-800' : 'border-slate-200/50 dark:border-slate-800/40 opacity-70'
              }`}
            >
              {/* Doctor Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: doctor.color }} />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: doctor.color }}
                    >
                      {doctor.name.split(' ').pop()?.slice(0, 2).toUpperCase() || 'DR'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-slate-50 text-base">{doctor.name}</h3>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md mt-0.5 inline-block">
                        {doctor.specialty}
                      </span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    doctor.is_active 
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                      : 'bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400'
                  }`}>
                    {doctor.is_active ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                    {doctor.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span>{doctor.phone || 'No phone recorded'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-5">
                <button
                  onClick={() => openEditModal(doctor)}
                  className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Edit details"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(doctor.id, doctor.name)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Delete doctor"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {editingDoctor ? 'Edit Doctor Details' : 'Add New Doctor'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg border border-red-100 dark:border-red-900/40">
                  {formError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                />
              </div>

              {/* Specialty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Specialty
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pediatrics"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all font-semibold"
                />
              </div>

              {/* Color Code */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Calendar Color Chip
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? 'border-slate-900 scale-110 shadow dark:border-white' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Active Checkbox */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="isActive" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider select-none">
                  Available for Duties (Active)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 text-sm font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/95 px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Doctor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
