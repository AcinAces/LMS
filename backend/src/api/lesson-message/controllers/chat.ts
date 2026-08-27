export default {
  async getChat(ctx: any) {
    const { lessonId } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    let studentId = user.id;

    if (['admin', 'content_manager', 'instructor'].includes(user.role?.type)) {
      if (ctx.query.studentId) {
        studentId = parseInt(ctx.query.studentId, 10);
      } else {
        return { data: [] };
      }
    }
    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { documentId: lessonId }
    });
    
    if (!lesson) {
      return { data: [] };
    }

    const messages = await strapi.db.query('api::lesson-message.lesson-message').findMany({
      where: {
        lesson: lesson.id,
        student: studentId
      },
      populate: ['sender', 'student'],
      orderBy: { createdAt: 'asc' }
    });

    console.log(`[DIAGNOSTICS - getChat] Found messages count:`, messages?.length);

    return { data: messages };
  },

  async getStudents(ctx: any) {
    const { lessonId } = ctx.params;
    const user = ctx.state.user;
    if (!user || !['admin', 'content_manager', 'instructor'].includes(user.role?.type)) {
      return ctx.unauthorized();
    }

    console.log(`[DIAGNOSTICS - getStudents] lessonId (docId): ${lessonId}`);

    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { documentId: lessonId }
    });
    
    if (!lesson) {
      return { data: [] };
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
        // Keep the most recent message timestamp
        if (new Date(msg.createdAt) > new Date(student.lastMessageAt)) {
          student.lastMessageAt = msg.createdAt;
        }
        
        // If there's ANY unread message where sender is NOT the current user
        // SQLite booleans can be strangely cast in raw queries
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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { documentId: lessonId }
    });
    if (!lesson) return ctx.notFound('Lesson not found');

    const isStaff = ['admin', 'content_manager', 'instructor'].includes(user.role?.type);
    
    // Determine the student thread this belongs to
    const targetStudentId = isStaff ? (studentId || user.id) : user.id;

    const message = await strapi.db.query('api::lesson-message.lesson-message').create({
      data: {
        content,
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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    let studentId = user.id;
    const isStaff = ['admin', 'content_manager', 'instructor'].includes(user.role?.type);
    
    if (isStaff && ctx.request.body.studentId) {
      studentId = ctx.request.body.studentId;
    }

    const lesson = await strapi.db.query('api::lesson.lesson').findOne({
      where: { documentId: lessonId }
    });
    
    if (!lesson) {
      return { success: false };
    }

    // Find messages in this thread where the sender is NOT the current user and isRead is false
    const unreadMessages = await strapi.db.query('api::lesson-message.lesson-message').findMany({
      where: {
        lesson: lesson.id,
        student: studentId,
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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const isStaff = ['admin', 'content_manager', 'instructor'].includes(user.role?.type);

    const filters: any = {
      $not: { sender: { id: user.id } }
    };

    if (!isStaff) {
      filters.student = { id: user.id };
    } else {
      // Must be instructor of the course
      filters.lesson = { course: { courseAuthor: { id: user.id } } };
    }

    const messages = await strapi.entityService.findMany('api::lesson-message.lesson-message', {
      filters,
      populate: {
        lesson: { populate: ['course'] },
        student: true,
        sender: true
      },
      sort: { createdAt: 'desc' } as any,
      limit: 300
    } as any);

    const unreadMap = new Map();
    const markedMap = new Map();
    
    (messages || []).forEach((msg: any) => {
      if (!msg.lesson || !msg.lesson.course) return;

      const key = isStaff ? `${msg.lesson.id}-${msg.student?.id}` : `${msg.lesson.id}`;
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
        const title = isStaff 
          ? `${msg.student?.username || 'A student'} has a question on Lesson ${msg.lesson.order || msg.lesson.title} of ${msg.lesson.course?.courseTitle || 'Course'}`
          : `You received a reply for your question on Lesson ${msg.lesson.order || msg.lesson.title}`;
          
        targetMap.set(key, {
          type: 'lesson_chat',
          title,
          lessonId: msg.lesson.documentId,
          courseId: msg.lesson.course.documentId,
          studentId: isStaff ? msg.student?.id : null,
          createdAt: msg.createdAt
        });
      }
    });

    const unread = Array.from(unreadMap.values());
    const marked = Array.from(markedMap.values());

    return { data: { unread, marked } };
  }
};


