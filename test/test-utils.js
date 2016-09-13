'use strict';

const assert = require('assert');

const utils = require('../lib/utils');

describe('getUserId', () => {
  it('should return a user ID when given an href', () => {
    assert(utils.getUserId('https://api.stormpath.com/v1/accounts/xxx') === 'xxx');
  });

  it('should return an empty string if an empty string is given', () => {
    assert(utils.getUserId('') === '');
  });
});
