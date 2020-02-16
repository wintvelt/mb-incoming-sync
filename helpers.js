// helpers.js
'use strict';
const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var s3 = new AWS.S3({
    region: 'eu-central-1'
});

module.exports.dedupe = (list) => {
    let outList = [];
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (i === 0 || item.id !== list[i - 1].id) {
            outList.push(item)
        }
    }
    return outList;
}

module.exports.saveSyncPromise = (params, context) => {
    const { adminCode, version, body } = params;
    const { bucket, filename } = context;
    const Key = `${adminCode}/${filename}-${version}.json`;
    return s3.putObject({
        Bucket: bucket,
        Key,
        Body: JSON.stringify(body),
        ContentType: 'application/json'
    }).promise().catch(error => ({ error: error.message }));
}