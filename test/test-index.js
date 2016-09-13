'use strict';

const assert = require('assert');

const express = require('express');

const stormpathS3 = require('../index');

describe('express-stormpath-s3', () => {
  it('should expose a middleware function', () => {
    assert(typeof stormpathS3 === 'function');
  });

  it('should throw an error if the required options aren\'t specified', () => {
    let app = express();

    assert.throws(() => {
      app.use(stormpathS3({}));
    }, Error);
  });

  //it('should log a warning to the console if express-stormpath isn\'t initialized', (done) => {
  //  let app = express();

  //  app.use(stormpathS3({

  //  }));
  //});
});
