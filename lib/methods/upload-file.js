'use strict';

const path = require('path');

const constants = require('../constants');
const utils = require('../utils');

/**
 * This callback runs when a file upload has finished.
 *
 * @callback uploadFileCallback
 *
 * @param {Error} err - If the file upload failed for some reason, this will be
 *  a non-null value.
 */

function uploadFileWrapper(req) {
  let s3Bucket = req.app.get('s3Bucket');
  let s3Client = req.app.get('s3Client');

  /**
   * Upload the specified source file to Amazon S3 with the specified ACL.
   *
   * @method
   *
   * @param {string} filePath - The path of the local file to upload.
   * @param {string} [acl=private] - The S3 ACL to use when storing this file. Can
   *  be one of: private | public-read | public-read-write | authenticated-read |
   *  aws-exec-read | bucket-owner-read | bucket-owner-full-control. See S3 docs
   *  for more detail: https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html
   * @param {uploadFileCallback} cb - The callback that handles the response.
   */
  return (filePath, acl, callback) => {
    if (acl && !callback) {
      callback = acl;
      acl = constants.DEFAULT_ACL;
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
          href: constants.AWS_S3_BASE_URL + s3Bucket + '/' + userId + '/' + fileName,
          lastModified: new Date().toJSON()
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
