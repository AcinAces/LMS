export default {
  async checkUsername(ctx: any) {
    try {
      const { username } = ctx.request.body;
      
      if (!username) {
        return ctx.badRequest('Username is required');
      }

      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { username },
      });

      if (user) {
        return ctx.send({ available: false });
      }

      return ctx.send({ available: true });
    } catch (err) {
      return ctx.internalServerError('Something went wrong');
    }
  },

  async getSiteStats(ctx: any) {
    try {
      const studentCount = await strapi.db.query('plugin::users-permissions.user').count();
      return ctx.send({ studentCount });
    } catch (err) {
      return ctx.internalServerError('Something went wrong');
    }
  }
};
