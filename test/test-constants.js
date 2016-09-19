"use strict";

const assert = require("assert");

const constants = require("../lib/constants");

describe("constants", () => {
  it("should expose a DEFAULT_ACL setting", () => {
    assert(typeof constants.DEFAULT_ACL === "string");
  });

  it("should expose a AWS_S3_BASE_URL setting", () => {
    assert(typeof constants.AWS_S3_BASE_URL === "string");
  });
});
