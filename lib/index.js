"use strict";

const s3 = require("s3");

const constants = require("./constants");
const methods = require("./methods");
const utils = require("./utils");

/**
 * Initialize the expressStormpathS3 middleware.
 *
 * @function
 *
 * @param {Object} opts - Configuration options.
 * @param {string} opts.awsAccessKeyId - The AWS Access Key ID.
 * @param {string} opts.awsSecretAccessKey - The AWS Secret Access Key.
 * @param {string} opts.awsBucket - The AWS Bucket name to use.
 * @return {Function} An Express middleware function.
 */
function createExpressStormpathS3Middleware(opts) {
  let s3Bucket;
  let s3Client;

  utils.verifyOptions(opts);

  s3Bucket = opts.awsBucket || process.env.AWS_BUCKET;
  s3Client = s3.createClient({
    s3Options: {
      accessKeyId: opts.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: opts.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY,
      sslEnabled: true,
      computeChecksums: true
    }
  });

  function expressStormpathS3Middleware(req, res, next) {
    // If req.app isn"t set, it means Stormpath isn"t yet initialized, so we"ll
    // log an warning message and continue.
    if (!req.app || !req.app.get("stormpathApplication")) {
      console.warn("It looks like the express-stormpath middleware has not been initialized. express-stormpath-s3 will not run.");
      return next();
    }

    // If no user is available, there"s nothing to do, so we"ll continue.
    if (!req.user) {
      return next();
    }

    // Make the S3 Bucket / Client data available to the request object.  This
    // simplifies retrieving these values later in our AWS specific user
    // methods.
    req.app.set("s3Bucket", s3Bucket);
    req.app.set("s3Client", s3Client);

    // Attach all S3 methods to the user object.
    req.user.uploadFile = methods.uploadFile(req);
    req.user.downloadFile = methods.downloadFile(req);
    req.user.deleteFile = methods.deleteFile(req);
    req.user.syncFiles = methods.syncFiles(req);

    return next();
  }

  return expressStormpathS3Middleware;
}

module.exports = createExpressStormpathS3Middleware;
