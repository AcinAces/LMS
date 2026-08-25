export default (plugin: any) => {
  if (plugin.contentTypes.user) {
    plugin.contentTypes.user.schema.attributes.studentID = {
      type: 'string',
      unique: true,
      configurable: false,
    };
  }
  return plugin;
};