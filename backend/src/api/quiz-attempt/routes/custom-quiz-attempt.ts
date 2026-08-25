export default {
  routes: [
    {
      method: 'POST',
      path: '/quiz-attempts/start',
      handler: 'quiz-attempt.start',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/quiz-attempts/:documentId/violation',
      handler: 'quiz-attempt.violation',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/quiz-attempts/:documentId/submit',
      handler: 'quiz-attempt.submit',
      config: { policies: [] }
    },
    {
      method: 'POST',
      path: '/quiz-attempts/:documentId/autosave',
      handler: 'quiz-attempt.autosave',
      config: { policies: [] }
    }
  ]
};
