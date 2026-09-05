import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import EmployeeTable from './components/EmployeeTable';
import EmployeeModal from './components/EmployeeModal';
import PhotoUploadModal from './components/PhotoUploadModal';
import ArchitectureView from './components/ArchitectureView';
import AsyncTaskLogs from './components/AsyncTaskLogs';
import { AlertCircle, CheckCircle, RefreshCw, ServerOff } from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'architecture', 'tasks'
  const [employees, setEmployees] = useState([]);
  const [health, setHealth] = useState(null);
  const [asyncLogs, setAsyncLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Filters & Modals state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [uploadEmployee, setUploadEmployee] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchHealth = async () => {
    try {
      const res = await axios.get(`${API_BASE}/health`);
      setHealth(res.data);
    } catch (err) {
      setHealth({ status: 'unhealthy', database: 'disconnected', storage_mode: 'local', sqs_status: 'disabled' });
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/employees`);
      setEmployees(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to FastAPI backend server. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAsyncLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/employees/async-tasks/logs`);
      setAsyncLogs(res.data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch task logs:", err);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchEmployees();
    fetchAsyncLogs();
    
    // Poll health and logs every 10 seconds
    const interval = setInterval(() => {
      fetchHealth();
      fetchAsyncLogs();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // CRUD Handlers
  const handleSaveEmployee = async (formData) => {
    try {
      if (editingEmployee) {
        // PUT /employees/{id}
        const res = await axios.put(`${API_BASE}/employees/${editingEmployee.id}`, formData);
        setEmployees(employees.map(e => e.id === editingEmployee.id ? res.data : e));
        showToast(`Successfully updated ${res.data.first_name} ${res.data.last_name}`);
      } else {
        // POST /employees
        const res = await axios.post(`${API_BASE}/employees`, formData);
        setEmployees([res.data, ...employees]);
        showToast(`Successfully added ${res.data.first_name} ${res.data.last_name}`);
      }
      setIsEmployeeModalOpen(false);
      setEditingEmployee(null);
      fetchAsyncLogs();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error saving employee details.', 'error');
    }
  };

  const handleDeleteEmployee = async (id) => {
    try {
      await axios.delete(`${API_BASE}/employees/${id}`);
      setEmployees(employees.filter(e => e.id !== id));
      showToast('Employee record removed.', 'info');
      fetchAsyncLogs();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete employee.', 'error');
    }
  };

  const handleUploadPhoto = async (employeeId, file) => {
    const data = new FormData();
    data.append('file', file);

    // POST /employees/{id}/photo
    const res = await axios.post(`${API_BASE}/employees/${employeeId}/photo`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // Refresh local employee photo state
    setEmployees(employees.map(e => e.id === employeeId ? { ...e, photo_url: res.data.photo_url } : e));
    fetchAsyncLogs();
    return res.data;
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-semibold ${
            toast.type === 'error' 
              ? 'bg-rose-950/90 border-rose-600 text-rose-200' 
              : toast.type === 'info'
              ? 'bg-amber-950/90 border-amber-600 text-amber-200'
              : 'bg-emerald-950/90 border-emerald-600 text-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        health={health}
        onOpenCreateModal={() => {
          setEditingEmployee(null);
          setIsEmployeeModalOpen(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8">
        
        {error ? (
          <div className="glass-card p-12 rounded-3xl text-center border border-rose-500/20 max-w-lg mx-auto my-12 space-y-4">
            <ServerOff className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-lg font-bold text-white">Backend Server Unavailable</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <button
              onClick={fetchEmployees}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reconnect API
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'employees' && (
              <>
                <StatsOverview employees={employees} health={health} />
                <EmployeeTable
                  employees={employees}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedDepartment={selectedDepartment}
                  setSelectedDepartment={setSelectedDepartment}
                  onEdit={(emp) => {
                    setEditingEmployee(emp);
                    setIsEmployeeModalOpen(true);
                  }}
                  onDelete={handleDeleteEmployee}
                  onUploadPhoto={(emp) => {
                    setUploadEmployee(emp);
                    setIsPhotoModalOpen(true);
                  }}
                />
              </>
            )}

            {activeTab === 'architecture' && (
              <ArchitectureView />
            )}

            {activeTab === 'tasks' && (
              <AsyncTaskLogs logs={asyncLogs} onRefresh={fetchAsyncLogs} />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
      />

      <PhotoUploadModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        employee={uploadEmployee}
        onUpload={handleUploadPhoto}
      />

    </div>
  );
}
