import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const courseId = ctx.request.body.data?.course;
      if (!courseId) return ctx.badRequest('Course ID is required to create a lesson');

      const course = await strapi.documents('api::course.course').findOne({
        documentId: courseId,
        populate: ['courseAuthor'],
      });

      if (!course || course.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only add lessons to your own courses.');
      }
    }
    
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const lesson = await strapi.documents('api::lesson.lesson').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!lesson) return ctx.notFound('Lesson not found');
      if (lesson.course?.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only edit lessons for your own courses.');
      }
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const lesson = await strapi.documents('api::lesson.lesson').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!lesson) return ctx.notFound('Lesson not found');
      if (lesson.course?.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only delete lessons for your own courses.');
      }
    }

    return super.delete(ctx);
  },

  async updateDuration(ctx) {
    try {
      const documentId = ctx.params.id;
      const { durationInSeconds } = ctx.request.body;
      
      if (!durationInSeconds) return ctx.badRequest('durationInSeconds is required');
      
      const lesson = await strapi.documents('api::lesson.lesson').findOne({ documentId });
      if (!lesson) return ctx.notFound('Lesson not found');
      
      // Only update if it doesn't have a duration already (to prevent abuse)
      if (!lesson.durationInSeconds || lesson.durationInSeconds === 0) {
        await strapi.documents('api::lesson.lesson').update({
          documentId,
          data: { durationInSeconds }
        });
      }
      return ctx.send({ ok: true });
    } catch (err) {
      return ctx.internalServerError('Failed to update duration');
    }
  }
}));