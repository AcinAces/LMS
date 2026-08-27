export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    if (data.course) {
      const courseId = data.course.connect ? data.course.connect[0]?.documentId || data.course.connect[0]?.id || data.course.connect[0] : data.course;
      if (courseId) {
        const isNumeric = !isNaN(Number(courseId));
        const course = await strapi.db.query('api::course.course').findOne({
          where: isNumeric ? { id: Number(courseId) } : { documentId: courseId },
          populate: ['courseAuthor']
        });
        if (course && course.courseAuthor) {
          // If connect syntax is used for author relation
          data.author = course.courseAuthor.id;
        }
      }
    }
  },
  async beforeUpdate(event: any) {
    const { data } = event.params;
    if (data.course) {
      const courseId = data.course.connect ? data.course.connect[0]?.documentId || data.course.connect[0]?.id || data.course.connect[0] : data.course;
      if (courseId) {
        const isNumeric = !isNaN(Number(courseId));
        const course = await strapi.db.query('api::course.course').findOne({
          where: isNumeric ? { id: Number(courseId) } : { documentId: courseId },
          populate: ['courseAuthor']
        });
        if (course && course.courseAuthor) {
          data.author = course.courseAuthor.id;
        }
      }
    }
  }
};
