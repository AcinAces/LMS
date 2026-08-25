'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchBlogs = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const res = await fetch('http://localhost:1337/api/blogs?populate=*', {
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

  const columns: ColumnDef<any>[] = [
    { key: 'title', label: 'Title' },
    { key: 'author', label: 'Author', render: (row) => (
      <span className="text-gray-300">{row.author?.username || 'System'}</span>
    )},
    { key: 'publishedAt', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs ${row.publishedAt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {row.publishedAt ? 'Published' : 'Draft'}
      </span>
    )}
  ];

  const fields: FormField[] = [
    { key: 'title', label: 'Blog Title', type: 'text', required: true },
    { key: 'imgURL', label: 'Cover Image URL', type: 'text' },
    { key: 'body', label: 'Content (Markdown)', type: 'textarea', required: true },
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    const payload = {
      data: {
        title: formData.title,
        imgURL: formData.imgURL,
        body: formData.body
      }
    };

    const url = isEditing 
      ? `http://localhost:1337/api/blogs/${editingData.documentId}`
      : `http://localhost:1337/api/blogs`;
      
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
    
    if (!isEditing && resData.data?.documentId) {
       await fetch(`http://localhost:1337/api/blogs/${resData.data.documentId}/actions/publish`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${jwt}` }
       });
    }

    fetchBlogs();
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete blog "${row.title}"?`)) return;
    
    const jwt = localStorage.getItem('jwt');
    await fetch(`http://localhost:1337/api/blogs/${row.documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    fetchBlogs();
  };

  if (loading) return <div>Loading blogs...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Blogs</h1>
        <p className="text-gray-400">Write and publish articles for your platform.</p>
      </div>

      <DataTable 
        title="Blog Posts"
        columns={columns}
        data={blogs}
        onAdd={() => { setEditingData({}); setIsModalOpen(true); }}
        onEdit={(row) => { 
          // Extract plain text from blocks if it's a rich text array
          let b = row.body;
          if (Array.isArray(b)) {
             b = b.map((bk: any) => bk.children?.map((c: any) => c.text).join('')).join('\n');
          }
          setEditingData({ ...row, body: b }); 
          setIsModalOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New Blog Post"
      />

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingData?.documentId ? 'Edit Blog' : 'Create Blog'}
        fields={fields}
        initialData={editingData}
      />
    </div>
  );
}
