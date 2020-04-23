const { iff, isProvider, disallow } = require('feathers-hooks-common');
const { protect } = require('@feathersjs/authentication-local').hooks;
const dispatch = require('./dispatch');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [disallow()],
    update: [disallow()],
    patch: [disallow('external')],
    remove: [disallow()]
  },

  after: {
    all: [iff(isProvider('external'), dispatch()), protect('password')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [iff(isProvider('external'), dispatch()), protect('password')],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
