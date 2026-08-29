'use client';

import StudentProgressDashboard from '@/components/admin/StudentProgressDashboard';

export default function InstructorProgressPage() {
  return (
    <StudentProgressDashboard 
      role="instructor" 
      title="My Students' Progress"
      subtitle="View comprehensive reports and quiz results for students enrolled in your authored courses."
    />
  );
}
