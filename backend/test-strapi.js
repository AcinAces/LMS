const { createStrapi } = require('@strapi/strapi');
createStrapi({ distDir: './dist' }).start().then(async (app) => {
  console.log('Strapi started.');
  try {
    const msgs = await app.entityService.findMany('api::lesson-message.lesson-message', {
      populate: ['student', 'sender', 'lesson']
    });
    console.log(JSON.stringify(msgs, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
});
