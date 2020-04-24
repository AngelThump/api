const { disallow } = require('feathers-hooks-common');
const dispatch = require('./dispatch');

module.exports = {
  before: {
    all: [disallow('external')],
    find: [context => {
      context.params.query.$sort = { viewer_count: -1 }
    }],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [dispatch()],
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
