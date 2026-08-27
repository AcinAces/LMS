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

      // 4. Grant Lesson Chat API permissions to roles
      const allRoles = await roleService.find();
      for (const role of allRoles) {
        if (['authenticated', 'instructor', 'content_manager'].includes(role.type)) {
          const roleId = role.id;
          const currentRole = await roleService.findOne(roleId);
          // Add custom chat controller permissions
          const actionsToGrant = [
            'api::lesson-message.chat.getChat',
            'api::lesson-message.chat.sendMessage',
            'api::lesson-message.chat.markRead',
            'api::lesson-message.chat.getStudents'
          ];
          
          let updated = false;
          // In Strapi 5, permissions are handled slightly differently.
          // The easiest way is to use the permissions service directly if available, or just log a reminder if not.
          // I will use strapi.db.query to safely insert if not exists.
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
            strapi.log.info(`Granted lesson-message permissions to ${role.name}`);
          }
        }
      }

    } catch (error) {
      strapi.log.error('Failed to bootstrap roles:', error);
    }
  },
};
