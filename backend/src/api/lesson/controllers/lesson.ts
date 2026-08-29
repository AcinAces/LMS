import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson.lesson', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const data = ctx.request.body.data || {};
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      return ctx.badRequest('Lesson title is required');
    }
    if (!data.youtubeVideoId || typeof data.youtubeVideoId !== 'string' || data.youtubeVideoId.trim().length === 0) {
      return ctx.badRequest('YouTube video ID or URL is required');
    }
    if (data.order !== undefined) {
      const orderNum = Number(data.order);
      if (isNaN(orderNum) || orderNum < 1 || !Number.isInteger(orderNum)) {
        return ctx.badRequest('Lesson order must be a positive whole number (1 or greater)');
      }
      data.order = orderNum;
    }

    if (user.role?.type === 'instructor') {
      const courseInput = data.course;
      if (!courseInput) return ctx.badRequest('Course is required to create a lesson');

      let courseDocId = typeof courseInput === 'string' ? courseInput : null;
      if (!courseDocId && courseInput?.connect && Array.isArray(courseInput.connect)) {
        courseDocId = courseInput.connect[0];
      } else if (!courseDocId && typeof courseInput === 'object') {
        courseDocId = courseInput.documentId || courseInput.id;
      }

      if (!courseDocId) return ctx.badRequest('Course ID is required to create a lesson');

      const course = await strapi.documents('api::course.course').findOne({
        documentId: courseDocId,
        populate: ['courseAuthor'],
      });

      if (!course || (course.courseAuthor?.id !== user.id && course.courseAuthor?.documentId !== user.documentId)) {
        return ctx.unauthorized('You can only add lessons to your own courses.');
      }
    }
    
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    const data = ctx.request.body.data || {};
    if (data.order !== undefined) {
      const orderNum = Number(data.order);
      if (isNaN(orderNum) || orderNum < 1 || !Number.isInteger(orderNum)) {
        return ctx.badRequest('Lesson order must be a positive whole number (1 or greater)');
      }
      data.order = orderNum;
    }

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const lesson = await strapi.documents('api::lesson.lesson').findOne({
        documentId: documentId,
        populate: { course: { populate: ['courseAuthor'] } },
      });

      if (!lesson) return ctx.notFound('Lesson not found');
      if (lesson.course?.courseAuthor?.id !== user.id && lesson.course?.courseAuthor?.documentId !== user.documentId) {
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