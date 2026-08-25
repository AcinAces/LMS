export default {
  routes: [
    {
      method: 'POST',
      path: '/check-username',
      handler: 'utility.checkUsername',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/site-stats',
      handler: 'utility.getSiteStats',
      config: {
        auth: false,
      },
    }
  ],
};
