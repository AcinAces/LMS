export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      ctx.request.secure = true;
      ctx.secure = true;
      ctx.request.protocol = 'https';
    }
    await next();
  };
};
