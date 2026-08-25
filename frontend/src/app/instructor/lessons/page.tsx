'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';

export default function AdminLessonsPage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchLessonsAndCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const [lessonsRes, coursesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons?populate=course&filters[course][courseAuthor][id][$eq]=${user?.id}`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?filters[courseAuthor][id][$eq]=${user?.id}`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);
      
      if (lessonsRes.ok) {
        const data = await lessonsRes.json();
        setLessons(data.data || []);
      }
      if (coursesRes.ok) {
        const data = await coursesRes.json();
        setCourses(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessonsAndCourses();
  }, []);

  const columns: ColumnDef<any>[] = [
    { key: 'title', label: 'Title' },
    { key: 'youtubeVideoId', label: 'Video ID', render: (row) => (
      <span className="font-mono text-xs text-gray-400">{row.youtubeVideoId}</span>
    )},
    { key: 'course', label: 'Course', render: (row) => (
      <span className="text-gray-300">{row.course?.courseTitle || 'None'}</span>
    )},
    { key: 'order', label: 'Order' },
  ];

  const fields: FormField[] = [
    { key: 'title', label: 'Lesson Title', type: 'text', required: true },
    { key: 'youtubeVideoId', label: 'YouTube URL or ID', type: 'text', required: true },
    { key: 'order', label: 'Display Order', type: 'number', required: true },
    { key: 'course', label: 'Course', type: 'select', options: courses.map(c => ({ value: c.documentId, label: c.courseTitle })) },
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    // Extract ID if URL is provided
    let videoId = formData.youtubeVideoId;
    if (videoId?.includes('youtube.com/') || videoId?.includes('youtu.be/')) {
      const url = new URL(videoId.startsWith('http') ? videoId : `https://${videoId}`);
      videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || videoId;
    }
    
    const payload = {
      data: {
        title: formData.title,
        youtubeVideoId: videoId,
        order: Number(formData.order),
        course: formData.course || null
      }
    };

    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${editingData.documentId}`
      : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons`;
      
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error?.message || 'Failed to save lesson');

    if (!isEditing && resData.data?.documentId) {
       await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${resData.data.documentId}/actions/publish`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${jwt}` }
       });
    }

    fetchLessonsAndCourses();
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete lesson "${row.title}"?`)) return;
    
    const jwt = localStorage.getItem('jwt');
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${row.documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    fetchLessonsAndCourses();
  };

  if (loading) return <div>Loading lessons...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Lessons</h1>
        <p className="text-gray-400">Add video lessons and assign them to courses.</p>
      </div>

      <DataTable 
        title="Lessons"
        columns={columns}
        data={lessons}
        onAdd={() => { setEditingData({}); setIsModalOpen(true); }}
        onEdit={(row) => { 
          setEditingData({ ...row, course: row.course?.documentId }); 
          setIsModalOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New Lesson"
      />

      <DynamicFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingData?.documentId ? 'Edit Lesson' : 'Create Lesson'}
        fields={fields}
        initialData={editingData}
      />
    </div>
  );
}
