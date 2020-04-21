const assert = require('assert');
const app = require('../../src/app');

describe('\'transcodes\' service', () => {
  it('registered the service', () => {
    const service = app.service('transcodes');

    assert.ok(service, 'Registered the service');
  });
});
