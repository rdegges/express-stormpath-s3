'use strict';

/**
 * The default ACL for all newly uploaded files.
 *
 * @constant
 * @type {String}
 * @default
 */
const DEFAULT_ACL = 'private';

/**
 * The AWS S3 base URL used to generate file URLs.
 *
 * @constant
 * @type {String}
 * @default
 */
const AWS_S3_BASE_URL = 'https://s3.amazonaws.com/';

module.exports = {
  AWS_S3_BASE_URL: AWS_S3_BASE_URL,
  DEFAULT_ACL: DEFAULT_ACL
};
