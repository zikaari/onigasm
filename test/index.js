const fs = require('fs')
const path = require('path')
const jasmine = require('jasmine-focused');
const {
    loadWASM
} = require('../lib');

const wasmBin = fs.readFileSync(path.join(__dirname, '../lib/onigasm.wasm')).buffer

loadWASM(wasmBin).then(() => {
    jasmine.executeSpecsInFolder({
        specFolders: [path.join(__dirname, '../spec')]
    })
}).catch(console.log)
