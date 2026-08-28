'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type FormField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'password';
  options?: { value: string | number; label: string }[];
  required?: boolean;
};

interface DynamicFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  title: string;
  fields: FormField[];
  initialData?: any;
  onChange?: (newData: any, setFormData: React.Dispatch<React.SetStateAction<any>>) => void;
}

export default function DynamicFormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  onChange
}: DynamicFormModalProps) {
  const [formData, setFormData] = useState<any>({});
  
  const handleFieldChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    if (onChange) {
      onChange(newData, setFormData);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setError('');
    }
  }, [isOpen, initialData]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {field.label} {field.required && <span className="text-red-400">*</span>}
              </label>
              
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  rows={4}
                  value={formData[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  <option value="">Select an option</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'boolean' ? (
                <input
                  type="checkbox"
                  checked={!!formData[field.key]}
                  onChange={e => handleFieldChange(field.key, e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-black/50 border-white/10"
                />
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                  required={field.required}
                  value={formData[field.key] || ''}
                  onChange={e => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0 bg-gray-900 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
