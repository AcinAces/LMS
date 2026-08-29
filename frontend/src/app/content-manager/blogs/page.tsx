'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import { useToast } from '@/context/ToastContext';

const TOPIC_HIERARCHY: Record<string, string[]> = {
  'Data Structure and Algorithms': ['Fundamentals', 'Maths & Recursion', 'Array & String'],
  'Web Development': ['Frontend Basics', 'Backend Development', 'DevOps'],
  'AI ML & Data Science': ['Machine Learning', 'Deep Learning', 'Data Analysis'],
  'Machine Learning': ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning'],
  'Python': ['Core Python', 'Django & Web', 'Data Science with Python'],
  'Java': ['Core Java', 'Spring Boot', 'Java Collections']
};

export default function ContentManagerBlogsPage() {
  const toast = useToast();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    subtopic: '',
    imgURL: '',
    body: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBlogs = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs?populate=*&pagination[limit]=1000`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setBlogs(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleTogglePublish = async (row: any) => {
    const jwt = localStorage.getItem('jwt');
    const isCurrentlyPublished = !!row.isPublished;
    const newStatus = !isCurrentlyPublished;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs/${row.documentId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}` 
        },
        body: JSON.stringify({ data: { isPublished: newStatus } })
      });
      if (!res.ok) throw new Error('Failed to change publish status');
      toast.success(`Blog "${row.title}" is now ${newStatus ? 'Published' : 'a Draft'}.`);
      fetchBlogs();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to change publish status');
    }
  };

  const columns: ColumnDef<any>[] = [
    { 
      key: 'imgURL', 
      label: 'Cover', 
      render: (row) => (
        row.imgURL ? (
          <div className="w-12 h-9 rounded-lg overflow-hidden border border-white/10 bg-slate-800 flex-shrink-0">
            <img src={row.imgURL} alt={row.title} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-9 rounded-lg bg-slate-800/80 border border-white/5 flex items-center justify-center text-[10px] text-gray-500 font-mono">
            No img
          </div>
        )
      )
    },
    { key: 'title', label: 'Title' },
    { key: 'topic', label: 'Topic', render: (row) => row.topic || 'N/A' },
    { key: 'subtopic', label: 'Subtopic', render: (row) => row.subtopic || 'N/A' },
    { key: 'isPublished', label: 'Published', render: (row) => (
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={!!row.isPublished}
          onChange={() => handleTogglePublish(row)}
        />
        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
      </label>
    )}
  ];

  const handleOpenModal = (row: any = null) => {
    setEditingData(row);
    if (row) {
      let b = row.body;
      if (Array.isArray(b)) {
         b = b.map((bk: any) => bk.children?.map((c: any) => c.text).join('')).join('\n');
      }
      setFormData({
        title: row.title || '',
        topic: row.topic || '',
        subtopic: row.subtopic || '',
        imgURL: row.imgURL || '',
        body: b || ''
      });
    } else {
      setFormData({ title: '', topic: '', subtopic: '', imgURL: '', body: '' });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleInsertMarkdownHelper = (template: string) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body ? `${prev.body}\n\n${template}` : template
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const payload = {
      data: {
        title: formData.title,
        topic: formData.topic,
        subtopic: formData.subtopic,
        imgURL: formData.imgURL.trim() || null,
        body: formData.body,
        ...(user.id ? { author: { connect: [user.documentId || user.id] } } : {}),
        ...(isEditing ? {} : { isPublished: false })
      }
    };

    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs/${editingData.documentId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs`;
      
    try {
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error?.message || 'Failed to save blog');
      
      toast.success(isEditing ? 'Blog updated successfully!' : 'Blog created successfully!');
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete blog "${row.title}"?`)) return;
    
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/blogs/${row.documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Failed to delete blog');
      toast.success(`Blog "${row.title}" deleted.`);
      fetchBlogs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete blog');
    }
  };

  if (loading) return <div>Loading blogs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Blogs</h1>
        <p className="text-gray-400">Write articles with custom cover pictures and markdown formatting. Toggle the switch to publish.</p>
      </div>

      <DataTable 
        title="Blog Posts"
        columns={columns}
        data={blogs}
        onAdd={() => handleOpenModal()}
        onEdit={(row) => handleOpenModal(row)}
        onDelete={handleDelete}
        addLabel="New Blog Post"
      />

      {isModalOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative my-8">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 rounded-t-2xl z-10">
              <h2 className="text-xl font-bold text-white">{editingData ? 'Edit Blog' : 'Create Blog'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[calc(85vh-8rem)] overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Topic <span className="text-red-400">*</span></label>
                  <select
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value, subtopic: '' })}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none [&>option]:bg-gray-900"
                  >
                    <option value="">Select a topic category...</option>
                    {Object.keys(TOPIC_HIERARCHY).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">Primary domain category</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-200">Subtopic <span className="text-red-400">*</span></label>
                  <select
                    required
                    disabled={!formData.topic}
                    value={formData.subtopic}
                    onChange={(e) => setFormData({ ...formData, subtopic: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none [&>option]:bg-gray-900 disabled:opacity-50"
                  >
                    <option value="">Select a subtopic module...</option>
                    {formData.topic && TOPIC_HIERARCHY[formData.topic]?.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400">Specific topic section</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-200">Blog Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  required
                  minLength={5}
                  maxLength={150}
                  placeholder="e.g. Mastering Graph Algorithms: Dijkstra vs Bellman-Ford"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-gray-400">Engaging, clear title for the article (5–150 characters)</p>
              </div>

              {/* Cover Image / Picture Option */}
              <div className="space-y-2 bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-gray-200">
                    Cover Picture (Image URL) <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                  </label>
                  {formData.imgURL && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, imgURL: '' })}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Clear Picture
                    </button>
                  )}
                </div>

                <div className="flex gap-3 items-start">
                  <div className="flex-1 space-y-1">
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or https://i.imgur.com/..."
                      value={formData.imgURL}
                      onChange={(e) => setFormData({ ...formData, imgURL: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                    <p className="text-xs text-gray-400">Direct image link for the blog card & hero header</p>
                  </div>

                  {formData.imgURL && (
                    <div className="w-20 h-14 rounded-lg overflow-hidden border border-emerald-500/40 bg-slate-950 flex-shrink-0 relative">
                      <img 
                        src={formData.imgURL} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Content Field with Markdown Tooltips */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-sm font-semibold text-gray-200">Content (Markdown) <span className="text-red-400">*</span></label>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>Quick Insert:</span>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdownHelper('![Illustration description](https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800)')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 text-[11px]"
                    >
                      + Image
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdownHelper('```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}\n```')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-cyan-400 border border-white/10 text-[11px]"
                    >
                      + Code
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertMarkdownHelper('## Section Title\n\nExplain key concept here with **bold terms** and `inline_code`.')}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-purple-400 border border-white/10 text-[11px]"
                    >
                      + Heading
                    </button>
                  </div>
                </div>

                <textarea
                  required
                  rows={8}
                  placeholder="Write the article in Markdown format (headers, code snippets, lists, bold text, images)..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[200px]"
                />
                <p className="text-xs text-gray-400">Full article content supporting GitHub Flavored Markdown and inline pictures</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-gray-900 py-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
