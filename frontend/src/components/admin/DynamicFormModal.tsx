'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '@/context/ToastContext';
import PasswordRequirementsList from '@/components/PasswordRequirementsList';

export type FormField = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'password' | 'email';
  options?: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number | string;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  disabled?: boolean;
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
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {});
      setError('');
      setShowPasswords({});
    }
  }, [isOpen, initialData]);

  if (!isOpen || !mounted) return null;

  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      toast.success('Saved successfully!');
      onClose();
    } catch (err: any) {
      const errMsg = err.message || 'Something went wrong';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
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

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label className="block text-sm font-semibold text-gray-200">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
              </div>
              
              {field.type === 'textarea' ? (
                <textarea
                  required={field.required}
                  disabled={field.disabled}
                  rows={4}
                  placeholder={field.placeholder}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  value={formData[field.key] ?? ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
              ) : field.type === 'select' ? (
                <select
                  required={field.required}
                  disabled={field.disabled}
                  value={formData[field.key] ?? ''}
                  onChange={e => handleFieldChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none [&>option]:bg-gray-900 disabled:opacity-50"
                >
                  <option value="">{field.placeholder || 'Select an option...'}</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'boolean' ? (
                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id={field.key}
                    disabled={field.disabled}
                    checked={!!formData[field.key]}
                    onChange={e => handleFieldChange(field.key, e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-black/50 border-white/10 cursor-pointer"
                  />
                  <label htmlFor={field.key} className="text-sm text-gray-300 cursor-pointer select-none">
                    {field.placeholder || 'Enabled'}
                  </label>
                </div>
              ) : field.type === 'password' ? (
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showPasswords[field.key] ? 'text' : 'password'}
                      required={field.required}
                      disabled={field.disabled}
                      placeholder={field.placeholder}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                      value={formData[field.key] ?? ''}
                      onChange={e => handleFieldChange(field.key, e.target.value)}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title={showPasswords[field.key] ? 'Hide password' : 'Show password'}
                    >
                      {showPasswords[field.key] ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {formData[field.key] && (
                    <PasswordRequirementsList password={formData[field.key]} />
                  )}
                </div>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                  required={field.required}
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  minLength={field.minLength}
                  maxLength={field.maxLength}
                  pattern={field.pattern}
                  value={formData[field.key] ?? ''}
                  onKeyDown={e => {
                    if (field.type === 'number' && typeof field.min === 'number' && field.min >= 0) {
                      if (['-', '+', 'e', 'E'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }
                  }}
                  onChange={e => {
                    if (field.type === 'number') {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      handleFieldChange(field.key, val);
                    } else {
                      handleFieldChange(field.key, e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                />
              )}

              {field.hint && (
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{field.hint}</span>
                </p>
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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : 'Save'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
