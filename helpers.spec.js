const mocha = require('mocha');
const chai = require('chai');
const expect = chai.expect;

const helpers = require('./helpers');

const testEnv = {
    TEST_ADMIN: '12345',
    BUCKET: 'mb-incoming-sync-files',
    SYNC_FILENAME: 'mb-incoming-sync',
    ADMIN_CODE: '0000test'
};


describe("The dedupe function", () => {
    it("returns an empty list unchanged", () => {
        const inList = [];
        const outList = helpers.dedupe(inList);
        expect(outList).to.eql([]);
    });
    it("returns a list of unique ids unchanged", () => {
        const inList = [
            { id: "1", version: "12" },
            { id: "2", version: "1" },
            { id: "3", version: "1" }
        ];
        const outList = helpers.dedupe(inList);
        expect(outList).to.eql(inList);
    });
    it("cleans up a list with duplicate ids", () => {
        const inList = [
            { id: "1", version: "1" },
            { id: "1", version: "1" },
            { id: "2", version: "1" }
        ];
        const expected = [
            { id: "1", version: "1" },
            { id: "2", version: "1" }
        ];
        const outList = helpers.dedupe(inList);
        expect(outList).to.eql(expected);
    });
    console.log(process.env.STAGE === 'CircleCI');
});

const context = {
    bucket: testEnv.BUCKET,
    filename: testEnv.SYNC_FILENAME
};

describe("The saveSyncPromise function", () => {
    it("returns ETag after save", async () => {
        const body = {
            'receipts': [
                { id: '1234', version: '1' }
            ]
        }
        const params = {
            adminCode: testEnv.ADMIN_CODE,
            version: 'latest',
            body
        };
        const dinges = await helpers.saveSyncPromise(params, context);
        expect(dinges).to.have.property('ETag');
    });
    it("returns Error with wrong bucket", async () => {
        const body = {
            'receipts': [
                { id: '1234', version: '1' }
            ]
        }
        const params = {
            adminCode: testEnv.ADMIN_CODE,
            version: 'latest',
            body
        };
        const falseContext = { ...context, bucket: 'wrong-bucket' }
        const dinges = await helpers.saveSyncPromise(params, falseContext);
        expect(dinges).to.not.have.property('ETag');
        expect(dinges).to.have.property('error');
    });

});