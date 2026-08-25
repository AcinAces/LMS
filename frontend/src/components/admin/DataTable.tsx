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
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {onAdd && (
          <button 
            onClick={onAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            {addLabel}
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              {columns.map(col => (
                <th key={col.key} className="p-4 text-sm font-medium text-gray-400">
                  {col.label}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="p-4 text-sm font-medium text-gray-400 text-right">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={row.documentId || row.id || i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="p-4 text-sm text-gray-200">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="p-4 text-right space-x-3 whitespace-nowrap">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
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
