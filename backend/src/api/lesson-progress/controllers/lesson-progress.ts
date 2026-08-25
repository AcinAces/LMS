import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  // Override find to only return the logged-in user's progress
  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    // Use Document Service directly to bypass REST API validation
    // because Strapi rejects filtering on 'student' relation via REST
    const query = ctx.query || {};
    
    // We construct a query for the document service
    const filters: any = query.filters || {};
    filters.student = { id: { $eq: user.id } };

    const progresses = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
      filters,
      populate: query.populate as any,
    });

    const self = this as any;
    const sanitized = await self.sanitizeOutput(progresses, ctx);
    return { data: sanitized, meta: { pagination: { total: sanitized.length } } };
  },

  // Custom endpoint to safely sync progress without REST permission nightmares
  async sync(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const { lessonDocumentId, lastWatchedPosition, maxWatchedPosition, completed } = ctx.request.body || {};

    if (!lessonDocumentId) {
      return ctx.badRequest('lessonDocumentId is required.');
    }

    try {
      // Find if progress already exists for this lesson and user
      const existing = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
        filters: {
          lesson: { documentId: { $eq: lessonDocumentId } },
          student: { id: { $eq: user.id } }
        }
      });

      if (existing && existing.length > 0) {
        // Update existing
        const progressId = existing[0].documentId;
        const updated = await strapi.documents('api::lesson-progress.lesson-progress').update({
          documentId: progressId,
          data: {
            lastWatchedPosition: lastWatchedPosition,
            maxWatchedPosition: Math.max(maxWatchedPosition || 0, existing[0].maxWatchedPosition || 0),
            completed: completed || existing[0].completed,
          },
          status: 'published'
        });
        return { data: updated };
      } else {
        // Create new
        const created = await strapi.documents('api::lesson-progress.lesson-progress').create({
          data: {
            lesson: lessonDocumentId,
            student: user.documentId || user.id,
            lastWatchedPosition: lastWatchedPosition || 0,
            maxWatchedPosition: maxWatchedPosition || 0,
            completed: completed || false,
          },
          status: 'published'
        });
        return { data: created };
      }
    } catch (err: any) {
      console.error('Progress sync error:', err);
      return ctx.internalServerError('Could not sync progress', err.message);
    }
  }
}));
