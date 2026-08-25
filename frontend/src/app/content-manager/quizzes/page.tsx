'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';
import QuizBuilderModal from '@/components/admin/QuizBuilderModal';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchQuizzesAndCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      
      const [quizzesRes, coursesRes] = await Promise.all([
        fetch('http://localhost:1337/api/quizzes?populate=course', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch('http://localhost:1337/api/courses', {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);
      
      if (quizzesRes.ok) {
        const data = await quizzesRes.json();
        setQuizzes(data.data || []);
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
    fetchQuizzesAndCourses();
  }, []);

  const columns: ColumnDef<any>[] = [
    { key: 'quizTitle', label: 'Quiz Title' },
    { key: 'course', label: 'Course', render: (row) => (
      <span className="text-gray-300">{row.course?.courseTitle || 'None'}</span>
    )},
  ];

  const fields: FormField[] = [
    { key: 'quizTitle', label: 'Quiz Title', type: 'text', required: true },
    { key: 'quizDescription', label: 'Description', type: 'textarea' },
    { key: 'course', label: 'Linked Course', type: 'select', options: courses.map(c => ({ value: c.documentId, label: c.courseTitle })) },
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    const payload = {
      data: {
        quizTitle: formData.quizTitle,
        quizDescription: formData.quizDescription,
        course: formData.course || null
      }
    };

    const url = isEditing 
      ? `http://localhost:1337/api/quizzes/${editingData.documentId}`
      : `http://localhost:1337/api/quizzes`;
      
    const res = await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`
      },
      body: JSON.stringify(payload)
    });

    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error?.message || 'Failed to save quiz');
    
    if (!isEditing && resData.data?.documentId) {
       await fetch(`http://localhost:1337/api/quizzes/${resData.data.documentId}/actions/publish`, {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${jwt}` }
       });
    }

    fetchQuizzesAndCourses();
  };

  const handleDelete = async (row: any) => {
    if (!confirm(`Are you sure you want to delete quiz "${row.quizTitle}"?`)) return;
    
    const jwt = localStorage.getItem('jwt');
    await fetch(`http://localhost:1337/api/quizzes/${row.documentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${jwt}` }
    });
    
    fetchQuizzesAndCourses();
  };

  if (loading) return <div>Loading quizzes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Quizzes</h1>
        <p className="text-gray-400">Create quizzes and attach them to specific courses.</p>
      </div>

      <DataTable 
        title="Quizzes"
        columns={columns}
        data={quizzes}
        onAdd={() => { setEditingData(null); setIsBuilderOpen(true); }}
        onEdit={(row) => { 
          setEditingData(row); 
          setIsBuilderOpen(true); 
        }}
        onDelete={handleDelete}
        addLabel="New Quiz"
      />

      <QuizBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSuccess={() => { setIsBuilderOpen(false); fetchQuizzesAndCourses(); }}
        courses={courses}
        initialData={editingData}
      />
    </div>
  );
}
