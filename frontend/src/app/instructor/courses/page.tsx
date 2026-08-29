'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';
import { useToast } from '@/context/ToastContext';

export default function InstructorCoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);

  const fetchCourses = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const [coursesRes, enrollmentsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?populate[lessons]=true&populate[quizzes]=true&filters[courseAuthor][id][$eq]=${user?.id}`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/enrollments?populate=course&pagination[limit]=10000`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        })
      ]);

      const coursesData = await coursesRes.json();
      const rawCourses = coursesData.data || [];

      let enrollments: any[] = [];
      if (enrollmentsRes.ok) {
        const enrData = await enrollmentsRes.json();
        enrollments = enrData.data || [];
      }

      const enriched = rawCourses.map((c: any) => {
        const enrolledCount = enrollments.filter((e: any) => 
          (e.course?.documentId && e.course.documentId === c.documentId) ||
          (e.course?.id && e.course.id === c.id)
        ).length;

        const lessonsCount = Array.isArray(c.lessons) ? c.lessons.length : 0;
        const quizzesCount = Array.isArray(c.quizzes) ? c.quizzes.length : 0;

        return {
          ...c,
          enrolledCount,
          lessonsCount,
          quizzesCount
        };
      });

      setCourses(enriched);
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
    { 
      key: 'courseTitle', 
      label: 'Course Title', 
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <Link 
            href={`/courses/${row.documentId}`} 
            target="_blank"
            className="font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group/link"
            title="Open live course page in new tab"
          >
            <span>{row.courseTitle}</span>
            <svg className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <span className="text-[11px] text-gray-500 font-mono">ID: {row.documentId?.substring(0, 8)}...</span>
        </div>
      )
    },
    { 
      key: 'enrolledCount', 
      label: 'Enrolled Students', 
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {row.enrolledCount} {row.enrolledCount === 1 ? 'Student' : 'Students'}
        </span>
      )
    },
    { 
      key: 'curriculum', 
      label: 'Curriculum', 
      render: (row) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-300 font-medium">{row.lessonsCount} {row.lessonsCount === 1 ? 'Lesson' : 'Lessons'}</span>
          <span className="text-gray-600">·</span>
          <span className="text-purple-400 font-medium">{row.quizzesCount} {row.quizzesCount === 1 ? 'Quiz' : 'Quizzes'}</span>
        </div>
      )
    },
    { 
      key: 'courseType', 
      label: 'Type & Tag', 
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-blue-400 text-xs font-bold px-2 py-0.5 bg-blue-500/10 rounded-md border border-blue-500/20">
            {row.courseType || 'Theory'}
          </span>
          {row.courseTag && (
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-md text-[11px] border border-amber-500/20">
              {row.courseTag}
            </span>
          )}
        </div>
      )
    },
    { 
      key: 'publishedAt', 
      label: 'Status', 
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${row.publishedAt ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
          {row.publishedAt ? 'Published' : 'Draft'}
        </span>
      )
    }
  ];

  const fields: FormField[] = [
    { 
      key: 'courseTitle', 
      label: 'Course Title', 
      type: 'text', 
      required: true,
      placeholder: 'e.g. Complete Competitive Programming Bootcamp',
      minLength: 3,
      maxLength: 120,
      hint: 'Concise and descriptive course name (3–120 characters)'
    },
    { 
      key: 'courseType', 
      label: 'Course Type', 
      type: 'select', 
      options: [{ value: 'Theory', label: 'Theory' }, { value: 'Contest', label: 'Contest' }], 
      required: true,
      placeholder: 'Select course category...',
      hint: 'Theory for regular conceptual lessons; Contest for problem-solving/contests'
    },
    { 
      key: 'courseTag', 
      label: 'Course Badge / Tag', 
      type: 'text',
      placeholder: 'e.g. Popular, Advanced, New',
      maxLength: 30,
      hint: 'Optional short highlight badge shown on course cards (max 30 characters)'
    },
    { 
      key: 'courseDescription', 
      label: 'Course Description', 
      type: 'textarea',
      placeholder: 'Write a comprehensive course overview, prerequisites, and learning objectives...',
      hint: 'Detailed course description supporting Markdown syntax'
    },
  ];

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isEditing = !!editingData?.documentId;
    
    const payload = {
      data: {
        courseTitle: formData.courseTitle,
        courseType: formData.courseType,
        courseTag: formData.courseTag,
        courseDescription: formData.courseDescription,
        ...(user ? { courseAuthor: { connect: [user.documentId || user.id] } } : {})
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
    
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses/${row.documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Failed to delete course');
      toast.success(`Course "${row.courseTitle}" deleted.`);
      fetchCourses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete course');
    }
  };

  if (loading) return <div>Loading courses...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Courses</h1>
        <p className="text-gray-400">Create, edit, and monitor your authored learning paths and student enrollments.</p>
      </div>

      <DataTable 
        title="My Courses"
        columns={columns}
        data={courses}
        onAdd={() => { setEditingData({ courseType: 'Theory' }); setIsModalOpen(true); }}
        onEdit={(row) => { 
          let desc = row.courseDescription;
          if (Array.isArray(desc)) {
             desc = desc.map((b: any) => b.children?.map((c: any) => c.text).join('')).join('\n');
          }
          setEditingData({ ...row, courseDescription: desc }); 
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
