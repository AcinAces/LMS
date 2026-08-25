'use client';

import { useState } from 'react';

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

interface DataTableProps<T> {
  title: string;
  columns: ColumnDef<T>[];
  data: T[];
  onAdd?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  addLabel?: string;
}

export default function DataTable<T extends { id?: number; documentId?: string }>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Add New'
}: DataTableProps<T>) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-800/30">
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {addLabel}
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/40 border-b border-white/5">
              {columns.map(col => (
                <th key={col.key} className="p-4 px-6 text-xs uppercase tracking-wider font-bold text-slate-400">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="p-4 px-6 text-xs uppercase tracking-wider font-bold text-slate-400 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center text-slate-500 italic">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.documentId || row.id || i} className="hover:bg-slate-800/40 transition-colors group">
                  {columns.map(col => (
                    <td key={col.key} className="p-4 px-6 text-sm text-slate-300">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="p-4 px-6 text-right space-x-3 whitespace-nowrap opacity-50 group-hover:opacity-100 transition-opacity">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
