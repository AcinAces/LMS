export default {
  routes: [
    {
      method: 'POST',
      path: '/lesson-progresses/sync',
      handler: 'lesson-progress.sync',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
