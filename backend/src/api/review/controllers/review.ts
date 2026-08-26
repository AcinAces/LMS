/**
 * review controller
 */
import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::review.review', ({ strapi }) => ({
  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('You must be logged in to submit a review');
    }

    const bodyData = ctx.request.body?.data || {};
    const { course, teachingRating, contentRating, difficultyRating, overallRating, feedback } = bodyData;

    if (!course || teachingRating === undefined || contentRating === undefined || difficultyRating === undefined || overallRating === undefined) {
      return ctx.badRequest('Missing required fields for review');
    }

    try {
      const entry = await strapi.documents('api::review.review').create({
        data: {
          teachingRating,
          contentRating,
          difficultyRating,
          overallRating,
          feedback: feedback || '',
          course: course,
          author: user.documentId || user.id, authorId: user.id, authorName: user.username || 'Anonymous',
        },
        status: 'published'
      });

      const self = this as any;
      const sanitized = await self.sanitizeOutput(entry, ctx);
      return self.transformResponse(sanitized);
    } catch (err: any) {
      console.error('Review creation error:', err);
      return ctx.badRequest('Could not create review: ' + err.message);
    }
  }
}));

