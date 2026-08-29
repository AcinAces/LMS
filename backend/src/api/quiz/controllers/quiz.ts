import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz.quiz', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const data = ctx.request.body.data || {};
    if (!data.quizTitle || typeof data.quizTitle !== 'string' || data.quizTitle.trim().length === 0) {
      return ctx.badRequest('Quiz title is required');
    }
    if (data.timeLimit !== undefined) {
      const timeNum = Number(data.timeLimit);
      if (isNaN(timeNum) || timeNum < 1 || !Number.isInteger(timeNum)) {
        return ctx.badRequest('Time limit must be a positive whole number of minutes (1 or greater)');
      }
      data.timeLimit = timeNum;
    }

    if (user.role?.type === 'instructor') {
      const courseInput = data.course;
      if (!courseInput) return ctx.badRequest('Course is required to create a quiz');

      let courseDocId = typeof courseInput === 'string' ? courseInput : null;
      if (!courseDocId && courseInput?.connect && Array.isArray(courseInput.connect)) {
        courseDocId = courseInput.connect[0];
      } else if (!courseDocId && typeof courseInput === 'object') {
        courseDocId = courseInput.documentId || courseInput.id;
      }

      if (!courseDocId) return ctx.badRequest('Course ID is required to create a quiz');

      const course = await strapi.documents('api::course.course').findOne({
        documentId: courseDocId,
        populate: ['courseAuthor'],
      });

      if (!course || (course.courseAuthor?.id !== user.id && course.courseAuthor?.documentId !== user.documentId)) {
        return ctx.unauthorized('You can only add quizzes to your own courses.');
      }
    }
    
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const data = ctx.request.body.data || {};
    if (data.timeLimit !== undefined) {
      const timeNum = Number(data.timeLimit);
      if (isNaN(timeNum) || timeNum < 1 || !Number.isInteger(timeNum)) {
        return ctx.badRequest('Time limit must be a positive whole number of minutes (1 or greater)');
      }
      data.timeLimit = timeNum;
    }

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const quiz = await strapi.documents('api::quiz.quiz').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!quiz) return ctx.notFound('Quiz not found');
      if (quiz.course?.courseAuthor?.id !== user.id && quiz.course?.courseAuthor?.documentId !== user.documentId) {
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