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
