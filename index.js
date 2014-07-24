#!/usr/bin/env node

var AWS = require('aws-sdk');
var Batch = require('batch');
var fs = require('fs');
var mime = require('mime');
var resolve = require('path').resolve;

var bucket = process.argv[3];
var dir = resolve(process.argv[2]);

/**
 * Check for AWS keys, if they don't exist, exit
 */

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error(
    'AWS_ACCESS_KEY_ID & AWS_SECRET_ACCESS_KEY environment variables must be set.'
  );
  process.exit(1);
}

/**
 * S3
 */

var s3 = new AWS.S3({
  params: {
    Bucket: bucket
  }
});

/**
 * Read dir
 */

var files = walk(dir);

/**
 * Push each file to Amazon
 */

var batch = new Batch();
console.log('--> uploading to', bucket);

files.forEach(function(file) {
  batch.push(function(done) {
    var key = file.substring(dir.length + 1); // remove the leading slash
    isFileUpToDate(file, key, function(err, isUpToDate) {
      if (isUpToDate) {
        console.log('--', key, 'up to date');
        done();
      } else {
        push(file, key, done);
      }
    });
  });
});

batch.end(function(err) {
  console.log('<-- done uploading to', bucket);
  process.exit();
});

/**
 * Push
 */

function push(file, key, done) {
  fs.readFile(file, function(err, body) {
    if (err) return done(err);

    var type = mime.lookup(file);

    console.log('--> uploading', key, type, body.length);
    s3.putObject({
      ACL: 'public-read',
      Body: body,
      Bucket: bucket,
      ContentType: type,
      Key: key
    }, function(err, res) {
      if (err) console.error('!!! error uploading', key, err);
      else console.log('<-- done uploading', key);
      done(err);
    });
  });
}

/**
 * Last Modified
 */

function isFileUpToDate(file, key, done) {
  fs.stat(file, function(err, stats) {
    if (err) return done(err);
    s3.headObject({
      Bucket: bucket,
      Key: key
    }, function(err, data) {
      var lastModified = data.LastModified
        ? new Date(data.LastModified).valueOf()
        : -Infinity;

      done(err, new Date(stats.mtime).valueOf() <= lastModified);
    });
  });
}

/**
 * Walk
 */

function walk(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else results.push(file);
  });

  return results;
}
