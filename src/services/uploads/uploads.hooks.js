const dauria = require('dauria');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      context => {
        context.params.s3 = { 
          ACL: 'public-read',
          CacheControl: 'max-age=31536000'
        };
        if (!context.data.uri && context.params.file){
            const file = context.params.file;
            const uri = dauria.getBase64DataURI(file.buffer, file.mimetype);
            context.data = {uri: uri};
        }
      }
    ],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
    ],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
