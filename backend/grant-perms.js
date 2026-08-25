const { createStrapi } = require('@strapi/strapi');
const app = createStrapi();

app.load().then(async () => {
  try {
    const roleService = strapi.plugin('users-permissions').service('role');
    const roles = await roleService.find();
    
    // Find the roles
    const publicRole = roles.find(r => r.type === 'public');
    const authRole = roles.find(r => r.type === 'authenticated');

    if (publicRole) {
      // Find the permissions for public role
      const publicRoleWithPerms = await roleService.findOne(publicRole.id);
      publicRoleWithPerms.permissions['api::blog'] = {
        controllers: {
          blog: {
            find: { enabled: true },
            findOne: { enabled: true }
          }
        }
      };
      await roleService.updateRole(publicRole.id, publicRoleWithPerms);
      console.log('Granted to public');
    }
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});
