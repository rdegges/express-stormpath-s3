'use strict';

const utils = require('../utils');

/**
 * This callback runs when a file download has finished.
 *
 * @callback downloadFileCallback
 *
 * @param {Error} err - If the file download failed for some reason, this will be
 *  a non-null value.
 */

function downloadFileWrapper(req) {
  let s3Bucket = req.app.get('s3Bucket');
  let s3Client = req.app.get('s3Client');

  /**
   * Download the specified file from Amazon S3.
   *
   * @method
   *
   * @param {string} fileName - The name of the file to download.
   * @param {string} destination - The name of the local file to create. For
   *  example: './avatar.png'.
   * @param {downloadFileCallback} cb - The callback that handles the response.
   */
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
}

module.exports = downloadFileWrapper;
