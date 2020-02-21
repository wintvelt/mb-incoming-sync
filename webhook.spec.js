require('dotenv').config();

const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

const webhook = require('./webhook');

describe("The webhook function", () => {
    const baseEvent = {
        pathParameters: { admin: process.env.ADMIN_CODE },
        httpMethod: 'POST',
        body: {
            administration_id: "116015326147118082",
            entity_type: "Receipt",
            entity_id: "116015245643744263",
            action: "some_action",
            entity: {
              id: "116015245643744263"
            }
        }
    }
    it("returns with statusCode of 200 and a diffed content", async () => {
        const response = await webhook.main(baseEvent);
        expect(response.statusCode).to.equal(200);
    });
});