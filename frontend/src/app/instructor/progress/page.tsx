'use client';

import { useState, useEffect } from 'react';
import DataTable, { ColumnDef } from '@/components/admin/DataTable';

export default function AdminProgressPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnrollments = async () => {
    try {
      const jwt = localStorage.getItem('jwt');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const res = await fetch(`http://localhost:1337/api/enrollments?populate=course,student,lesson_progresses&filters[course][courseAuthor][id][$eq]=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${jwt}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const columns: ColumnDef<any>[] = [
    { key: 'student', label: 'Student', render: (row) => (
      <div className="flex flex-col">
        <span className="font-medium text-white">{row.student?.username || 'Unknown'}</span>
        <span className="text-xs text-gray-500">{row.student?.email || 'N/A'}</span>
      </div>
    )},
    { key: 'course', label: 'Enrolled Course', render: (row) => (
      <span className="text-gray-300">{row.course?.courseTitle || 'Unknown Course'}</span>
    )},
    { key: 'createdAt', label: 'Enrollment Date', render: (row) => (
      <span className="text-gray-400 text-sm">
        {new Date(row.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
      </span>
    )},
  ];

  if (loading) return <div>Loading progress data...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Student Progress</h1>
        <p className="text-gray-400">View recent enrollments and overall student progress.</p>
      </div>

      <DataTable 
        title="Recent Enrollments"
        columns={columns}
        data={enrollments}
        // No Add/Edit/Delete actions for enrollments in this view
      />
    </div>
  );
}
