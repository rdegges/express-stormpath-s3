'use strict';

const path = require('path');

const utils = require('../utils');

/**
 * This callback runs when a file upload has finished.
 *
 * @callback uploadFileCallback
 *
 * @param {Error} err - If the file upload failed for some reason, this will be
 *  a non-null value.
 * @param {Object} file - If the file upload was successful, this will be an
 *  object that contains the uploaded file's data.
 * @param {string} file.key - The absolute Amazon S3 file key.
 * @param {string} file.created - The absolute Amazon S3 bucket key.
 *

/**
 * Upload the specified source file to Amazon S3 with the specified ACL.
 *
 * @method
 *
 * @param {string} sourcePath - The path of the local file to upload.
 * @param {string} destinationPath - The S3 filename to store this file as.
 * @param {string} [acl=private] - The S3 ACL to use when storing this file. Can
 *  be one of: private | public-read | public-read-write | authenticated-read |
 *  aws-exec-read | bucket-owner-read | bucket-owner-full-control. See S3 docs
 *  for more detail: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html
 * @param {uploadFileCallback} cb - The callback that handles the response.
 */
function uploadFileWrapper(req) {
  let s3Bucket = req.app.get('s3Bucket');
  let s3Client = req.app.get('s3Client');

  return (filePath, acl, callback) => {
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
}

module.exports = uploadFileWrapper;
