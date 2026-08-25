const fs = require('fs');
const path = require('path');

const models = [
  {
    name: 'course',
    plural: 'courses',
    displayName: 'Course',
    attributes: {
      courseTitle: { type: 'string' },
      courseTag: { type: 'string' },
      prerequisite: { type: 'relation', relation: 'oneToOne', target: 'api::course.course' },
      lessons: { type: 'relation', relation: 'oneToMany', target: 'api::lesson.lesson', mappedBy: 'course' },
      quizzes: { type: 'relation', relation: 'oneToMany', target: 'api::quiz.quiz', mappedBy: 'course' },
      enrollments: { type: 'relation', relation: 'oneToMany', target: 'api::enrollment.enrollment', mappedBy: 'course' }
    }
  },
  {
    name: 'lesson',
    plural: 'lessons',
    displayName: 'Lesson',
    attributes: {
      content: { type: 'richtext' },
      order: { type: 'integer' },
      course: { type: 'relation', relation: 'manyToOne', target: 'api::course.course', inversedBy: 'lessons' },
      lessonProgresses: { type: 'relation', relation: 'oneToMany', target: 'api::lesson-progress.lesson-progress', mappedBy: 'lesson' }
    }
  },
  {
    name: 'enrollment',
    plural: 'enrollments',
    displayName: 'Enrollment',
    attributes: {
      enrolledAt: { type: 'datetime' },
      student: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' },
      course: { type: 'relation', relation: 'manyToOne', target: 'api::course.course', inversedBy: 'enrollments' }
    }
  },
  {
    name: 'lesson-progress',
    plural: 'lesson-progresses',
    displayName: 'Lesson Progress',
    attributes: {
      completed: { type: 'boolean', default: false },
      completedAt: { type: 'datetime' },
      student: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' },
      lesson: { type: 'relation', relation: 'manyToOne', target: 'api::lesson.lesson', inversedBy: 'lessonProgresses' }
    }
  },
  {
    name: 'quiz',
    plural: 'quizzes',
    displayName: 'Quiz',
    attributes: {
      quizTitle: { type: 'string' },
      quizDescription: { type: 'text' },
      course: { type: 'relation', relation: 'manyToOne', target: 'api::course.course', inversedBy: 'quizzes' },
      questions: { type: 'relation', relation: 'oneToMany', target: 'api::quiz-question.quiz-question', mappedBy: 'quiz' },
      attempts: { type: 'relation', relation: 'oneToMany', target: 'api::quiz-attempt.quiz-attempt', mappedBy: 'quiz' }
    }
  },
  {
    name: 'quiz-question',
    plural: 'quiz-questions',
    displayName: 'Quiz Question',
    attributes: {
      questionText: { type: 'text' },
      quiz: { type: 'relation', relation: 'manyToOne', target: 'api::quiz.quiz', inversedBy: 'questions' },
      options: { type: 'relation', relation: 'oneToMany', target: 'api::mcq-option.mcq-option', mappedBy: 'question' }
    }
  },
  {
    name: 'mcq-option',
    plural: 'mcq-options',
    displayName: 'MCQ Option',
    attributes: {
      optionText: { type: 'text' },
      isCorrect: { type: 'boolean', default: false },
      question: { type: 'relation', relation: 'manyToOne', target: 'api::quiz-question.quiz-question', inversedBy: 'options' }
    }
  },
  {
    name: 'quiz-attempt',
    plural: 'quiz-attempts',
    displayName: 'Quiz Attempt',
    attributes: {
      score: { type: 'decimal' },
      totalQuestion: { type: 'integer' },
      percentage: { type: 'decimal' },
      submittedAt: { type: 'datetime' },
      student: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' },
      quiz: { type: 'relation', relation: 'manyToOne', target: 'api::quiz.quiz', inversedBy: 'attempts' },
      answers: { type: 'relation', relation: 'oneToMany', target: 'api::quiz-answer.quiz-answer', mappedBy: 'attempt' }
    }
  },
  {
    name: 'quiz-answer',
    plural: 'quiz-answers',
    displayName: 'Quiz Answer',
    attributes: {
      isCorrect: { type: 'boolean' },
      attempt: { type: 'relation', relation: 'manyToOne', target: 'api::quiz-attempt.quiz-attempt', inversedBy: 'answers' },
      question: { type: 'relation', relation: 'manyToOne', target: 'api::quiz-question.quiz-question' },
      selectedOption: { type: 'relation', relation: 'oneToOne', target: 'api::mcq-option.mcq-option' }
    }
  }
];

const apiDir = path.join(__dirname, 'src', 'api');

models.forEach(model => {
  const modelDir = path.join(apiDir, model.name);
  
  // Create directories
  ['content-types', 'controllers', 'routes', 'services'].forEach(folder => {
    fs.mkdirSync(path.join(modelDir, folder, folder === 'content-types' ? model.name : ''), { recursive: true });
  });

  // 1. schema.json
  const schema = {
    kind: 'collectionType',
    collectionName: model.plural,
    info: {
      singularName: model.name,
      pluralName: model.plural,
      displayName: model.displayName
    },
    options: { draftAndPublish: false },
    pluginOptions: {},
    attributes: model.attributes
  };
  fs.writeFileSync(path.join(modelDir, 'content-types', model.name, 'schema.json'), JSON.stringify(schema, null, 2));

  // 2. controller
  const controller = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('api::${model.name}.${model.name}');`;
  fs.writeFileSync(path.join(modelDir, 'controllers', `${model.name}.ts`), controller);

  // 3. routes
  const route = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('api::${model.name}.${model.name}');`;
  fs.writeFileSync(path.join(modelDir, 'routes', `${model.name}.ts`), route);

  // 4. services
  const service = `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('api::${model.name}.${model.name}');`;
  fs.writeFileSync(path.join(modelDir, 'services', `${model.name}.ts`), service);
});

console.log('All models generated successfully!');
