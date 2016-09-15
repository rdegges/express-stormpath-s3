'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid4');

/**
 * Generate a globally unique random name for testing purposes.
 *
 * @private
 */
function generateRandomName() {
  return 'express-stormpath-s3-' + uuid();
}

/**
 * Create an S3 Client.  This is used to help with testing.
 *
 * @private
 */
function createS3Client() {
  return new AWS.S3({
    params: {
      sslEnabled: true,
      computeChecksums: true
    }
  });
}

/**
 * Create an AWS S3 bucket, and return its name.  This is used to help with
 * testing.
 *
 * @private
 */
function createS3Bucket(callback) {
  let name = generateRandomName();
  let s3Client = createS3Client();

  s3Client.createBucket({ Bucket: name }, err => {
    if (err) {
      return callback(err);
    }

    return callback(null, name);
  });
}

/**
 * Delete an S3 bucket.  This is used to help with testing.
 *
 * @private
 */
function deleteS3Bucket(name, callback) {
  let s3Client = createS3Client();

  s3Client.deleteBucket({ Bucket: name }, err => {
    if (err) {
      return callback(err);
    }

    callback();
  });
}

/**
 * Create a Stormapth Application and Directory for testing purposes.
 *
 * @private
 */
function createStormpathApplication(client, callback) {
  let name = generateRandomName();

  client.createApplication({ name: name }, { createDirectory: true }, (err, app) => {
    if (err) {
      return callback(err);
    }

    callback(null, app);
  });
}

/**
 * Cleanup a Stormpath Application by destroying it completely.  Used for
 * testing purposes.
 *
 * @private
 */
function destroyStormpathApplication(application, callback) {
  application.getAccountStoreMappings((err, mappings) => {
    if (err) {
      return callback(err);
    }

    mappings.each((mapping, cb) => {
      mapping.getAccountStore((err, store) => {
        if (err) {
          return cb(err);
        }

        store.delete(err => {
          if (err) {
            return cb(err);
          }

          cb();
        });
      });
    }, err => {
      if (err) {
        return callback(err);
      }

      application.delete(err => {
        if (err) {
          return callback(err);
        }

        callback();
      });
    });
  });
}

module.exports = {
  createS3Bucket: createS3Bucket,
  createS3Client: createS3Client,
  createStormpathApplication: createStormpathApplication,
  deleteS3Bucket: deleteS3Bucket,
  destroyStormpathApplication: destroyStormpathApplication
};
