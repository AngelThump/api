
const { authenticate } = require('@feathersjs/authentication').hooks;
const { restrictToOwner } = require('feathers-authentication-hooks');
const { hashPassword, protect } = require('@feathersjs/authentication-local').hooks;
const commonHooks = require('feathers-hooks-common');

const restrict = [
  authenticate('jwt'),
  restrictToOwner({
    idField: '_id',
    ownerField: '_id'
  })
];

module.exports = {
  before: {
    all: [],
    find: [ authenticate('jwt') ],
    get: [ ...restrict ],
    create: [ hashPassword(), commonHooks.lowerCase('email','username') ],
    update: [ ...restrict, commonHooks.disallow('external'), commonHooks.lowerCase('email','username') ],
    patch: [ ...restrict, commonHooks.lowerCase('email','username'), 
    commonHooks.iff(
      commonHooks.isProvider('external'),
        commonHooks.preventChanges(true,
          'email',
          'isVerified',
          'verifyToken',
          'verifyShortToken',
          'verifyExpires',
          'verifyChanges',
          'resetToken',
          'resetShortToken',
          'resetExpires',
        ),
        hashPassword(),
        authenticate('jwt')
      )],
    remove: [ ...restrict ]
  },

  after: {
    all: [
      protect('password')
    ],
    find: [],
    get: [],
    create: [],
    update: [
    commonHooks.when(
        hook => hook.params.provider,
        commonHooks.discard('streamkey')
      )],
    patch: [],
    remove: [
    commonHooks.when(
        hook => hook.params.provider,
        commonHooks.discard('streamkey')
      )]
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
