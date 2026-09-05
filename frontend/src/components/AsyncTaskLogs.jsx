import React from 'react';
import { Activity, Clock, CheckCircle, Cpu, RefreshCw } from 'lucide-react';

export default function AsyncTaskLogs({ logs, onRefresh }) {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-semibold rounded-full">
              AWS SQS & Background Worker Queue
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Asynchronous Task Audit Stream</h2>
          <p className="text-xs text-slate-400">Decoupled photo thumbnailing and corporate audit logs processed off-main thread.</p>
        </div>

        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
          Refresh Logs
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No background tasks logged yet. Upload a photo or modify an employee to trigger async events!
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.task_id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20 mt-0.5">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-purple-400 font-semibold">{log.task_id}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                      {log.event_type}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-850 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 shrink-0 font-mono self-end md:self-center">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {new Date(log.timestamp).toLocaleTimeString()}
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-sans font-semibold text-[10px]">
                  {log.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
