"use strict";

const assert = require("assert");

const utils = require("../lib/utils");

describe("getUserId", () => {
  it("should return a user ID when given an href", () => {
    assert(utils.getUserId("https://api.stormpath.com/v1/accounts/xxx") === "xxx");
  });

  it("should return an empty string if an empty string is given", () => {
    assert(utils.getUserId("") === "");
  });
});

describe("verifyOptions", () => {
  beforeEach(() => {
    process.env.AWS_ACCESS_KEY_ID = "id";
    process.env.AWS_SECRET_ACCESS_KEY = "key";
    process.env.AWS_BUCKET = "key";
  });

  it("should throw an error if no options are supplied", () => {
    assert.throws(() => {
      utils.verifyOptions();
    }, Error);
  });

  it("should throw an error if no awsAccessKeyId is supplied", () => {
    delete process.env.AWS_ACCESS_KEY_ID;
    assert.throws(() => {
      utils.verifyOptions({
        awsSecretAccessKey: "secret",
        awsBucket: "bucket"
      });
    }, Error);
  });

  it("should not throw an error if awsAccessKeyId is supplied", () => {
    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsSecretAccessKey: "secret",
        awsBucket: "bucket"
      });
    }, Error);

    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsSecretAccessKey: "secret",
        awsBucket: "bucket"
      });
    }, Error);
  });

  it("should throw an error if no awsSecretAccessKey is supplied", () => {
    delete process.env.AWS_SECRET_ACCESS_KEY;
    assert.throws(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsBucket: "bucket"
      });
    }, Error);
  });

  it("should not throw an error if awsSecretAccessKey is supplied", () => {
    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsSecretAccessKey: "secret",
        awsBucket: "bucket"
      });
    }, Error);

    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsBucket: "bucket"
      });
    }, Error);
  });

  it("should throw an error if no awsBucket is supplied", () => {
    delete process.env.AWS_BUCKET;
    assert.throws(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsSecretAccessKey: "secret"
      });
    }, Error);
  });

  it("should not throw an error if awsBucket is supplied", () => {
    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsSecretAccessKey: "secret",
        awsBucket: "bucket"
      });
    }, Error);

    assert.doesNotThrow(() => {
      utils.verifyOptions({
        awsAccessKeyId: "id",
        awsSecretAccessKey: "secret"
      });
    }, Error);
  });

  afterEach(() => {
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
    delete process.env.AWS_BUCKET;
  });
});
