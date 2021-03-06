"use strict";

const assert = require("assert");

const AWS = require("aws-sdk");
const async = require("async");
const express = require("express");
const s3 = require("s3");
const request = require("supertest");
const sinon = require("sinon");
const sp = require("stormpath");
const stormpath = require("express-stormpath");
const tmp = require("tmp");
const uuid = require("uuid4");

const stormpathS3 = require("../index");
const utils = require("./utils");

tmp.setGracefulCleanup();

describe("express-stormpath-s3", () => {
  describe("exports", () => {
    it("should expose a middleware function", () => {
      assert(typeof stormpathS3 === "function");
    });
  });

  describe("constructor", () => {
    it("should throw an error if the required options aren\"t specified", () => {
      let app = express();

      assert.throws(() => {
        app.use(stormpathS3());
      }, Error);
    });
  });

  describe("initialization", () => {
    beforeEach((done) => {
      this.spClient = new sp.Client();
      this.sinon = sinon.sandbox.create();

      utils.createStormpathApplication(this.spClient, (err, app) => {
        if (err) {
          return done(err);
        }

        this.spApplication = app;
        done();
      });
    });

    afterEach((done) => {
      this.sinon.restore();

      utils.destroyStormpathApplication(this.spApplication, (err) => {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    it("should log a warning to the console if express-stormpath isn\"t initialized", (done) => {
      let app = express();

      app.use(stormpathS3({ awsBucket: "bucket" }));

      app.get("/", (req, res) => {
        res.send("hi");
      });

      this.sinon.stub(console, "warn");
      request(app).get("/").expect(200, () => {
        assert(console.warn.calledOnce);
        done();
      });
    });

    it("should not run if no user object is present", (done) => {
      let app = express();

      app.use(stormpath.init(app, {
        application: {
          href: this.spApplication.href
        }
      }));
      app.use(stormpathS3({ awsBucket: "bucket" }));

      app.get("/", (req, res) => {
        assert(!req.app.get("s3Bucket"));
        assert(!req.app.get("s3Client"));

        res.send();
      });

      request(app).get("/").expect(200, () => {
        done();
      });
    });

    it("should run if a user object is present", (done) => {
      let agent;
      let app = express();

      app.use(stormpath.init(app, {
        application: {
          href: this.spApplication.href
        }
      }));
      app.use(stormpath.getUser);
      app.use(stormpathS3({ awsBucket: "bucket" }));

      app.get("/", stormpath.loginRequired, (req, res) => {
        assert(req.app.get("s3Bucket"));
        assert(req.app.get("s3Client"));
        assert(typeof req.user.uploadFile === "function");
        assert(typeof req.user.downloadFile === "function");
        assert(typeof req.user.deleteFile === "function");
        assert(typeof req.user.syncFiles === "function");

        res.send();
      });

      utils.createStormpathAccount(this.spApplication, (err, acc) => {
        if (err) {
          return done(err);
        }

        agent = request.agent(app);

        agent.post("/login")
          .type("form")
          .send({ login: acc.username })
          .send({ password: "0HIthere!0" })
          .expect(302, (err, res) => {
            if (err) {
              return done(err);
            }

            agent.get("/").expect(200, (err, res) => {
              if (err) {
                return done(err);
              }

              done();
            });
          });
      });
    });
  });

  describe("user methods", () => {
    let bucket, spApplication, spClient;

    beforeEach((done) => {
      spClient = new sp.Client();
      this.sinon = sinon.sandbox.create();

      async.parallel([
        function(cb) {
          utils.createS3Bucket((err, name) => {
            if (err) {
              return cb(err);
            }

            bucket = name;
            cb(null);
          });
        },
        function(cb) {
          utils.createStormpathApplication(spClient, (err, app) => {
            if (err) {
              return cb(err);
            }

            spApplication = app;
            cb();
          });
        }
      ], (err) => {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    afterEach((done) => {
      this.sinon.restore();

      async.parallel([
        function(cb) {
          utils.destroyStormpathApplication(spApplication, (err) => {
            if (err) {
              return cb(err);
            }

            cb();
          });
        },
        function(cb) {
          utils.destroyS3Bucket(bucket, (err) => {
            if (err) {
              return cb(err);
            }

            cb();
          });
        }
      ], (err) => {
        if (err) {
          return done(err);
        }

        done();
      });
    });

    describe("uploadFile", () => {
      it("should return an error if the specified file does not exist", (done) => {
        let agent;
        let app = express();

        app.use(stormpath.init(app, {
          application: {
            href: spApplication.href
          }
        }));
        app.use(stormpath.getUser);
        app.use(stormpathS3({ awsBucket: bucket }));

        app.get("/", stormpath.loginRequired, (req, res) => {
          req.user.uploadFile("file", (err) => {
            assert(err);
            res.send();
          });
        });

        utils.createStormpathAccount(spApplication, (err, acc) => {
          if (err) {
            return done(err);
          }

          agent = request.agent(app);

          agent.post("/login")
            .type("form")
            .send({ login: acc.username })
            .send({ password: "0HIthere!0" })
            .expect(302, (err, res) => {
              if (err) {
                return done(err);
              }

              agent.get("/").expect(200, (err, res) => {
                if (err) {
                  return done(err);
                }

                done();
              });
            });
        });
      });

      it("should successfully upload files", (done) => {
        let agent;
        let app = express();
        let tmpFile = tmp.fileSync();

        app.use(stormpath.init(app, {
          application: {
            href: spApplication.href
          }
        }));
        app.use(stormpath.getUser);
        app.use(stormpathS3({ awsBucket: bucket }));

        app.get("/", stormpath.loginRequired, (req, res) => {
          req.user.uploadFile(tmpFile.name, (err) => {
            assert(!err);
            res.send();
          });
        });

        utils.createStormpathAccount(spApplication, (err, acc) => {
          if (err) {
            return done(err);
          }

          agent = request.agent(app);

          agent.post("/login")
            .type("form")
            .send({ login: acc.username })
            .send({ password: "0HIthere!0" })
            .expect(302, (err, res) => {
              if (err) {
                return done(err);
              }

              agent.get("/").expect(200, (err, res) => {
                if (err) {
                  return done(err);
                }

                done();
              });
            });
        });
      });
    });
  });
});
