import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  // Override find to only return the logged-in user's enrollments
  // We bypass super.find() because Strapi rejects filtering on 'student' relation via REST
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Use Document Service directly to bypass REST API validation
    const enrollments = await strapi.documents('api::enrollment.enrollment').findMany({
      filters: {
        student: { id: { $eq: user.id } },
      },
      populate: {
        course: true,
        student: true,
      },
    });

    // Transform to standard Strapi REST response format
    const self = this as any;
    const sanitized = await self.sanitizeOutput(enrollments, ctx);
    return { data: sanitized, meta: { pagination: { total: sanitized.length } } };
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to enroll');

    const bodyData = ctx.request.body?.data || {};
    const courseDocId = bodyData.course;

    if (!courseDocId) {
      return ctx.badRequest('Course ID is required');
    }

    // Check for duplicate using raw DB query (most reliable)
    const knex = strapi.db.connection;
    const existing = await knex('enrollments')
      .join('enrollments_course_lnk', 'enrollments.id', 'enrollments_course_lnk.enrollment_id')
      .join('courses', 'enrollments_course_lnk.course_id', 'courses.id')
      .join('enrollments_student_lnk', 'enrollments.id', 'enrollments_student_lnk.enrollment_id')
      .where('courses.document_id', courseDocId)
      .andWhere('enrollments_student_lnk.user_id', user.id)
      .first();

    if (existing) {
      return ctx.badRequest('You are already enrolled in this course.');
    }

    try {
      const entry = await strapi.documents('api::enrollment.enrollment').create({
        data: {
          course: courseDocId,
          student: user.documentId || user.id,
          enrolledAt: new Date(),
        },
        status: 'published'
      });

      const self = this as any;
      const sanitized = await self.sanitizeOutput(entry, ctx);
      return self.transformResponse(sanitized);
    } catch (err: any) {
      console.error('Enrollment creation error:', err);
      return ctx.badRequest('Could not create enrollment', err.message);
    }
  }
}));
