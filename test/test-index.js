'use strict';

const assert = require('assert');

const stormpathS3 = require('../index');

describe('express-stormpath-s3', () => {
  it('should expose a middleware function', () => {
    assert(typeof stormpathS3 === 'function');
  });
});
