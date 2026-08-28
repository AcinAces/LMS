'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const [coursesRes, instructorsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate=*`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/users?filters[role][type][$eq]=instructor`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);
      const data = await coursesRes.json();
      setCourses(data.data || []);
      
      if (instructorsRes.ok) {
        const instData = await instructorsRes.json();
        setInstructors(instData || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const columns: ColumnDef<any>[] = [
    { key: 'documentId', label: 'ID', render: (row) => <span className="text-gray-500 font-mono text-xs">{row.documentId.substring(0, 8)}</span> },
    { key: 'courseTitle', label: 'Title' },
    { key: 'courseAuthor', label: 'Author', render: (row) => (
      <span className="text-emerald-400">{row.courseAuthor?.username || 'Unassigned'}</span>
    )},
    { key: 'courseTag', label: 'Tag', render: (row) => (
      <span className="px-2 py-1 bg-white/10 rounded-full text-xs">{row.courseTag || 'None'}</span>
    )},
    { key: 'courseType', label: 'Type', render: (row) => (
      <span className="text-blue-400 text-xs font-bold">{row.courseType || 'Theory'}</span>
    )},
    { key: 'publishedAt', label: 'Status', render: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs ${row.publishedAt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
        {row.publishedAt ? 'Published' : 'Draft'}
      </span>
    )}
  ];

  const fields: FormField[] = [
    { key: 'courseTitle', label: 'Course Title', type: 'text', required: true },
    { key: 'courseType', label: 'Course Type', type: 'select', options: [{value: 'Theory', label: 'Theory'}, {value: 'Contest', label: 'Contest'}], required: true },
    { key: 'courseAuthor', label: 'Select Instructor', type: 'select', required: true, options: instructors.map(i => ({ value: i.documentId || i.id, label: i.username })) },
    { key: 'courseTag', label: 'Tag (e.g. Popular, New)', type: 'text' },
    { key: 'courseDescription', label: 'Description', type: 'textarea' },
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    // Format payload for Strapi
    // Note: Richtext uses blocks array in v5, but for simplicity we might just send it as text or blocks if it errors
    const payload = {
      data: {
        courseTitle: formData.courseTitle,
        courseType: formData.courseType,
        courseTag: formData.courseTag,
        courseDescription: formData.courseDescription,
        ...(formData.courseAuthor ? { courseAuthor: { connect: [formData.courseAuthor] } } : {})
      }
    };

    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${editingData.documentId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses`;
      
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    if (!res.ok) {
      throw new Error(resData.error?.message || 'Failed to save course');
    }
    
    // Publish automatically if it's new
    if (!isEditing && resData.data?.documentId) {
       await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${resData.data.documentId}/actions/publish`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${jwt}` }
       });
    }

    fetchCourses();
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete "${row.courseTitle}"?`)) return;
    
    const jwt = localStorage.getItem('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${row.documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    fetchCourses();
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Courses</h1>
        <p className="text-gray-400">Create, edit, and organize learning paths.</p>
      </div>

      <DataTable 
        title="Courses"
        columns={columns}
        data={courses}
        onAdd={() => { setEditingData({ courseType: 'Theory' }); setIsModalOpen(true); }}
        onEdit={(row) => { 
          // Extract plain text from blocks if it's a rich text array
          let desc = row.courseDescription;
          if (Array.isArray(desc)) {
             desc = desc.map((b: any) => b.children?.map((c: any) => c.text).join('')).join('\n');
          }
          setEditingData({ 
            ...row, 
            courseDescription: desc,
            courseAuthor: row.courseAuthor?.documentId || row.courseAuthor?.id 
          }); 
          setIsModalOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New Course"
      />

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingData?.documentId ? 'Edit Course' : 'Create Course'}
        fields={fields}
        initialData={editingData}
      />
    </div>
  );
}
