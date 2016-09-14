'use strict';

const assert = require('assert');

const AWS = require('aws-sdk');
const express = require('express');
const s3 = require('s3');
const uuid = require('uuid4');

const stormpathS3 = require('../index');

describe('express-stormpath-s3', () => {
  let bucket = uuid();
  let s3Client;

  before((done) => {
    s3Client = new AWS.S3({
      params: {
        sslEnabled: true,
        computeChecksums: true
      }
    });

    s3Client.createBucket({ Bucket: bucket }, (err, data) => {
      if (err) {
        return done(err);
      }

      return done();
    });
  });

  after((done) => {
    s3Client.deleteBucket({ Bucket: bucket }, (err, data) => {
      if (err) {
        return done(err);
      }

      return done();
    });
  });

  it('should expose a middleware function', () => {
    assert(typeof stormpathS3 === 'function');
  });

  it('should throw an error if the required options aren\'t specified', () => {
    let app = express();

    assert.throws(() => {
      app.use(stormpathS3({}));
    }, Error);
  });

  it('should log a warning to the console if express-stormpath isn\'t initialized', (done) => {
    let app = express();

    app.use(stormpathS3({

    }));
  });
});
