import type { Core } from '@strapi/strapi';

export default {
  register({ strapi }: { strapi: Core.Strapi }) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      const roleService = strapi.plugin('users-permissions').service('role');
      const roles = await roleService.find();
      
      // 1. Rename default Authenticated role to Student
      const authRole = roles.find((r: any) => r.type === 'authenticated');
      if (authRole && authRole.name !== 'Student') {
        await roleService.updateRole(authRole.id, {
          ...authRole,
          name: 'Student',
          description: 'Default role given to registered students',
        });
        strapi.log.info('Updated default Authenticated role to Student');
      }

      // 2. Create Instructor Role if missing
      const instructorRole = roles.find((r: any) => r.name === 'Instructor');
      if (!instructorRole) {
        await roleService.createRole({
          name: 'Instructor',
          description: 'Can manage own courses and lessons',
          type: 'instructor',
        });
        strapi.log.info('Created Instructor role');
      }

      // 3. Create Content Manager Role if missing
      const cmRole = roles.find((r: any) => r.name === 'Content Manager');
      if (!cmRole) {
        await roleService.createRole({
          name: 'Content Manager',
          description: 'Can manage all courses and lessons',
          type: 'content_manager',
        });
        strapi.log.info('Created Content Manager role');
      }

      // 4. Grant Lesson Chat, Progress, and Core API permissions to roles
      const allRoles = await roleService.find();
      for (const role of allRoles) {
        if (['authenticated', 'instructor', 'content_manager', 'admin'].includes(role.type)) {
          const roleId = role.id;
          const actionsToGrant = [
            'api::lesson-message.chat.getChat',
            'api::lesson-message.chat.sendMessage',
            'api::lesson-message.chat.markRead',
            'api::lesson-message.chat.getStudents',
            'api::lesson-message.chat.getNotifications',
            'api::lesson-progress.lesson-progress.find',
            'api::lesson-progress.lesson-progress.findOne',
            'api::lesson-progress.lesson-progress.create',
            'api::lesson-progress.lesson-progress.update',
            'api::lesson-progress.lesson-progress.sync',
            'api::quiz-attempt.quiz-attempt.find',
            'api::quiz-attempt.quiz-attempt.findOne',
            'api::quiz-attempt.quiz-attempt.start',
            'api::quiz-attempt.quiz-attempt.violation',
            'api::quiz-attempt.quiz-attempt.submit',
            'api::quiz-attempt.quiz-attempt.autosave',
            'api::enrollment.enrollment.find',
            'api::enrollment.enrollment.findOne',
            'api::enrollment.enrollment.create',
            'api::review.review.find',
            'api::review.review.findOne',
            'api::review.review.create'
          ];
          
          let updated = false;
          for (const action of actionsToGrant) {
            const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
              where: { action, role: roleId }
            });
            if (!existing) {
              await strapi.db.query('plugin::users-permissions.permission').create({
                data: { action, role: roleId }
              });
              updated = true;
            }
          }
          if (updated) {
            strapi.log.info(`Granted core permissions to ${role.name}`);
          }
        }
      }

    } catch (error) {
      strapi.log.error('Failed to bootstrap roles:', error);
    }
  },
};
