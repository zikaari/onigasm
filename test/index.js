// test https://github.com/NeekSandhu/onigasm/issues/19
print = (str) => { assert.fail('Should not use print for console.log') }; // define a global 'print' methods
const origConsoleLog = console.log;

const fs = require('fs')
const path = require('path')
const jasmine = require('jasmine-focused');
const assert = require('assert')
const {
    loadWASM
} = require('../lib');

const wasmBin = fs.readFileSync(path.join(__dirname, '../lib/onigasm.wasm')).buffer

loadWASM(wasmBin).then(() => {

    assert.equal(console.log, origConsoleLog); // test https://github.com/NeekSandhu/onigasm/issues/19

    jasmine.executeSpecsInFolder({
        specFolders: [path.join(__dirname, '../spec')]
    })
})



