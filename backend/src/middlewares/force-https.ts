export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      if (ctx.cookies) {
        ctx.cookies.secure = true;
      }
    }
    await next();
  };
};
