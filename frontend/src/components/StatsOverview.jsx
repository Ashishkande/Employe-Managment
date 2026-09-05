import React from 'react';
import { Users, UserCheck, Building2, DollarSign, CloudLightning } from 'lucide-react';

export default function StatsOverview({ employees, health }) {
  const total = employees.length;
  const activeCount = employees.filter(e => e.status === 'Active').length;
  const departments = new Set(employees.map(e => e.department)).size;
  
  const avgSalary = total > 0 
    ? Math.round(employees.reduce((acc, curr) => acc + (curr.salary || 0), 0) / total)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {/* Total Employees */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Total Staff</p>
          <p className="text-2xl font-bold text-white">{total}</p>
        </div>
      </div>

      {/* Active Employees */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Active Status</p>
          <p className="text-2xl font-bold text-white">{activeCount}</p>
        </div>
      </div>

      {/* Departments */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Departments</p>
          <p className="text-2xl font-bold text-white">{departments}</p>
        </div>
      </div>

      {/* Avg Salary */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <DollarSign className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Avg Compensation</p>
          <p className="text-2xl font-bold text-white">${avgSalary.toLocaleString()}</p>
        </div>
      </div>

      {/* AWS Storage & SQS Status */}
      <div className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <CloudLightning className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Storage / SQS</p>
          <p className="text-sm font-semibold text-white capitalize">
            {health?.storage_mode || 'Local'} / {health?.sqs_status || 'Active'}
          </p>
        </div>
      </div>
    </div>
  );
}
