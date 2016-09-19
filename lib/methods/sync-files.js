"use strict";

const async = require("async");

const constants = require("../constants");
const utils = require("../utils");

/**
 * This callback runs when a file sync has finished.
 *
 * @callback syncFileCallback
 *
 * @param {Error} err - If the file sync failed for some reason, this will be
 *  a non-null value.
 */

function syncFilesWrapper(req) {
  let s3Bucket = req.app.get("s3Bucket");
  let s3Client = req.app.get("s3Client");

  /**
   * This method syncs all file metadata from S3 into the user"s local account.
   * This is useful to run every now and then, especially if you"re writing user
   * files to S3 from multiple processes that don"t rely on this library.
   *
   * @method
   *
   * @param {syncFilesCallback} cb - The callback that handles the response.
   */
  return (callback) => {
    let userId = utils.getUserId(req.user.href);
    let lister = s3Client.listObjects({
      s3Params: {
        Bucket: s3Bucket,
        Prefix: userId + "/"
      }
    });

    lister.on("error", (err) => {
      return callback(err);
    });

    lister.on("data", (data) => {
      async.each(data["Contents"], (fileData, cb) => {
        let fileName = fileData["Key"].split("/")[1];
        let lastModified = fileData["LastModified"];

        // If fileName is empty, this means we"re seeing the user"s directory in
        // S3, so we want to skip this entry all together.
        if (!fileName) {
          return cb();
        }

        req.user.getCustomData((err, data) => {
          if (err) {
            return cb(err);
          }

          if (!data.s3) {
            data.s3 = {};
          }

          data.s3[fileName] = {
            lastModified: lastModified.toJSON(),
            href: constants.AWS_S3_BASE_URL + s3Bucket + "/" + userId + "/" + fileName
          };

          data.save((err) => {
            if (err) {
              return cb(err);
            }

            return cb();
          });
        });
      }, (err) => {
        if (err) {
          console.warn(err);
        }
      });
    });

    lister.on("end", () => {
      return callback();
    });
  };
}

module.exports = syncFilesWrapper;
