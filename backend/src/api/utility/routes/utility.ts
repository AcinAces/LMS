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
    },
    {
      method: 'POST',
      path: '/update-profile',
      handler: 'utility.updateProfile',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/leaderboard',
      handler: 'utility.getLeaderboard',
      config: {
        auth: false,
      },
    },
  ],
};
