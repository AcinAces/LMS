async function getAuthenticatedUser(ctx: any, strapi: any) {
  let user = ctx.state.user;
  if (!user) {
    const authHeader = ctx.request.header.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await strapi.plugin('users-permissions').service('jwt').verify(token);
        if (decoded?.id) {
          user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: decoded.id },
            populate: ['role']
          });
        }
      } catch (e) {}
    }
  } else if (!user.role?.type) {
    try {
      user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role']
      });
    } catch (e) {}
  }
  return user;
}

export default {
  async getEnrolledStudents(ctx: any) {
    const strapiInstance = (global as any).strapi;
    const user = await getAuthenticatedUser(ctx, strapiInstance);
    if (!user || !['admin', 'content_manager', 'instructor'].includes(user.role?.type)) {
      return ctx.unauthorized('Access denied. Staff access required.');
    }

    try {
      const isInstructor = user.role?.type === 'instructor';
      let enrollments: any[] = [];

      if (isInstructor) {
        // Find instructor's authored courses
        const instructorCourses = await strapiInstance.documents('api::course.course').findMany({
          filters: { courseAuthor: { id: { $eq: user.id } } },
          limit: 1000
        });

        const instructorCourseDocIds = instructorCourses.map((c: any) => c.documentId);
        if (instructorCourseDocIds.length === 0) {
          return ctx.send({ data: [] });
        }

        enrollments = await strapiInstance.documents('api::enrollment.enrollment').findMany({
          filters: { course: { documentId: { $in: instructorCourseDocIds } } },
          populate: { student: true, course: true },
          limit: 10000
        });
      } else {
        // Admin or Content Manager - fetch all enrollments
        enrollments = await strapiInstance.documents('api::enrollment.enrollment').findMany({
          populate: { student: true, course: true },
          limit: 10000
        });
      }

      // Group by student
      const studentMap = new Map();

      enrollments.forEach((enr: any) => {
        const student = enr.student;
        if (!student) return;

        const key = student.documentId || String(student.id);
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: student.id,
            documentId: student.documentId,
            username: student.username,
            email: student.email,
            createdAt: student.createdAt,
            enrolledCoursesCount: 0,
            enrolledCourseTitles: []
          });
        }

        const studentData = studentMap.get(key);
        studentData.enrolledCoursesCount += 1;
        if (enr.course?.courseTitle && !studentData.enrolledCourseTitles.includes(enr.course.courseTitle)) {
          studentData.enrolledCourseTitles.push(enr.course.courseTitle);
        }
      });

      let students = Array.from(studentMap.values());

      // Filter by search query if provided
      const search = (ctx.query.search || '').toString().trim().toLowerCase();
      if (search) {
        students = students.filter(s => 
          (s.username && s.username.toLowerCase().includes(search)) ||
          (s.email && s.email.toLowerCase().includes(search))
        );
      }

      // Sort alphabetically by username
      students.sort((a, b) => (a.username || '').localeCompare(b.username || ''));

      return ctx.send({ data: students });
    } catch (err: any) {
      console.error('Error fetching enrolled students:', err);
      return ctx.internalServerError('Failed to fetch enrolled students');
    }
  },

  async getStudentDetailedReport(ctx: any) {
    const strapiInstance = (global as any).strapi;
    const user = await getAuthenticatedUser(ctx, strapiInstance);
    if (!user) {
      return ctx.unauthorized('Authentication required.');
    }

    const roleType = user.role?.type;
    const isStaff = ['admin', 'content_manager', 'instructor'].includes(roleType);
    const isStudent = roleType === 'authenticated';

    if (!isStaff && !isStudent) {
      return ctx.forbidden('Access denied.');
    }

    let { studentId } = ctx.params;
    if (!studentId || studentId === 'me' || studentId === 'self') {
      studentId = String(user.id);
    }

    try {
      // Find the target student
      const student = await strapiInstance.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { documentId: studentId },
            { id: isNaN(Number(studentId)) ? -1 : Number(studentId) },
            { username: studentId }
          ]
        }
      });

      if (!student) {
        return ctx.notFound('Student not found');
      }

      // If user is a student, enforce that they can only view their own progress
      if (isStudent && student.id !== user.id) {
        return ctx.forbidden('You can only view your own progress report.');
      }

      const isInstructor = user.role?.type === 'instructor';
      let instructorCourseDocIds: string[] = [];

      if (isInstructor) {
        const instructorCourses = await strapiInstance.documents('api::course.course').findMany({
          filters: { courseAuthor: { id: { $eq: user.id } } },
          limit: 1000
        });

        instructorCourseDocIds = instructorCourses.map((c: any) => c.documentId);
        if (instructorCourseDocIds.length === 0) {
          return ctx.forbidden('You can only view reports for students enrolled in your courses.');
        }

        // Verify enrollment
        const isEnrolledInInstructorCourse = await strapiInstance.documents('api::enrollment.enrollment').findFirst({
          filters: {
            student: { id: { $eq: student.id } },
            course: { documentId: { $in: instructorCourseDocIds } }
          }
        });

        if (!isEnrolledInInstructorCourse) {
          return ctx.forbidden('You can only view reports for students enrolled in your courses.');
        }
      }

      // Fetch enrollments with populated courses and lessons
      const enrollmentFilters: any = { student: { id: { $eq: student.id } } };
      if (isInstructor) {
        enrollmentFilters.course = { documentId: { $in: instructorCourseDocIds } };
      }

      const enrollments = await strapiInstance.documents('api::enrollment.enrollment').findMany({
        filters: enrollmentFilters,
        populate: {
          course: {
            populate: {
              courseAuthor: true,
              lessons: {
                sort: 'order:asc'
              },
              quizzes: true
            }
          }
        },
        limit: 1000
      });

      // Fetch student's lesson progress records
      const lessonProgresses = await strapiInstance.documents('api::lesson-progress.lesson-progress').findMany({
        filters: { student: { id: { $eq: student.id } } },
        populate: { lesson: true },
        limit: 10000
      });

      const progressByLessonDocId = new Map();
      const progressByLessonId = new Map();
      lessonProgresses.forEach((lp: any) => {
        if (lp.lesson?.documentId) progressByLessonDocId.set(lp.lesson.documentId, lp);
        if (lp.lesson?.id) progressByLessonId.set(lp.lesson.id, lp);
      });

      let totalLessonsCount = 0;
      let totalCompletedLessonsCount = 0;

      const coursesData = enrollments.map((enr: any) => {
        const course = enr.course;
        if (!course) return null;

        const rawLessons = course.lessons || [];
        // Ensure sorted by order
        const sortedLessons = [...rawLessons].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        let courseCompletedCount = 0;

        const lessonsReport = sortedLessons.map((les: any) => {
          const prog = progressByLessonDocId.get(les.documentId) || progressByLessonId.get(les.id);
          const isCompleted = !!prog?.completed;
          if (isCompleted) {
            courseCompletedCount++;
            totalCompletedLessonsCount++;
          }

          return {
            id: les.id,
            documentId: les.documentId,
            title: les.title,
            order: les.order,
            durationInSeconds: les.durationInSeconds || 0,
            completed: isCompleted,
            completedAt: prog?.completedAt || null,
            lastWatchedPosition: prog?.lastWatchedPosition || 0,
            maxWatchedPosition: prog?.maxWatchedPosition || 0,
          };
        });

        totalLessonsCount += sortedLessons.length;
        const completionPercentage = sortedLessons.length > 0
          ? Math.round((courseCompletedCount / sortedLessons.length) * 100)
          : 0;

        return {
          id: course.id,
          documentId: course.documentId,
          courseTitle: course.courseTitle,
          courseType: course.courseType || 'Theory',
          courseTag: course.courseTag || null,
          courseAuthor: course.courseAuthor ? {
            id: course.courseAuthor.id,
            username: course.courseAuthor.username,
            email: course.courseAuthor.email
          } : null,
          enrolledAt: enr.enrolledAt || enr.createdAt,
          totalLessons: sortedLessons.length,
          completedLessons: courseCompletedCount,
          completionPercentage,
          isFullyCompleted: sortedLessons.length > 0 && courseCompletedCount >= sortedLessons.length,
          lessons: lessonsReport
        };
      }).filter(Boolean);

      // Fetch student's quiz attempts
      const attemptFilters: any = { student: { id: { $eq: student.id } } };
      if (isInstructor) {
        attemptFilters.quiz = { course: { documentId: { $in: instructorCourseDocIds } } };
      }

      const quizAttempts = await strapiInstance.documents('api::quiz-attempt.quiz-attempt').findMany({
        filters: attemptFilters,
        populate: {
          quiz: {
            populate: ['course']
          }
        },
        sort: 'createdAt:desc',
        limit: 1000
      });

      const formattedAttempts = quizAttempts.map((att: any) => {
        const score = Number(att.score ?? 0);
        const totalQuestion = Number(att.totalQuestion ?? 0);
        const percentage = att.percentage !== undefined && att.percentage !== null
          ? Number(att.percentage)
          : (totalQuestion > 0 ? Math.round((score / totalQuestion) * 100) : 0);

        return {
          id: att.id,
          documentId: att.documentId,
          quizId: att.quiz?.documentId || att.quiz?.id,
          quizTitle: att.quiz?.quizTitle || 'Quiz',
          courseTitle: att.quiz?.course?.courseTitle || 'General',
          score,
          totalQuestion,
          percentage,
          status: att.status || 'submitted',
          violationScore: att.violationScore || 0,
          violationsCount: Array.isArray(att.violationsLog) ? att.violationsLog.length : 0,
          submittedAt: att.submittedAt || att.updatedAt,
          startedAt: att.startedAt || att.createdAt,
        };
      });

      // Compute analytics summary
      const totalEnrolledCourses = coursesData.length;
      const fullyCompletedCourses = coursesData.filter((c: any) => c.isFullyCompleted).length;
      const inProgressCourses = totalEnrolledCourses - fullyCompletedCourses;
      const overallCompletionRate = totalEnrolledCourses > 0
        ? Math.round(coursesData.reduce((acc: number, c: any) => acc + c.completionPercentage, 0) / totalEnrolledCourses)
        : 0;

      const submittedAttempts = formattedAttempts.filter((a: any) => a.status === 'submitted');
      const averageQuizScore = submittedAttempts.length > 0
        ? Math.round(submittedAttempts.reduce((acc: number, a: any) => acc + a.percentage, 0) / submittedAttempts.length)
        : 0;
      const highestQuizScore = submittedAttempts.length > 0
        ? Math.max(...submittedAttempts.map((a: any) => a.percentage))
        : 0;

      return ctx.send({
        data: {
          student: {
            id: student.id,
            documentId: student.documentId,
            username: student.username,
            email: student.email,
            createdAt: student.createdAt
          },
          summary: {
            totalEnrolledCourses,
            fullyCompletedCourses,
            inProgressCourses,
            totalLessonsCount,
            totalCompletedLessonsCount,
            overallCompletionRate,
            totalQuizzesAttempted: formattedAttempts.length,
            submittedQuizzesCount: submittedAttempts.length,
            averageQuizScore,
            highestQuizScore
          },
          courses: coursesData,
          quizzes: formattedAttempts
        }
      });

    } catch (err: any) {
      console.error('Error generating student detailed report:', err);
      return ctx.internalServerError('Failed to generate student report');
    }
  }
};
