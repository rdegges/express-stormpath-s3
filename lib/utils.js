"use strict";

/**
 * Return the Stormpath user"s unique ID given their Account HREF.
 *
 * @private
 *
 * @param {string} accountHref - The user"s Account HREF.
 * @returns {string} - The unique user ID.
 */
function getUserId(accountHref) {
  let splitHref = accountHref.split("/");

  return splitHref[splitHref.length - 1];
}

/**
 * Verify the S3 middleware user-supplied options to ensure they are valid.
 *
 * @private
 *
 * @param {Object} opts - Configuration options.
 * @param {string} opts.awsAccessKeyId - The AWS Access Key ID.
 * @param {string} opts.awsSecretAccessKey - The AWS Secret Access Key.
 * @param {string} opts.awsBucket - The AWS Bucket name to use.
 * @returns {Boolean} true if all options are valid, false otherwise.
 */
function verifyOptions(opts) {
  if (!(opts.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID)) {
    throw new Error("awsAccessKeyId is required.");
  }

  if (!(opts.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY)) {
    throw new Error("awsSecretAccessKey is required.");
  }

  if (!(opts.awsBucket || process.env.AWS_BUCKET)) {
    throw new Error("awsBucket is required.");
  }
}

module.exports = {
  getUserId,
  verifyOptions
};
