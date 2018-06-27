const fs = require('fs')
const path = require('path')
const {
    loadWASM,
    OnigScanner,
    OnigString
} = require('.');

const wasmBin = fs.readFileSync(path.join(__dirname, './lib/onigasm.wasm')).buffer

const StopWatch = typeof performance === 'undefined' ? Date : performance
const log = console.log
const mkArray = (size, filler) => Array(size).fill(undefined).map(filler)

loadWASM(wasmBin)
    .then(() => {
        const UNICODE_RANGE_FOR_SAMPLE = [100, 500]
        const getRandChar = () =>
            String.fromCodePoint(Math.floor(Math.random() * (UNICODE_RANGE_FOR_SAMPLE[1] - UNICODE_RANGE_FOR_SAMPLE[0])) + UNICODE_RANGE_FOR_SAMPLE[0])

        const strChunk100Chars = mkArray(100, getRandChar).join('')

        const scanner = new OnigScanner(['searchTillTheEndButYouWontFindMe' /* this is to stress test and compare libonig before version upgrade */ ])
        var T0 = StopWatch.now()

        log(`\nStress testing OnigScanner.findNextMatchSync with:\n`)
        const test = (charCount) => {
            const str = strChunk100Chars.repeat(charCount / strChunk100Chars.length)
            // we test 5 levels of charCount, starting from fifth, then fourth, third and so on
            const splitCount = 5
            const stepFactor = charCount / splitCount
            const literalStringSamples = mkArray(splitCount, (_, i) => str.slice(0, i * stepFactor))
            const onigStringSamples = mkArray(splitCount, (_, i) => new OnigString(str.slice(0, stepFactor * i)))

            let t0 = StopWatch.now()
            for (let i = 0; i < 100; i++) {
                for (let j = 0; j < splitCount; j++) {
                    scanner.findNextMatchSync(literalStringSamples[j])
                }
            }
            log(`Single use literal strings < ${charCount} characters\n:`, StopWatch.now() - t0, 'ms')

            t0 = StopWatch.now()
            for (let i = 0; i < 100; i++) {
                for (let j = 0; j < splitCount; j++) {
                    scanner.findNextMatchSync(onigStringSamples[j])
                }
            }
            log(`Reused OnigString objects < ${charCount} characters\n:`, StopWatch.now() - t0, 'ms')
            log()
        }

        [
            100,
            1000,
            10000,
            50000,
            100000,
            1000000,
            2000000,
        ].forEach(test)

        log('All tests took ', StopWatch.now() - T0, 'ms')
    })
    .catch(log)