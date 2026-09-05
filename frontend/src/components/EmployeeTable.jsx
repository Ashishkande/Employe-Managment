import React, { useState } from 'react';
import { Search, Filter, Camera, Edit2, Trash2, Mail, Building, ShieldCheck, User } from 'lucide-react';

export default function EmployeeTable({
  employees,
  searchTerm,
  setSearchTerm,
  selectedDepartment,
  setSelectedDepartment,
  onEdit,
  onDelete,
  onUploadPhoto
}) {
  const [deletingId, setDeletingId] = useState(null);

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = selectedDepartment ? emp.department === selectedDepartment : true;
    return matchesSearch && matchesDept;
  });

  const handleDeleteConfirm = (id) => {
    onDelete(id);
    setDeletingId(null);
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
      
      {/* Table Top Toolbar */}
      <div className="p-4 md:p-6 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by employee name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedDepartment('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              selectedDepartment === '' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All Departments
          </button>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDepartment(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedDepartment === dept 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

      </div>

      {/* Employees Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-6">Employee</th>
              <th className="py-3.5 px-6">Department & Role</th>
              <th className="py-3.5 px-6">Salary</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No employees found matching your criteria</p>
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors group">
                  
                  {/* Employee Name & Photo Avatar */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative group/avatar">
                        {emp.photo_url ? (
                          <img
                            src={emp.photo_url.startsWith('/') ? `/api${emp.photo_url}` : emp.photo_url}
                            alt={`${emp.first_name} ${emp.last_name}`}
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-blue-500/20"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-semibold ring-2 ring-slate-700">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                        )}
                        <button
                          onClick={() => onUploadPhoto(emp)}
                          title="Upload S3 Photo"
                          className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm group-hover:text-blue-400 transition-colors">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-slate-400 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" />
                          {emp.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department & Role */}
                  <td className="py-4 px-6">
                    <div className="space-y-0.5">
                      <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                        <Building className="w-3 h-3 text-indigo-400" />
                        {emp.department}
                      </span>
                      <p className="text-slate-400 text-xs">{emp.role}</p>
                    </div>
                  </td>

                  {/* Salary */}
                  <td className="py-4 px-6 font-mono text-slate-200">
                    ${emp.salary ? emp.salary.toLocaleString() : '0'}
                  </td>

                  {/* Status Pill */}
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      emp.status === 'Active' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : emp.status === 'On Leave'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        emp.status === 'Active' ? 'bg-emerald-400' : emp.status === 'On Leave' ? 'bg-amber-400' : 'bg-rose-400'
                      }`}></span>
                      {emp.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    {deletingId === emp.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-rose-400 font-medium">Confirm?</span>
                        <button
                          onClick={() => handleDeleteConfirm(emp.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-500"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs hover:bg-slate-700"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onUploadPhoto(emp)}
                          title="Upload S3 Photo"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 hover:text-blue-400 text-slate-400 transition-colors"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(emp)}
                          title="Edit Employee"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 hover:text-indigo-400 text-slate-400 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingId(emp.id)}
                          title="Delete Employee"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
