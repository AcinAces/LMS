export default {
  routes: [
    {
      method: 'GET',
      path: '/student-reports/students',
      handler: 'student-reports.getEnrolledStudents',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/student-reports/:studentId',
      handler: 'student-reports.getStudentDetailedReport',
      config: {
        auth: false,
      },
    },
  ],
};
