'use client';

import StudentProgressDashboard from '@/components/admin/StudentProgressDashboard';

export default function ContentManagerProgressPage() {
  return (
    <StudentProgressDashboard 
      role="content_manager" 
      title="Student Progress & Reports"
      subtitle="Inspect comprehensive student reports, course completion percentages, and assessment scores."
    />
  );
}
