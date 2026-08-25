import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::enrollment.enrollment', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to enroll');

    // Only 'student' (or 'authenticated' which we renamed to Student) can enroll
    // Instructors, Content Managers, and Admins cannot.
    if (user.role?.type === 'instructor' || user.role?.type === 'content_manager') {
      return ctx.forbidden('Instructors and Content Managers cannot enroll in courses.');
    }

    // Automatically set the student relation to the logged-in user
    if (!ctx.request.body.data) ctx.request.body.data = {};
    ctx.request.body.data.student = user.id;
    ctx.request.body.data.enrolledAt = new Date();
    
    return super.create(ctx);
  }
}));