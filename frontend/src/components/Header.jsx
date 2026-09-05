import React from 'react';
import { Users, Server, Cloud, Cpu, Plus, Activity } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, health, onOpenCreateModal }) {
  return (
    <header className="sticky top-0 z-30 glass-card border-b border-slate-800/80 mb-8 px-4 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">CloudStaff<span className="text-blue-400">Hub</span></h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                AWS ECS Fargate
              </span>
            </div>
            <p className="text-xs text-slate-400">Enterprise Employee Management API & AWS Cloud Architecture</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'employees' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Employees
          </button>
          
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'architecture' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            AWS Architecture
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'tasks' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            Async Queue Logs
          </button>
        </div>

        {/* Actions & Health Badge */}
        <div className="flex items-center gap-3">
          {/* Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs">
            <span className={`h-2 w-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-slate-300 font-medium capitalize">
              {health ? `API ${health.status}` : 'Connecting...'}
            </span>
          </div>

          {/* Add Employee Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Employee
          </button>
        </div>

      </div>
    </header>
  );
}
