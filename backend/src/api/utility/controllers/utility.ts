function validatePasswordRequirements(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 12) {
    return { isValid: false, error: 'Password must be at least 12 characters long.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 lowercase letter (a-z).' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 uppercase letter (A-Z).' };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least 1 sign or special character (!@#$%^&* etc.).' };
  }
  return { isValid: true };
}

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
  async checkUsername(ctx: any) {
    try {
      const { username } = ctx.request.body;
      
      if (!username) {
        return ctx.badRequest('Username is required');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username },
      });

      if (user) {
        return ctx.send({ available: false });
      }

      return ctx.send({ available: true });
    } catch (err) {
      return ctx.internalServerError('Something went wrong');
    }
  },

  async getSiteStats(ctx: any) {
    try {
      const studentCount = await strapi.db.query('plugin::users-permissions.user').count({
        where: {
          role: {
            type: 'authenticated'
          }
        }
      });
      const courseCount = await strapi.db.query('api::course.course').count();
      return ctx.send({ studentCount, courseCount });
    } catch (err) {
      return ctx.internalServerError('Something went wrong');
    }
  },

  async updateProfile(ctx: any) {
    const strapiInstance = (global as any).strapi;
    const user = await getAuthenticatedUser(ctx, strapiInstance);
    if (!user) {
      return ctx.unauthorized('Authentication required to update profile.');
    }

    const { email, currentPassword, newPassword, avatar } = ctx.request.body;

    // Ensure database column exists for avatar
    try {
      const knex = strapiInstance.db.connection;
      const hasCol = await knex.schema.hasColumn('up_users', 'avatar');
      if (!hasCol) {
        await knex.schema.alterTable('up_users', (table: any) => {
          table.text('avatar').nullable();
        });
      }
    } catch (e) {}

    const isEmailChanging = email && email.trim().toLowerCase() !== user.email?.toLowerCase();
    const isPasswordChanging = !!(newPassword && newPassword.trim());
    const isAvatarChanging = avatar !== undefined;

    // Password verification is required ONLY if changing email or password
    if (isEmailChanging || isPasswordChanging) {
      if (!currentPassword) {
        return ctx.badRequest('Current password is required to update your email or password.');
      }

      try {
        const userWithPassword = await strapiInstance.db.query('plugin::users-permissions.user').findOne({
          where: { id: user.id }
        });

        if (!userWithPassword) {
          return ctx.notFound('User not found.');
        }

        const isPasswordValid = await strapiInstance
          .plugin('users-permissions')
          .service('user')
          .validatePassword(currentPassword, userWithPassword.password);

        if (!isPasswordValid) {
          return ctx.badRequest('Incorrect current password.');
        }
      } catch (err: any) {
        return ctx.badRequest(err.message || 'Password verification failed.');
      }
    }

    try {

      const updateData: any = {};

      // 3. Validate & update email
      if (isEmailChanging) {
        const trimmedEmail = email.trim().toLowerCase();
        const existingUser = await strapiInstance.db.query('plugin::users-permissions.user').findOne({
          where: { email: trimmedEmail, id: { $ne: user.id } }
        });
        if (existingUser) {
          return ctx.badRequest('Email is already in use by another account.');
        }
        updateData.email = trimmedEmail;
      }

      // 4. Validate & update new password
      if (isPasswordChanging) {
        const validation = validatePasswordRequirements(newPassword.trim());
        if (!validation.isValid) {
          return ctx.badRequest(validation.error);
        }
        updateData.password = newPassword.trim();
      }

      // 5. Update avatar
      if (isAvatarChanging) {
        updateData.avatar = avatar || null;
      }

      if (Object.keys(updateData).length > 0) {
        await strapiInstance
          .plugin('users-permissions')
          .service('user')
          .edit(user.id, updateData);
      }

      const safeUser = await strapiInstance.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role']
      });

      return ctx.send({
        id: safeUser.id,
        documentId: safeUser.documentId,
        username: safeUser.username,
        email: safeUser.email,
        avatar: safeUser.avatar || null,
        role: safeUser.role
      });

    } catch (err: any) {
      console.error('Profile update error:', err);
      return ctx.badRequest(err.message || 'Failed to update profile.');
    }
  },

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
    if (!user || !['admin', 'content_manager', 'instructor'].includes(user.role?.type)) {
      return ctx.unauthorized('Access denied. Staff access required.');
    }

    const { studentId } = ctx.params;
    if (!studentId) {
      return ctx.badRequest('Student ID is required');
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
  },

  async getLeaderboard(ctx: any) {
    const strapiInstance = (global as any).strapi;
    const currentUser = await getAuthenticatedUser(ctx, strapiInstance);

    try {
      // 1. Fetch all non-staff users
      const allUsers = await strapiInstance.db.query('plugin::users-permissions.user').findMany({
        populate: ['role']
      });

      const students = allUsers.filter((u: any) => {
        const roleType = u.role?.type;
        return !['admin', 'instructor', 'content_manager'].includes(roleType);
      });

      // 2. Fetch all completed quiz attempts
      const quizAttempts = await strapiInstance.documents('api::quiz-attempt.quiz-attempt').findMany({
        filters: { status: { $eq: 'completed' } },
        populate: { student: true, quiz: true },
        limit: 10000
      });

      // 3. Fetch all enrollments with populated courses and lessons
      const enrollments = await strapiInstance.documents('api::enrollment.enrollment').findMany({
        populate: {
          student: true,
          course: {
            populate: {
              lessons: true
            }
          }
        },
        limit: 10000
      });

      // 4. Fetch all completed lesson progress
      const lessonProgresses = await strapiInstance.documents('api::lesson-progress.lesson-progress').findMany({
        filters: { completed: { $eq: true } },
        populate: { student: true, lesson: true },
        limit: 20000
      });

      // Map progress by student
      const studentProgressMap = new Map<number, Set<string>>();
      lessonProgresses.forEach((lp: any) => {
        const studentId = lp.student?.id;
        const lessonDocId = lp.lesson?.documentId || String(lp.lesson?.id);
        if (studentId && lessonDocId) {
          if (!studentProgressMap.has(studentId)) {
            studentProgressMap.set(studentId, new Set<string>());
          }
          studentProgressMap.get(studentId)!.add(lessonDocId);
        }
      });

      // Map enrollments by student
      const studentEnrollmentsMap = new Map<number, any[]>();
      enrollments.forEach((enr: any) => {
        const studentId = enr.student?.id;
        if (studentId) {
          if (!studentEnrollmentsMap.has(studentId)) {
            studentEnrollmentsMap.set(studentId, []);
          }
          studentEnrollmentsMap.get(studentId)!.push(enr);
        }
      });

      // Map quiz attempts by student
      const studentQuizAttemptsMap = new Map<number, any[]>();
      quizAttempts.forEach((qa: any) => {
        const studentId = qa.student?.id;
        if (studentId) {
          if (!studentQuizAttemptsMap.has(studentId)) {
            studentQuizAttemptsMap.set(studentId, []);
          }
          studentQuizAttemptsMap.get(studentId)!.push(qa);
        }
      });

      // Calculate aggregated metrics for each student
      const leaderboardData = students.map((student: any) => {
        const studentId = student.id;

        // A. Quiz calculations
        const attempts = studentQuizAttemptsMap.get(studentId) || [];
        const totalAttempts = attempts.length;
        const quizGroups = new Map<string, any[]>();
        
        let totalViolationScore = 0;
        let totalViolationsCount = 0;
        let totalScoreSum = 0;
        let highestScore = 0;
        let totalPercentageSum = 0;
        let quizzesPassed = 0;

        attempts.forEach((att: any) => {
          const qId = att.quiz?.documentId || String(att.quiz?.id || 'unknown');
          if (!quizGroups.has(qId)) quizGroups.set(qId, []);
          quizGroups.get(qId)!.push(att);

          const vScore = att.violationScore || 0;
          totalViolationScore += vScore;
          if (att.violationsLog && Array.isArray(att.violationsLog)) {
            totalViolationsCount += att.violationsLog.length;
          } else if (vScore > 0) {
            totalViolationsCount += 1;
          }

          const score = att.score || 0;
          const pct = att.percentage || 0;
          totalScoreSum += score;
          totalPercentageSum += pct;
          if (score > highestScore) highestScore = score;
          if (pct >= 60) quizzesPassed++;
        });

        const uniqueQuizzesTaken = quizGroups.size;
        const totalRetakesCount = Math.max(0, totalAttempts - uniqueQuizzesTaken);
        const averageQuizPercentage = totalAttempts > 0 ? Math.round(totalPercentageSum / totalAttempts) : 0;

        // B. Course completion calculations
        const userEnrollments = studentEnrollmentsMap.get(studentId) || [];
        const completedLessonSet = studentProgressMap.get(studentId) || new Set<string>();
        const totalLessonsCompleted = completedLessonSet.size;
        
        let fullyCompletedCourses = 0;
        let totalEnrolledCourses = userEnrollments.length;

        userEnrollments.forEach((enr: any) => {
          const course = enr.course;
          if (course && course.lessons && course.lessons.length > 0) {
            const courseLessonDocIds = course.lessons.map((l: any) => l.documentId || String(l.id));
            const allFinished = courseLessonDocIds.every((id: string) => completedLessonSet.has(id));
            if (allFinished) fullyCompletedCourses++;
          }
        });

        // C. Multi-Factor Leaderboard Score
        // 1. Quiz Score: +10 pts per raw mark + 15 pts per passed quiz + 0.5x avg percentage
        const quizPoints = Math.round((totalScoreSum * 10) + (quizzesPassed * 15) + (averageQuizPercentage * 0.5));
        
        // 2. Course Completion: +50 pts per fully finished course + 5 pts per completed lesson
        const coursePoints = (fullyCompletedCourses * 50) + (totalLessonsCompleted * 5);
        
        // 3. Violation Deductions: -5 pts per violation score point
        const violationPenalty = totalViolationScore * 5;

        // 4. Retakes Factor: -2 pts per repeated retake
        const retakePenalty = totalRetakesCount * 2;

        const totalPoints = Math.max(0, quizPoints + coursePoints - violationPenalty - retakePenalty);

        return {
          id: student.id,
          documentId: student.documentId,
          username: student.username,
          avatar: student.avatar || null,
          createdAt: student.createdAt,
          leaderboardPoints: totalPoints,
          metrics: {
            quizPoints,
            coursePoints,
            violationPenalty,
            retakePenalty
          },
          quizPerformance: {
            totalMarks: totalScoreSum,
            highestScore,
            quizzesPassed,
            averagePercentage: averageQuizPercentage,
            totalQuizzesAttempted: totalAttempts,
            uniqueQuizzesCount: uniqueQuizzesTaken
          },
          courseCompletion: {
            totalEnrolled: totalEnrolledCourses,
            fullyCompletedCourses,
            totalLessonsCompleted
          },
          violations: {
            totalViolationScore,
            totalViolationsCount
          },
          retakes: {
            totalRetakesCount
          }
        };
      });

      // Sort by totalPoints descending, with comprehensive tie-breakers
      leaderboardData.sort((a: any, b: any) => {
        if (b.leaderboardPoints !== a.leaderboardPoints) return b.leaderboardPoints - a.leaderboardPoints;
        if (b.quizPerformance.totalMarks !== a.quizPerformance.totalMarks) return b.quizPerformance.totalMarks - a.quizPerformance.totalMarks;
        if (b.courseCompletion.fullyCompletedCourses !== a.courseCompletion.fullyCompletedCourses) return b.courseCompletion.fullyCompletedCourses - a.courseCompletion.fullyCompletedCourses;
        if (a.violations.totalViolationScore !== b.violations.totalViolationScore) return a.violations.totalViolationScore - b.violations.totalViolationScore;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      // Rank all students
      leaderboardData.forEach((item: any, idx: number) => {
        item.rank = idx + 1;
      });

      // Top 20
      const top20 = leaderboardData.slice(0, 20);

      // Locate current user's entry if logged in
      let myRankData = null;
      if (currentUser) {
        const found = leaderboardData.find((s: any) => s.id === currentUser.id);
        if (found) {
          myRankData = found;
        }
      }

      return ctx.send({
        data: {
          top20,
          totalParticipants: leaderboardData.length,
          myRank: myRankData
        }
      });

    } catch (err: any) {
      console.error('Error calculating leaderboard:', err);
      return ctx.internalServerError('Failed to calculate leaderboard');
    }
  }
};

