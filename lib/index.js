'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

const s3 = require('s3');

const utils = require('./utils');
const methods = require('./methods');
const verify = require('./verify');

/**
 * Initialize the expressStormpathS3 middleware.
 *
 * @function
 *
 * @param {Object} opts - expressStormpathS3 configuration options.
 * @return {Function} An Express middleware function.
 */
function createExpressStormpathS3Middleware(opts) {
  let s3Bucket;
  let s3Client;

  verify(opts);

  s3Bucket = opts.awsBucket || process.env.AWS_BUCKET;
  s3Client = s3.createClient({
    s3Options: {
      accessKeyId: opts.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: opts.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      region: opts.awsRegion || process.env.AWS_REGION || 'us-east-1',
      sslEnabled: true,
      computeChecksums: true
    }
  });

  function expressStormpathS3Middleware(req, res, next) {
    // If req.app isn't set, it means Stormpath isn't yet initialized, so we'll
    // log an warning message and continue.
    if (!req.app || !req.app.get('stormpathApplication')) {
      console.warn('It looks like the express-stormpath middleware has not been initialized. express-stormpath-s3 will not run.');
      return next();
    }

    // If no user is available, there's nothing to do, so we'll continue.
    if (!req.user) {
      return next();
    }

    req.app.set('s3Bucket', s3Bucket);
    req.app.set('s3Client', s3Client);

    req.user.uploadFile = methods.uploadFile(req);
    req.user.downloadFile = methods.downloadFile(req);
    req.user.deleteFile = methods.deleteFile(req);

    return next();
  };

  return expressStormpathS3Middleware;
}

module.exports = createExpressStormpathS3Middleware;
