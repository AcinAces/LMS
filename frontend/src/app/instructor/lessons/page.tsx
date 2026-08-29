'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';
import DynamicFormModal, { FormField } from '@/components/admin/DynamicFormModal';
import { useToast } from '@/context/ToastContext';

export default function InstructorLessonsPage() {
  const toast = useToast();
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
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons?populate=course&filters[course][courseAuthor][id][$eq]=${user?.id}&sort=order:asc&pagination[limit]=1000`, {
          headers: { 'Authorization': `Bearer ${jwt}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/courses?filters[courseAuthor][id][$eq]=${user?.id}&pagination[limit]=1000`, {
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

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const columns: ColumnDef<any>[] = [
    { 
      key: 'order', 
      label: 'Order', 
      render: (row) => (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 font-mono text-xs font-bold text-slate-300 border border-white/10">
          #{row.order}
        </span>
      )
    },
    { 
      key: 'title', 
      label: 'Lesson Title', 
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          {row.course?.documentId ? (
            <Link 
              href={`/courses/${row.course.documentId}/lessons/${row.documentId}`}
              target="_blank"
              className="font-bold text-white hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5 group/link"
              title="Watch / preview lesson in new tab"
            >
              <span>{row.title}</span>
              <svg className="w-3.5 h-3.5 opacity-40 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 transition-all text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Link>
          ) : (
            <span className="font-bold text-white">{row.title}</span>
          )}
          <span className="text-[11px] text-gray-500 font-mono">ID: {row.documentId?.substring(0, 8)}...</span>
        </div>
      )
    },
    { 
      key: 'course', 
      label: 'Course', 
      render: (row) => row.course?.documentId ? (
        <Link 
          href={`/courses/${row.course.documentId}`}
          target="_blank"
          className="text-gray-300 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs"
        >
          <span>{row.course.courseTitle}</span>
          <svg className="w-3 h-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      ) : (
        <span className="text-gray-500 text-xs italic">Unassigned</span>
      )
    },
    { 
      key: 'durationInSeconds', 
      label: 'Duration', 
      render: (row) => (
        <span className="text-xs font-mono text-gray-300 px-2 py-1 bg-white/5 rounded-md border border-white/5">
          {formatDuration(row.durationInSeconds)}
        </span>
      )
    },
    { 
      key: 'youtubeVideoId', 
      label: 'YouTube Video', 
      render: (row) => (
        <span className="font-mono text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
          {row.youtubeVideoId}
        </span>
      )
    }
  ];

  const fields: FormField[] = [
    { 
      key: 'title', 
      label: 'Lesson Title', 
      type: 'text', 
      required: true,
      placeholder: 'e.g. Binary Search & Lower Bound In-Depth',
      minLength: 3,
      maxLength: 120,
      hint: 'Descriptive title for this lesson (3–120 characters)'
    },
    { 
      key: 'youtubeVideoId', 
      label: 'YouTube Video URL or ID', 
      type: 'text', 
      required: true,
      placeholder: 'e.g. https://www.youtube.com/watch?v=0MqF0CziMkQ or 0MqF0CziMkQ',
      hint: 'Full YouTube URL (youtube.com / youtu.be) or 11-character video ID'
    },
    { 
      key: 'course', 
      label: 'Select Course', 
      type: 'select', 
      required: true,
      placeholder: 'Select course to assign...',
      options: courses.map(c => ({ value: c.documentId, label: c.courseTitle })),
      hint: 'The course curriculum where this lesson belongs'
    },
    { 
      key: 'order', 
      label: 'Lesson Number (Order)', 
      type: 'number', 
      required: true,
      min: 1,
      step: 1,
      placeholder: 'e.g. 1',
      hint: 'Positive integer (1, 2, 3...). Must be greater than 0, no decimals or signs.'
    },
    { 
      key: 'content', 
      label: 'Lesson Notes / Material (Optional)', 
      type: 'textarea',
      placeholder: 'Write summary notes, code snippets, or additional links in Markdown...',
      hint: 'Supports Markdown formatting for rich lesson notes'
    }
  ];

  const handleFormChange = (newData: any, setFormData: any) => {
    if (newData.course && !editingData?.documentId && newData._lastCourseForOrder !== newData.course) {
      const courseLessons = lessons.filter(l => l.course?.documentId === newData.course);
      const takenOrders = courseLessons.map(l => l.order).filter(o => o > 0);
      let mex = 1;
      while (takenOrders.includes(mex)) {
        mex++;
      }
      setFormData((prev: any) => ({ ...prev, order: mex, _lastCourseForOrder: newData.course }));
    }
  };

  const handleSubmit = async (formData: any) => {
    const jwt = localStorage.getItem('jwt');
    const isEditing = !!editingData?.documentId;
    
    let videoId = formData.youtubeVideoId;
    if (videoId?.includes('youtube.com/') || videoId?.includes('youtu.be/')) {
      const url = new URL(videoId.startsWith('http') ? videoId : `https://${videoId}`);
      videoId = url.searchParams.get('v') || url.pathname.split('/').pop() || videoId;
    }
    
    const requestedOrder = Number(formData.order);
    if (requestedOrder <= 0 || isNaN(requestedOrder)) {
      throw new Error("Lesson number must be a positive integer greater than 0");
    }

    const courseLessons = lessons.filter(l => l.course?.documentId === formData.course && l.documentId !== editingData?.documentId);
    if (courseLessons.some(l => l.order === requestedOrder)) {
      throw new Error("This Lesson number is already taken in the selected course!");
    }
    
    let durationInSeconds = 0;
    try {
      const durRes = await fetch(`/api/youtube/duration?v=${videoId}`);
      if (durRes.ok) {
        const durData = await durRes.json();
        if (durData.durationInSeconds) durationInSeconds = durData.durationInSeconds;
      }
    } catch(e) { console.error(e) }

    const payload = {
      data: {
        title: formData.title,
        youtubeVideoId: videoId,
        order: requestedOrder,
        content: formData.content || null,
        ...(durationInSeconds > 0 ? { durationInSeconds } : {}),
        ...(formData.course ? { course: { connect: [formData.course] } } : {})
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
    
    try {
      const jwt = localStorage.getItem('jwt');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337'}/api/lessons/${row.documentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error('Failed to delete lesson');
      toast.success(`Lesson "${row.title}" deleted.`);
      fetchLessonsAndCourses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete lesson');
    }
  };

  if (loading) return <div>Loading lessons...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Lessons</h1>
        <p className="text-gray-400">Add video lessons for your authored courses, organize sequence orders, and preview live playback.</p>
      </div>

      <DataTable 
        title="My Course Lessons"
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
        onChange={handleFormChange}
      />
    </div>
  );
}
