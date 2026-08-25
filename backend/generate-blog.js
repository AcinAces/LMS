const fs = require('fs');
const path = require('path');

const model = {
  name: 'blog',
  plural: 'blogs',
  displayName: 'Blog',
  attributes: {
    title: { type: 'string' },
    body: { type: 'richtext' },
    imgURL: { type: 'string' },
    author: { type: 'relation', relation: 'manyToOne', target: 'plugin::users-permissions.user' }
  }
};

const apiDir = path.join(__dirname, 'src', 'api');
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
  // Setting draftAndPublish to true handles the status(Published/draft) natively!
  options: { draftAndPublish: true },
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

console.log('Blog model generated successfully!');
