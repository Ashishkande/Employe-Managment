import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, AlertCircle, FileImage, Loader2, Cloud } from 'lucide-react';

export default function PhotoUploadModal({ isOpen, onClose, employee, onUpload }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, WebP).');
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
      setError('');
      setResult(null);
    } else {
      setError('Please drop a valid image file.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const res = await onUpload(employee.id, file);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload photo to S3.');
    } finally {
      setUploading(false);
    }
  };

  const handleModalClose = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Upload S3 Employee Photo</h3>
              <p className="text-xs text-slate-400">{employee.first_name} {employee.last_name}</p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result ? (
            <div className="space-y-4 text-center py-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Upload Successful!</h4>
                <p className="text-xs text-slate-400 mt-1">{result.message}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] space-y-1">
                <p className="text-slate-400"><span className="text-blue-400">Target S3 URL:</span> {result.photo_url}</p>
                <p className="text-slate-400"><span className="text-purple-400">SQS Task ID:</span> {result.task_id}</p>
              </div>
              <button
                onClick={handleModalClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-900/40 relative"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                
                {preview ? (
                  <div className="space-y-3">
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-28 w-28 mx-auto rounded-xl object-cover ring-4 ring-blue-500/30"
                    />
                    <p className="text-xs text-slate-300 font-medium">{file?.name}</p>
                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">Click or drag to change image</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="w-10 h-10 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Click to upload or drag & drop</p>
                      <p className="text-[11px] text-slate-500">Supports PNG, JPG, WebP up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !file}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                  file && !uploading 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading to S3 & Triggering SQS...
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    Upload Photo to AWS S3
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
