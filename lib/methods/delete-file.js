'use strict';

const utils = require('../utils');

function deleteFileWrapper(req) {
  let s3Bucket = req.app.get('s3Bucket');
  let s3Client = req.app.get('s3Client');

  return (fileName, callback) => {
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
}

module.exports = deleteFileWrapper;
