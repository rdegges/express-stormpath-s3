"use strict";

const AWS = require("aws-sdk");
const async = require("async");
const uuid = require("uuid4");

/**
 * Generate a globally unique random name for testing purposes.
 *
 * @private
 */
function generateRandomName() {
  return "express-stormpath-s3-" + uuid();
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

  s3Client.createBucket({ Bucket: name }, (err) => {
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
function destroyS3Bucket(name, callback) {
  let s3Client = createS3Client();

  async.series([
    function(cb) {
      s3Client.listObjects({
        Bucket: name,
      }, (err, data) => {
        if (err) {
          return cb(err);
        }

        async.each(data.Contents, (obj, c) => {
          let key = obj.Key;

          s3Client.deleteObject({
            Bucket: name,
            Key: key
          }, (err) => {
            if (err) {
              return c(err);
            }

            c();
          });
        }, (err) => {
          if (err) {
            return cb(err);
          }

          cb();
        });
      });
    },
    function(cb) {
      s3Client.deleteBucket({ Bucket: name }, (err) => {
        if (err) {
          return cb(err);
        }

        cb();
      });
    }
  ], (err) => {
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

        store.delete((err) => {
          if (err) {
            return cb(err);
          }

          cb();
        });
      });
    }, (err) => {
      if (err) {
        return callback(err);
      }

      application.delete((err) => {
        if (err) {
          return callback(err);
        }

        callback();
      });
    });
  });
}

/**
 * Create a Stormpath Account in the given Application. Used for testing.
 *
 * @private
 */
function createStormpathAccount(application, callback) {
  let name = generateRandomName();

  application.createAccount({
    givenName: name,
    surname: name,
    email: name + "@test.com",
    password: "0HIthere!0"
  }, (err, account) => {
    if (err) {
      return callback(err);
    }

    callback(null, account);
  });
}

module.exports = {
  createS3Bucket: createS3Bucket,
  createS3Client: createS3Client,
  createStormpathAccount: createStormpathAccount,
  createStormpathApplication: createStormpathApplication,
  destroyS3Bucket: destroyS3Bucket,
  destroyStormpathApplication: destroyStormpathApplication
};
