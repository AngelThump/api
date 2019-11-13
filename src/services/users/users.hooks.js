const { discard , iff, isProvider, disallow } = require('feathers-hooks-common');
const { setField } = require('feathers-authentication-hooks');
const { authenticate } = require('@feathersjs/authentication');
const { protect } = require('@feathersjs/authentication-local').hooks;

const restrictToOwner = [
  setField({
    from: 'params.user._id',
    as: 'params.query._id'
  })
];
module.exports = {
  before: {
    all: [],
    find: [ authenticate('jwt'), ...restrictToOwner ],
    get: [ ...restrictToOwner ],
    create: [],
    update: [ authenticate('jwt'), ...restrictToOwner, disallow('external') ],
    patch: [ authenticate('jwt'), ...restrictToOwner ],
    remove: [ authenticate('jwt'), ...restrictToOwner ]
  },

  after: {
    all: [
      protect('password')
    ],
    find: [],
    get: [],
    create: [],
    update: [iff(isProvider('external'), discard('streamkey', 'email', 'verifyToken', 'verifyExpires', 'verifyChanges', 'resetToken', 'resetExpires', 'streamPassword', 'ingestServer', 'bans', 'ingest')),],
    patch: [],
    remove: [iff(isProvider('external'), discard('streamkey', 'email', 'verifyToken', 'verifyExpires', 'verifyChanges', 'resetToken', 'resetExpires', 'streamPassword', 'ingestServer', 'bans', 'ingest')),]
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
