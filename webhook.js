'use strict';
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var s3 = new AWS.S3({
    region: 'eu-central-1'
});

const response = (statusCode, bodyOrString) => {
    const body = typeof bodyOrString === 'string' ?
        bodyOrString
        : JSON.stringify(bodyOrString, null, 2);
    return {
        statusCode,
        body
    }
}

const context = {
    bucket: 'mb-incoming-sync-files',
    filename: 'webhook'
};

const saveFile = ({ bucket, adminCode, filename, body }) => {
    const Key = `${adminCode}/${filename}.json`;
    return s3.putObject({
        Bucket: bucket,
        Key,
        Body: JSON.stringify(body, null, 2),
        ContentType: 'application/json'
    }).promise()
        .catch(error => ({ error: error.message }));
}

module.exports.main = async event => {
    // get params from event
    if (!event || !event.pathParameters) return response(404, "Not found");
    const { admin } = event.pathParameters;
    const adminCode = admin;
    // save body on S3
    const saveParams = {
        ...context,
        adminCode,
        body: event.body
    }
    const saveResponse = await saveFile(saveParams);
    if (saveResponse.error) return response(500, "Error");
    return response(200, "OK");
}