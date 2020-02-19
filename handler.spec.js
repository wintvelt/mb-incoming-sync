require('dotenv').config();

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

const handler = require('./handler');

describe("The handler function (only tested for SIM)", () => {
    const baseEvent = {
        headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` },
        pathParameters: { admin: process.env.ADMIN_CODE },
        httpMethod: 'GET'
    }
    it("returns with statusCode of 200 and a diffed content", async () => {
        const response = await handler.main(baseEvent);
        let body = JSON.parse(response.body);
        expect(response.statusCode).to.equal(200);
        expect(body).to.have.property('receipts');
        expect(body).to.have.property('purchase_invoices');
    });
    it("returns with statusCode of 401 if Auth is missing", async () => {
        const event = { ...baseEvent, headers: {} };
        const response = await handler.main(event);
        expect(response.statusCode).to.equal(401);
    });
    it("returns with statusCode of 403 if Auth is wrong", async () => {
        const event = { ...baseEvent, headers: { Authorization: 'wrong' } };
        const response = await handler.main(event);
        expect(response.statusCode).to.equal(403);
    });
});