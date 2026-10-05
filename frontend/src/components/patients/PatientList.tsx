'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Search, Plus, Phone, Calendar, ArrowRight, ShieldAlert, Loader2 } from 'lucide-react';
import { RegisterPatientDrawer } from './RegisterPatientDrawer';

export const PatientList: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const fetchPatients = async (query = '', pageNum = 1) => {
    setIsLoading(true);
    try {
      const res = await api.patients.list({ search: query, page: pageNum, limit: 15 });
      setPatients(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPatients(search, page);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handlePatientCreated = (newPatient: any) => {
    setPatients([newPatient, ...patients]);
    setTotal(total + 1);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Patient Registry</h1>
          <p className="text-xs text-slate-500">Search existing records or register a new clinical patient</p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by Patient ID, Name (EN/KH), or Phone number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-600 shadow-sm"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Loading patient registry...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm font-medium">No patient records found</p>
            <p className="text-xs text-slate-400 mt-1">Try another search term or click &quot;New Patient&quot; to register.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Patient Code</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Gender / Blood</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Allergies</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-semibold text-teal-800">
                      {p.patientCode}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{p.nameEn}</div>
                      {p.nameKh && <div className="text-xs text-slate-500 font-sans">{p.nameKh}</div>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {p.gender}
                        </span>
                        {p.bloodType && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-mono bg-rose-50 text-rose-700">
                            {p.bloodType}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{p.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {p.allergies && p.allergies.toLowerCase() !== 'none' ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded">
                          <ShieldAlert className="w-3 h-3 text-rose-600" />
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">None reported</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <a
                        href={`/patients/${p.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline"
                      >
                        <span>Patient 360</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>Showing {patients.length} of {total} registered patients</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={patients.length < 15}
              onClick={() => setPage(page + 1)}
              className="px-2.5 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <RegisterPatientDrawer
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onPatientCreated={handlePatientCreated}
      />
    </div>
  );
};
