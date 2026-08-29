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
        body: b || ''
      });
    } else {
      setFormData({ title: '', topic: '', subtopic: '', body: '' });
    }
    setError('');
    setIsModalOpen(true);
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
        <p className="text-gray-400">Write articles. They are saved as Drafts by default. Toggle the switch to publish.</p>
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

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-200">Content (Markdown) <span className="text-red-400">*</span></label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write the article in Markdown format (headers, code snippets, lists, bold text)..."
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all min-h-[220px]"
                />
                <p className="text-xs text-gray-400">Full article content supporting GitHub Flavored Markdown</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-gray-900 py-2">
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
