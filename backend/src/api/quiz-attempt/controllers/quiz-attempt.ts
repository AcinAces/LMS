import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-attempt.quiz-attempt', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in to attempt a quiz');

    // Whitelist approach: Only 'authenticated' (Student role) can take quizzes.
    // Instructors, Content Managers, and Admins are strictly blocked.
    if (user.role?.type !== 'authenticated') {
      return ctx.forbidden('Only Students are allowed to take quizzes.');
    }

    if (!ctx.request.body.data) ctx.request.body.data = {};
    ctx.request.body.data.student = user.id;
    ctx.request.body.data.submittedAt = new Date();
    
    return super.create(ctx);
  }
}));