import React from 'react';
import { Activity, Users, Calendar, CreditCard } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Rotana Clinic Management</h1>
          <p className="text-sm text-slate-500">Clinical Management & Real-time KHQR Bridge</p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            System Operational
          </span>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Today Visits</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
          <p className="text-xs text-slate-500 mt-1">Scheduled appointments</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Waiting Queue</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
          <p className="text-xs text-slate-500 mt-1">Patients checked in</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">In Consultation</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">0</div>
          <p className="text-xs text-slate-500 mt-1">Active doctor sessions</p>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-sm font-medium">Settled Revenue</span>
            <CreditCard className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">$0.00</div>
          <p className="text-xs text-slate-500 mt-1">Verified via KHQR</p>
        </div>
      </section>
    </main>
  );
}
