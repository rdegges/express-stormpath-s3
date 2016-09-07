'use strict';

function getUserId(accountHref) {
  let splitHref = accountHref.split('/');

  return splitHref[splitHref.length - 1];
}

module.exports.getUserId = getUserId;
