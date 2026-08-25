export default {
  routes: [
    {
      method: 'POST',
      path: '/check-username',
      handler: 'utility.checkUsername',
      config: {
        auth: false,
      },
    }
  ],
};
