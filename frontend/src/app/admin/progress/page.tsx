'use client';

import StudentProgressDashboard from '@/components/admin/StudentProgressDashboard';

export default function AdminProgressPage() {
  return (
    <StudentProgressDashboard 
      role="admin" 
      title="Student Progress & Reports"
      subtitle="View comprehensive reports, course completion rates, and quiz scores for all platform students."
    />
  );
}
