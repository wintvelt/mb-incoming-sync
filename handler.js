'use strict';
const helpers = require('./helpers');

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
  filename: 'mb-incoming-sync'
};


module.exports.main = async event => {
  // get params from event
  if (!event || !event.pathParameters) return response(404, "Not found");
  const { admin } = event.pathParameters;
  const adminCode = admin;
  const isPOST = event.httpMethod === 'POST';
  if (!event.headers || !event.headers.Authorization) return response(401, "Unauthorized");
  const access_token = event.headers.Authorization.slice(6);
  // fetch latest sync from S3 + MB receipts + MB purchase invoices
  const [prevFromS3, latestFromS3, receiptSync, invoiceSync] = await Promise.all([
    helpers.getSyncPromise({ adminCode, version: 'previous' }, context),
    helpers.getSyncPromise({ adminCode, version: 'latest' }, context),
    helpers.getMBPromise({ adminCode, type: 'receipts' }, { access_token }),
    helpers.getMBPromise({ adminCode, type: 'purchase_invoices' }, { access_token }),
  ]);
  if (receiptSync.error || invoiceSync.error) return response(403, "Forbidden");
  const latestSync = helpers.syncBody(receiptSync, invoiceSync);
  // save latest + previous (if not empty)
  const [prevSave, latestSave] = await Promise.all([
    (!isPOST || prevFromS3.error) ? true
      : helpers.saveSyncPromise({ adminCode, version: 'previous', body: latestFromS3 }, context),
    !isPOST ? true : helpers.saveSyncPromise({ adminCode, version: 'latest', body: latestSync }, context),
  ]);
  if (prevSave.error || latestSave.error) return response(500, 'Server error');
  // return diffed version
  const previous = isPOST ? latestFromS3 : prevFromS3;
  const latest = isPOST ? latestSync : latestFromS3;
  const body = {
    receipts: helpers.changes(previous.receipts, latest.receipts),
    purchase_invoices: helpers.changes(previous.purchase_invoices, latest.purchase_invoices),
  }
  return response(200, body);
}