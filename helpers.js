// helpers.js
'use strict';
const fetch = require('node-fetch');
const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies

var s3 = new AWS.S3({
    region: 'eu-central-1'
});

const dedupe = (list) => {
    let outList = [];
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (i === 0 || item.id !== list[i - 1].id) {
            outList.push(item)
        }
    }
    return outList;
}

module.exports.dedupe = dedupe;

module.exports.syncBody = (receiptsWithDupe, purchase_invoicesWithDupe) => (
    { 
        receipts: dedupe(receiptsWithDupe),
        purchase_invoices: dedupe(purchase_invoicesWithDupe)
    }
);

module.exports.hasKey = (syncBody, key) => (
    !!syncBody[key] && syncBody[key].length > 0
)

module.exports.changes = (oldList = [], newList = []) => {
    const newItems = newList.filter(item => !oldList.find(it => it.id === item.id));
    const deletedItems = oldList.filter(item => !newList.find(it => it.id === item.id));
    const changedItems = newList.filter(item => !!oldList.find(it => (it.id === item.id && it.version < item.version)));
    return {
        added: newItems.map(item => item.id),
        changed: changedItems.map(item => item.id),
        deleted: deletedItems.map(item => item.id)
    }
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
    }).promise()
        .catch(error => ({ error: error.message }));
}

module.exports.getSyncPromise = (params, context) => {
    const { adminCode, version } = params;
    const { bucket, filename } = context;
    const Key = `${adminCode}/${filename}-${version}.json`;
    return s3.getObject({
        Bucket: bucket,
        Key
    }).promise()
        .then(data => {
            if (!data.Body) return 'error';
            const buffer = Buffer.from(data.Body);
            return JSON.parse(buffer.toString('utf8'));
        })
        .catch(error => ({ error: error.message }));
}

module.exports.getMBPromise = (params, context) => {
    const { adminCode, type } = params;
    const { access_token } = context;
    const headers = {
        Authorization: 'Bearer ' + access_token
    };
    const baseUrl = 'https://moneybird.com/api/v2';
    const filter = encodeURI('filter=state:saved|open|late|paid|pending_payment');
    const url = `${baseUrl}/${adminCode}/documents/${type}/synchronization.json?${filter}`;
    const response = fetch(url, { headers })
        .then(res => res.json())
        .catch(error => ({ error: error.message }));
    return response;
}