export default () => {
  return async (ctx: any, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      ctx.request.header['x-forwarded-proto'] = 'https';
    }
    await next();
  };
};
