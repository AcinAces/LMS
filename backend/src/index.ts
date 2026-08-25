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

    } catch (error) {
      strapi.log.error('Failed to bootstrap roles:', error);
    }
  },
};
