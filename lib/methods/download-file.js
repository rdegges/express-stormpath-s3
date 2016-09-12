'use strict';

const utils = require('../utils');

function downloadFileWrapper(req) {
  let s3Bucket = req.app.get('s3Bucket');
  let s3Client = req.app.get('s3Client');

  return (fileName, destination, callback) => {
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
};

module.exports = downloadFileWrapper;
