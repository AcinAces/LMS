import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required to create a quiz');

      const course = await strapi.documents('api::course.course').findOne({
        documentId: courseId,
        populate: ['courseAuthor'],
      });

      if (!course || course.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only add quizzes to your own courses.');
      }
    }
    
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const quiz = await strapi.documents('api::quiz.quiz').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!quiz) return ctx.notFound('Quiz not found');
      if (quiz.course?.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only edit quizzes for your own courses.');
      }
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const quiz = await strapi.documents('api::quiz.quiz').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!quiz) return ctx.notFound('Quiz not found');
      if (quiz.course?.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only delete quizzes for your own courses.');
      }
    }

    return super.delete(ctx);
  }
}));