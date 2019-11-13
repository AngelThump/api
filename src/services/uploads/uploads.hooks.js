const dauria = require('dauria');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      function(hook) {
          hook.params.s3 = { 
            ACL: 'public-read',
            CacheControl: 'max-age=31536000'
          };
          if (!hook.data.uri && hook.params.file){
              const file = hook.params.file;
              const uri = dauria.getBase64DataURI(file.buffer, file.mimetype);
              hook.data = {uri: uri};
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
    create: [],
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
