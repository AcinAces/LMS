import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::course.course', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    // Ensure the data object exists
    if (!ctx.request.body.data) {
      ctx.request.body.data = {};
    }

    // Automatically set the courseAuthor to the logged-in user
    if (user.role?.type === 'instructor') {
      ctx.request.body.data.courseAuthor = { connect: [user.documentId || user.id] };
    }
    
    return super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const course = await strapi.documents('api::course.course').findOne({
        documentId: documentId,
        populate: ['courseAuthor'],
      });

      if (!course) return ctx.notFound('Course not found');
      if (course.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only edit your own courses.');
      }
    }

    return super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in');

    if (user.role?.type === 'instructor') {
      const documentId = ctx.params.id;
      const course = await strapi.documents('api::course.course').findOne({
        documentId: documentId,
        populate: ['courseAuthor'],
      });

      if (!course) return ctx.notFound('Course not found');
      if (course.courseAuthor?.id !== user.id) {
        return ctx.unauthorized('You can only delete your own courses.');
      }
    }

    return super.delete(ctx);
  }
}));