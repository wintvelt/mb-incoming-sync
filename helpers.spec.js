require('dotenv').config();

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

const oldList = [
    { id: '1', version: '1' },
    { id: '2', version: '1' },
    { id: '3', version: '1' },
    { id: '4', version: '1' },
    { id: '5', version: '1' }
];
const newList = [
    { id: '1', version: '1' },
    { id: '2', version: '1' },
    { id: '3', version: '3' },
    { id: '4', version: '2' },
    { id: '6', version: '1' }
];

describe("The changes function", () => {
    const changeSet = helpers.changes(oldList, newList);
    it("contains the new items - only in new list", () => {
        expect(changeSet.new).to.be.an('array').that.eql(['6']);
    });
    it("contains items changed - with newer version", () => {
        expect(changeSet.changed).to.be.an('array').that.eql(['3','4']);
    });
    it("contains deleted items - only in old list", () => {
        expect(changeSet.deleted).to.be.an('array').that.eql(['5']);
    });
});

describe("The environment variables", () => {
    it("have an ACCESS_TOKEN", () => {
        expect(process.env.ACCESS_TOKEN).to.not.be.undefined;
        console.log(process.env.ACCESS_TOKEN)
    });
    it("have an ADMIN_CODE", () => {
        expect(process.env.ADMIN_CODE).to.not.be.undefined;
        console.log(process.env.ADMIN_CODE)
    });
})