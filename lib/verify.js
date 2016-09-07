module.exports = opts => {
  if (!(opts.awsAccessKeyId || process.env.AWS_ACCESS_KEY_ID)) {
    throw new Error('awsAccessKeyId is required.');
  }

  if (!(opts.awsSecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY)) {
    throw new Error('awsSecretAccessKey is required.');
  }

  if (!(opts.awsBucket || process.env.AWS_BUCKET)) {
    throw new Error('awsBucket is required.');
  }
};
