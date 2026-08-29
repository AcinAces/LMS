'use client';

import { useState, useMemo } from 'react';

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
  searchPlaceholder?: string;
}

export default function DataTable<T extends { id?: number; documentId?: string }>({
  title,
  columns,
  data,
  onAdd,
  onEdit,
  onDelete,
  addLabel = 'Add New',
  searchPlaceholder = 'Search records...'
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row => {
      return Object.values(row as any).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') {
          return Object.values(val).some(nested => 
            String(nested).toLowerCase().includes(q)
          );
        }
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [data, search]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-fade-in-up space-y-0">
      
      {/* Table Toolbar Header */}
      <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-slate-900/80">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/5 text-slate-400 border border-white/10">
            {filteredData.length} {filteredData.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Filter */}
          <div className="relative min-w-[220px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-white"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Add Button */}
          {onAdd && (
            <button 
              onClick={onAdd}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{addLabel}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/60 border-b border-white/10">
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
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="p-12 text-center text-slate-500 italic">
                  {search ? 'No records match your search filter.' : 'No records found.'}
                </td>
              </tr>
            ) : (
              filteredData.map((row, i) => (
                <tr key={row.documentId || row.id || i} className="hover:bg-slate-800/40 transition-colors group">
                  {columns.map(col => (
                    <td key={col.key} className="p-4 px-6 text-sm text-slate-300">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="p-4 px-6 text-right space-x-2 whitespace-nowrap">
                      {onEdit && (
                        <button 
                          onClick={() => onEdit(row)}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={() => onDelete(row)}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-semibold transition-all hover:scale-105 cursor-pointer"
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
