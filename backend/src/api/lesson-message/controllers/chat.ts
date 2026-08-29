async function getAuthUser(ctx: any) {
  let user = ctx.state.user;
  if (!user) {
    const authHeader = ctx.request.header.authorization || ctx.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await (strapi as any).plugin('users-permissions').service('jwt').verify(token);
        if (decoded?.id) {
          user = await strapi.db.query('plugin::users-permissions.user').findOne({
            where: { id: decoded.id },
            populate: ['role']
          });
        }
      } catch (e) {}
    }
  } else if (!user.role?.type) {
    try {
      user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['role']
      });
    } catch (e) {}
  }
  return user;
}

async function getLessonWithAuthor(lessonDocIdOrId: string | number) {
  return await strapi.db.query('api::lesson.lesson').findOne({
    where: {
      $or: [
        { documentId: String(lessonDocIdOrId) },
        { id: isNaN(Number(lessonDocIdOrId)) ? -1 : Number(lessonDocIdOrId) }
      ]
    },
    populate: {
      course: {
        populate: ['courseAuthor']
      }
    }
  });
}

function checkChatPermissions(user: any, lesson: any) {
  if (!user || !lesson) {
    return { isAllowed: false, isAuthor: false, isStudent: false };
  }

  const roleType = user.role?.type;
  const course = lesson.course;
  const author = course?.courseAuthor;
  const authorId = typeof author === 'object' ? author?.id : author;
  const authorDocId = typeof author === 'object' ? author?.documentId : null;

  const isAuthor = roleType === 'instructor' && (
    user.id === authorId || (authorDocId && user.documentId === authorDocId)
  );

  const isStudent = roleType === 'authenticated';

  return {
    isAllowed: isAuthor || isStudent,
    isAuthor,
    isStudent,
    courseAuthorId: authorId
  };
}

export default {
  async getChat(ctx: any) {
    const { lessonId } = ctx.params;
    const user = await getAuthUser(ctx);
    if (!user) return ctx.unauthorized();

    const lesson = await getLessonWithAuthor(lessonId);
    if (!lesson) {
      return { data: [] };
    }

    const { isAllowed, isAuthor, isStudent } = checkChatPermissions(user, lesson);
    if (!isAllowed) {
      return ctx.forbidden('Access denied. Chat is strictly 1-to-1 between the course author and enrolled students.');
    }

    let targetStudentId: number | null = null;

    if (isAuthor) {
      if (!ctx.query.studentId) {
        return { data: [] };
      }
      targetStudentId = parseInt(ctx.query.studentId, 10);
    } else if (isStudent) {
      targetStudentId = user.id;
    }

    if (!targetStudentId) {
      return { data: [] };
    }

    const messages = await strapi.db.query('api::lesson-message.lesson-message').findMany({
      where: {
        lesson: lesson.id,
        student: targetStudentId
      },
      populate: ['sender', 'student'],
      orderBy: { createdAt: 'asc' }
    });

    return { data: messages || [] };
  },

  async getStudents(ctx: any) {
    const { lessonId } = ctx.params;
    const user = await getAuthUser(ctx);
    if (!user) return ctx.unauthorized();

    const lesson = await getLessonWithAuthor(lessonId);
    if (!lesson) {
      return { data: [] };
    }

    const { isAuthor } = checkChatPermissions(user, lesson);
    if (!isAuthor) {
      return ctx.forbidden('Only the course author can view student queries for this lesson.');
    }

    const messages = await strapi.db.query('api::lesson-message.lesson-message').findMany({
      where: { lesson: lesson.id },
      populate: ['student', 'sender']
    });

    const studentsMap = new Map();
    (messages || []).forEach((msg: any) => {
      if (msg.student && !studentsMap.has(msg.student.id)) {
        studentsMap.set(msg.student.id, { 
          ...msg.student, 
          hasUnread: false, 
          lastMessageAt: msg.createdAt 
        });
      }
      
      if (msg.student) {
        const student = studentsMap.get(msg.student.id);
        if (new Date(msg.createdAt) > new Date(student.lastMessageAt)) {
          student.lastMessageAt = msg.createdAt;
        }
        
        const isMsgUnread = (
          msg.isRead === false || 
          msg.isRead === 0 || 
          msg.isRead === '0' || 
          msg.isRead === 'false' || 
          msg.isRead === null
        );
        
        const senderId = msg.sender?.id || msg.sender;
        if (isMsgUnread && senderId !== user.id) {
          student.hasUnread = true;
        }
      }
    });

    const sortedStudents = Array.from(studentsMap.values()).sort((a: any, b: any) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });

    return { data: sortedStudents };
  },

  async sendMessage(ctx: any) {
    const { lessonId } = ctx.params;
    const { content, studentId } = ctx.request.body;
    const user = await getAuthUser(ctx);
    if (!user) return ctx.unauthorized();

    if (!content || !content.trim()) {
      return ctx.badRequest('Message content cannot be empty.');
    }

    const lesson = await getLessonWithAuthor(lessonId);
    if (!lesson) return ctx.notFound('Lesson not found');

    const { isAllowed, isAuthor, isStudent } = checkChatPermissions(user, lesson);
    if (!isAllowed) {
      return ctx.forbidden('Access denied. Only the course author and enrolled students can send messages.');
    }

    let targetStudentId: number | null = null;

    if (isAuthor) {
      if (!studentId) {
        return ctx.badRequest('studentId is required when instructor sends a message.');
      }
      targetStudentId = parseInt(studentId, 10);
    } else if (isStudent) {
      targetStudentId = user.id;
    }

    if (!targetStudentId) {
      return ctx.badRequest('Invalid student target for message.');
    }

    const message = await strapi.db.query('api::lesson-message.lesson-message').create({
      data: {
        content: content.trim(),
        isRead: false,
        lesson: lesson.id,
        student: targetStudentId,
        sender: user.id
      },
      populate: ['sender']
    });

    return { data: message };
  },

  async markRead(ctx: any) {
    const { lessonId } = ctx.params;
    const user = await getAuthUser(ctx);
    if (!user) return ctx.unauthorized();

    const lesson = await getLessonWithAuthor(lessonId);
    if (!lesson) {
      return { success: false };
    }

    const { isAllowed, isAuthor, isStudent } = checkChatPermissions(user, lesson);
    if (!isAllowed) {
      return ctx.forbidden('Access denied.');
    }

    let targetStudentId: number | null = null;
    if (isAuthor) {
      if (ctx.request.body.studentId) {
        targetStudentId = parseInt(ctx.request.body.studentId, 10);
      }
    } else if (isStudent) {
      targetStudentId = user.id;
    }

    if (!targetStudentId) {
      return { success: false };
    }

    const unreadMessages = await strapi.db.query('api::lesson-message.lesson-message').findMany({
      where: {
        lesson: lesson.id,
        student: targetStudentId,
        isRead: { $in: [false, 0, '0', 'false', null] },
        sender: { $ne: user.id }
      }
    });

    for (const msg of unreadMessages) {
      await strapi.db.query('api::lesson-message.lesson-message').update({
        where: { id: (msg as any).id },
        data: { isRead: true }
      });
    }

    return { success: true, count: unreadMessages.length };
  },

  async getNotifications(ctx: any) {
    const user = await getAuthUser(ctx);
    if (!user) return ctx.unauthorized();

    const roleType = user.role?.type;
    const isInstructor = roleType === 'instructor';
    const isStudent = roleType === 'authenticated';

    if (!isInstructor && !isStudent) {
      // Admins, Content Managers, and other staff do not receive 1-to-1 author/student notifications
      return { data: { unread: [], marked: [] } };
    }

    const filters: any = {
      $not: { sender: { id: user.id } }
    };

    if (isStudent) {
      filters.student = { id: user.id };
    } else if (isInstructor) {
      // Strictly filter to lessons of courses authored by THIS instructor
      filters.lesson = { course: { courseAuthor: { id: user.id } } };
    }

    const messages = await (strapi.entityService as any).findMany('api::lesson-message.lesson-message', {
      filters,
      populate: {
        lesson: { populate: ['course'] },
        student: true,
        sender: true
      },
      sort: { createdAt: 'desc' } as any,
      limit: 300
    });

    const unreadMap = new Map();
    const markedMap = new Map();
    
    (messages || []).forEach((msg: any) => {
      if (!msg.lesson || !msg.lesson.course) return;

      const key = isInstructor ? `${msg.lesson.id}-${msg.student?.id}` : `${msg.lesson.id}`;
      const isMsgUnread = (
        msg.isRead === false || 
        msg.isRead === 0 || 
        msg.isRead === '0' || 
        msg.isRead === 'false' || 
        msg.isRead === null
      );
      const targetMap = isMsgUnread ? unreadMap : markedMap;
      
      if (unreadMap.has(key)) return;
      
      if (!targetMap.has(key)) {
        const title = isInstructor 
          ? `${msg.student?.username || 'A student'} asked a question on Lesson ${msg.lesson.order || msg.lesson.title} of ${msg.lesson.course?.courseTitle || 'Course'}`
          : `You received a reply from the course author on Lesson ${msg.lesson.order || msg.lesson.title}`;
          
        targetMap.set(key, {
          type: 'lesson_chat',
          title,
          lessonId: msg.lesson.documentId,
          courseId: msg.lesson.course.documentId,
          studentId: isInstructor ? msg.student?.id : null,
          createdAt: msg.createdAt
        });
      }
    });

    const unread = Array.from(unreadMap.values());
    const marked = Array.from(markedMap.values());

    return { data: { unread, marked } };
  }
};
