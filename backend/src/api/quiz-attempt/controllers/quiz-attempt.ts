import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::quiz-attempt.quiz-attempt', ({ strapi }) => ({
  async start(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    
    const { quizId } = ctx.request.body.data;
    if (!quizId) return ctx.badRequest('quizId required');

    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').create({
      data: {
        student: user.documentId,
        quiz: quizId,
        startedAt: new Date().toISOString(),
        status: 'in_progress',
        violationScore: 0,
        violationsLog: [] // this will now hold array of strings like ['fullscreen', 'blur', 'visibility']
      }
    });

    return { data: attempt };
  },

  async violation(ctx) {
    const { documentId } = ctx.params;
    const { type } = ctx.request.body.data; // 'fullscreen', 'blur', 'visibility'
    
    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').findOne({
      documentId
    });
    
    if (!attempt || attempt.status !== 'in_progress') {
      return ctx.badRequest('Attempt not active');
    }

    const currentLogs = (attempt.violationsLog as string[]) || [];
    if (currentLogs.includes(type)) {
      // violation already recorded
      return { data: attempt };
    }

    const newLogs = [...currentLogs, type];
    
    let penalty = 0;
    if (type === 'fullscreen') penalty = 2;
    else if (type === 'blur') penalty = 5;
    else if (type === 'visibility') penalty = 5;

    const currentScore = (attempt.violationScore as number) || 0;
    const newScore = currentScore + penalty;
    
    const updated = await strapi.documents('api::quiz-attempt.quiz-attempt').update({
      documentId,
      data: {
        violationScore: newScore,
        violationsLog: newLogs
      }
    });
    
    return { data: updated };
  },

  async autosave(ctx) {
    return { data: { ok: true } };
  },

  async submit(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    
    const { documentId } = ctx.params;
    const { answers } = ctx.request.body.data;

    const attempt = await strapi.documents('api::quiz-attempt.quiz-attempt').findOne({
      documentId,
      populate: ['quiz', 'quiz.questions', 'quiz.questions.options']
    });

    if (!attempt || attempt.status !== 'in_progress') {
      return ctx.badRequest('Attempt not active or already submitted');
    }

    const quiz = attempt.quiz;
    if (!quiz) return ctx.badRequest('Quiz not found');

    let baseScore = 0;
    let totalQuestions = quiz.questions?.length || 0;
    const answerRecordsToCreate = [];

    if (quiz.questions) {
      for (const q of quiz.questions) {
        const selectedOptDocId = answers[q.documentId];
        const selectedOpt = q.options?.find(o => o.documentId === selectedOptDocId);
        
        let isCorrect = false;
        if (selectedOpt && selectedOpt.isCorrect) {
          baseScore += 1;
          isCorrect = true;
        }
        
        if (selectedOptDocId) {
          answerRecordsToCreate.push({
            question: q.documentId,
            selectedOption: selectedOptDocId,
            isCorrect,
            attempt: documentId
          });
        }
      }
    }

    const violationScore = attempt.violationScore || 0;
    const logs = (attempt.violationsLog as string[]) || [];
    
    let finalScore = baseScore - violationScore;
    
    // Auto-cancel rule: if 3 distinct violations occurred, score is 0
    if (logs.length >= 3) {
      finalScore = 0;
    } else if (finalScore < 0) {
      finalScore = 0;
    }
    
    const percentage = totalQuestions > 0 ? (finalScore / totalQuestions) * 100 : 0;

    const updatedAttempt = await strapi.documents('api::quiz-attempt.quiz-attempt').update({
      documentId,
      data: {
        score: finalScore,
        percentage,
        totalQuestion: totalQuestions,
        status: 'submitted',
        submittedAt: new Date().toISOString()
      }
    });

    for (const record of answerRecordsToCreate) {
      await strapi.documents('api::quiz-answer.quiz-answer').create({
        data: record
      });
    }

    return { data: updatedAttempt };
  }
}));
