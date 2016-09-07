'use strict';

const path = require('path');
const fs = require('fs');
const url = require('url');

const s3 = require('s3');

const helpers = require('./utils');
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

    req.user.uploadFile = function uploadFile(filePath, acl, callback) {
      if (acl && !callback) {
        callback = acl;
        acl = 'private';
      }

      let file = path.parse(filePath);
      let fileName = file.base;
      let userId = utils.getUserId(req.user.href);
      let uploader = s3Client.uploadFile({
        localFile: filePath,
        s3Params: {
          ACL: acl,
          Bucket: s3Bucket,
          Key: userId + '/' + fileName
        }
      });

      uploader.on('error', err => {
        return callback(err);
      });

      uploader.on('end', () => {
        req.user.getCustomData((err, data) => {
          if (err) {
            return callback(err);
          }

          if (!data.s3) {
            data.s3 = {};
          }

          data.s3[fileName] = {
            created: new Date().toJSON(),
            href: 'https://s3.amazonaws.com/' + s3Bucket + '/' + userId + '/' + fileName
          };

          data.save(err => {
            if (err) {
              return callback(err);
            }

            return callback();
          });
        });
      });
    };

    req.user.downloadFile = function downloadFile(fileName, destination, callback) {
      let userId = utils.getUserId(req.user.href);
      let downloader = s3Client.downloadFile({
        localFile: destination,
        s3Params: {
          Bucket: s3Bucket,
          Key: userId + '/' + fileName
        }
      });

      downloader.on('error', err => {
        return callback(err);
      });

      downloader.on('end', () => {
        return callback();
      });
    };

    req.user.deleteFile = function deleteFile(fileName, callback) {
      let userId = utils.getUserId(req.user.href);
      let deleter = s3Client.deleteObjects({
        Bucket: s3Bucket,
        Delete: {
          Objects: [{
            Key: userId + '/' + fileName
          }],
          Quiet: true
        }
      });

      deleter.on('error', err => {
        return callback(err);
      });

      deleter.on('end', () => {
        req.user.getCustomData((err, data) => {
          if (err) {
            return callback(err);
          }

          if (!data.s3) {
            return callback();
          }

          delete data.s3[fileName];
          data.save(err => {
            if (err) {
              return callback(err);
            }

            return callback();
          });
        });
      });
    };

    return next();
  };

  return expressStormpathS3Middleware;
}

module.exports = createExpressStormpathS3Middleware;
