export default {
  routes: [
    {
      method: 'GET',
      path: '/lesson-messages/chat/:lessonId',
      handler: 'chat.getChat',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/lesson-messages/chat/:lessonId',
      handler: 'chat.sendMessage',
      config: {
        policies: [],
      },
    },
    {
      method: 'PUT',
      path: '/lesson-messages/chat/:lessonId/read',
      handler: 'chat.markRead',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/lesson-messages/notifications',
      handler: 'chat.getNotifications',
      config: {
        policies: [],
      },
    },
    {
      method: 'GET',
      path: '/lesson-messages/chat/:lessonId/students',
      handler: 'chat.getStudents',
      config: {
        policies: [],
      },
    }
  ],
};
