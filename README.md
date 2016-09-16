# express-stormpath-s3

*Amazon S3 file storage support for express-stormpath.*


## Installation

To install this library, use npm:

```console
$ npm install express-stormpath-s3
```

**NOTE**: This library depends on both [Express](https://expressjs.com/) and
[express-stormpath](http://docs.stormpath.com/nodejs/express/latest/).


## Initialization

Using this library is simple.  It needs to be installed as an express
middleware, and must be initialized AFTER express-stormpath in order to work
properly.

Here's an example application showing how to properly initialize it:

```javascript
'use strict';

const express = require('express');
const stormpath = require('express-stormpath');
const stormpathS3 = require('express-stormpath-s3');

let app = express();

// Include all static files here BEFORE express-stormpath.

// Initialize express-stormpath FIRST.
app.use(stormpath.init(app));

// Note: you need to have this middleware initialized after express-stormpath in
// order for this library to work.  This getUser middleware will retrieve the
// user object for every route.
app.use(stormpath.getUser);

// Make sure this middleware is initialized AFTER express-stormpath.
app.use(stormpathS3({
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsBucket: 'express-stormpath-s3-test'
}));

// Routes...

app.listen(process.env.PORT || 3000);
```


## Usage

Once you've initialized this library, you can use it like so:


### Uploading User Files

To upload a file for a particular user, you can call the `req.user.uploadFile`
method:

```javascript
app.post('/upload', stormpath.loginRequired, (req, res, next) => {
  req.user.uploadFile('./some-file.txt', err => {
    if (err) return next(err);
    res.send('file uploaded!');
  });
});
```

By default, all uploaded files will be stored privately in the S3 bucket.  If
you'd like to change the permissions of the upload file, you can specify the ACL
type as an optional second parameter:

```javascript
app.post('/upload', stormpath.loginRequired, (req, res, next) => {
  req.user.uploadFile('./some-file.txt', 'public-read', err => {
    if (err) return next(err);
    res.send('file uploaded!');
  });
});
```

The available ACL types are:

- private (*default*)
- public-read
- public-read-write
- authenticated-read
- aws-exec-read
- bucket-owner-read
- bucket-owner-full-control

**NOTE**: Due to the underlying S3 library we are using to make this
functionality possible, we only currently support storing user files in the US
Standard AWS region.  This will change in the future when the library we're
using supports other regions.


### Downloading User Files

To download a file for a particular user, you can call the
`req.user.downloadFile` method:

```javascript
app.get('/download', stormpath.loginRequired, (req, res, next) => {
  req.user.downloadFile('some-file.txt', './some-file.txt', err => {
    if (err) return next(err);
    res.send('file downloaded!');
  });
});
```


### Deleting User Files

To delete a file for a particular user, you can call the `req.user.deleteFile`
method:

```javascript
app.post('/delete', stormpath.loginRequired, (req, res, next) => {
  req.user.deleteFile('some-file.txt', err => {
    if (err) return next(err);
    res.send('file deleted!');
  });
});
```


### Keeping Files in Sync

If you have multiple processes that are storing files on behalf of users, and
want to ensure this file metadata is copied over in your Stormpath user accounts
appropriately, you can use the `req.user.syncFiles()` method to automate this
process.

This method will inspect your S3 bucket for the current user, and copy over all
file metadata ensuring it is fresh.

Here's an example of how to use it:

```javascript
app.post('/sync', stormpath.loginRequired, (req, res, next) => {
  req.user.syncFiles(err => {
    if (err) return next(err);
    res.send('files synced!');
  });
});
```


## How This Works

The way this library works is it patches several file management methods onto
the `req.user` object that express-stormpath provides.

When files are uploaded for a particular user, they are stored in the configured
S3 bucket under a subdirectory which is named after the user's Stormpath ID.

For example, if you have a Stormpath user whose ID is 'xDjxvIEs6OEE7nCBFuVXG',
your S3 bucket would contain a subdirectory named 'xDjxvIEs6OEE7nCBFuVXG' that
holds all uploaded files for that particular user.

When files are stored in S3 for a user, a reference to that file is also stored
in the Stormpath user's CustomData JSON dictionary.  This serves a purpose by
allowing us to later delete, re-upload, or list files that this user has created
in an efficient manner.  This also makes it easier to interact with user files
from other processes outside of your Express application.

For instance, let's say you uploaded a file called `some-file.txt` into a user's
account, that user's CustomData JSON would now look like this:

```json
{
  "s3": {
    "some-file.txt": {
      "created": "2016-09-02T21:25:55.002Z",
      "href": "https://s3.amazonaws.com/bucket-name/xDjxvIEs6OEE7nCBFuVXG/some-file.txt"
    }
  }
}
```

This allows you to easily track files for each user in a simple way, and
provides some basic metadata about files that you can use in your application.
