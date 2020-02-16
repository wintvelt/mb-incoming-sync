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
});

const context = {
    bucket: testEnv.BUCKET,
    filename: testEnv.SYNC_FILENAME
};

describe("The saveSyncPromise function", () => {
    it("saves successfully and returns an ETag", async () => {
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
    it("returns Error when the bucket is wrong", async () => {
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
        const saveResult = await helpers.saveSyncPromise(params, falseContext);
        expect(saveResult).to.not.have.property('ETag');
        expect(saveResult).to.have.property('error');
    });
});

describe("The getSyncPromise function", () => {
    it("retrieves the test file successfully", async () => {
        const params = {
            adminCode: testEnv.ADMIN_CODE,
            version: 'latest'
        };
        const getResult = await helpers.getSyncPromise(params, context);
        expect(getResult).to.have.property('receipts');
    });
});