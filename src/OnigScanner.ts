// ugly code begin
declare const require
import { Cache } from 'lru-cache'
const LRUCache = require('lru-cache')
// ugly code end

import OnigString from './OnigString'
import { onigasmH } from './onigasmH'
import { encode } from './UTF8Encoder'

/**
 * Every instance of OnigScanner internally calls native libonig API
 * Since (at the moment) transferring complex objects between C runtime and JS runtime is not easy,
 * pointers are used to tap into their runtimes to read values (for example result of regex match)
 */
interface NativeOnigHInfo {
    /**
     * regex_t* is used by libonig to match string against an expression
     * this is the output of compiling raw string pattern to libonig's internal representation
     */
    regexTPtrs: Uint8Array | null
}

interface OnigCaptureIndex {
    index: number
    start: number
    end: number
    length: number
}

interface OnigMatch {
    index: number
    captureIndices: OnigCaptureIndex[]
    scanner: OnigScanner
}

const cache: Cache<OnigScanner, NativeOnigHInfo> = new LRUCache({
    max: 1000,
    dispose: (scanner: OnigScanner, info: NativeOnigHInfo) => {
        const status = onigasmH.ccall(
            'disposeCompiledPatterns',
            'number',
            ['array', 'number'],
            [info.regexTPtrs, scanner.patterns.length]
        )
        if (status !== 0) {
            const errString = onigasmH.ccall('getLastError', 'string')
            throw new Error(errString)
        }
    }
})

class OnigScanner {
    private sources: string[]
    /**
     * Create a new scanner with the given patterns
     * @param patterns  An array of string patterns
     */
    constructor(patterns: string[]) {
        if (onigasmH === null) {
            throw new Error(`Onigasm has not been initialized, call loadWASM from 'onigasm' exports before using any other API`)
        }
        for (let i = 0; i < patterns.length; i++) {
            const pattern = patterns[i]
            if (typeof pattern !== 'string') {
                throw new TypeError(`First parameter to OnigScanner constructor must be array of (pattern) strings`)
            }
        }
        this.sources = patterns.slice()
    }

    public get patterns() {
        return this.sources.slice()
    }

    /**
     * Find the next match from a given position
     * @param string The string to search
     * @param startPosition The optional position to start at, defaults to 0
     * @param callback The (error, match) function to call when done, match will null when there is no match
     */
    public findNextMatch(string: string, startPosition: number, callback: (err, match?: OnigMatch) => void) {
        if (startPosition == null) startPosition = 0
        if (typeof startPosition === 'function') {
            callback = startPosition
            startPosition = 0
        }

        try {
            const match = this.findNextMatchSync(string, startPosition)
            callback(null, match)
        } catch (error) {
            callback(error)
        }
    }

    /**
     * Find the next match from a given position
     * @param string The string to search
     * @param startPosition The optional position to start at, defaults to 0
     */
    public findNextMatchSync(string: string, startPosition: number): OnigMatch {
        if (startPosition == null) { startPosition = 0 }
        string = this.convertToString(string)
        startPosition = this.convertToNumber(startPosition)

        let onigNativeInfo = cache.get(this)
        if (!onigNativeInfo) {
            const regexTAddrRecieverPtr = onigasmH._malloc(4)
            const regexTPtrs = []
            for (let i = 0; i < this.sources.length; i++) {
                const pattern = this.sources[i];
                const status = onigasmH.ccall('compilePattern', 'number', ['string', 'number'], [pattern, regexTAddrRecieverPtr])
                if (status !== 0) {
                    const errString = onigasmH.ccall('getLastError', 'string')
                    throw new Error(errString)
                }
                const regexTAddress = new Uint32Array(onigasmH.buffer, regexTAddrRecieverPtr, 1)[0]
                regexTPtrs.push(regexTAddress)
            }
            onigNativeInfo = {
                regexTPtrs: new Uint8Array(Uint32Array.from(regexTPtrs).buffer),
            }
            onigasmH._free(regexTAddrRecieverPtr)
            cache.set(this, onigNativeInfo)
        }

        const resultInfoReceiverPtr = onigasmH._malloc(8)
        const u8Encoded = encode(string)
        const strPtr = onigasmH._malloc(u8Encoded.length)
        onigasmH.HEAPU8.set(u8Encoded, strPtr)
        // const strSize = onigasmH.lengthBytesUTF8(string) + 1
        // const strPtr = onigasmH._malloc(strSize)
        // const bytesWritten = onigasmH.stringToUTF8(string, strPtr, strSize)
        const status = onigasmH.ccall(
            'findBestMatch',
            'number',
            ['array', 'number', 'number', 'number', 'number', 'number'],
            [onigNativeInfo.regexTPtrs, this.sources.length, strPtr, string.length, startPosition, resultInfoReceiverPtr]
        )
        if (status !== 0) {
            const errString = onigasmH.ccall('getLastError', 'string')
            throw new Error(errString)
        }
        const [
            // The index of pattern which matched the string at least offset from 0 (start)
            bestPatternIdx,

            // Begin address of capture info encoded as pairs
            // like [start, end, start, end, start, end, ...] 
            //  - first start-end pair is entire match (index 0 and 1) 
            //  - subsequent pairs are capture groups (2, 3 = first capture group, 4, 5 = second capture group and so on)
            encodedResultBeginAddress,

            // Length of the [start, end, ...] sequence so we know how much memory to read (will always be 0 or multiple of 2)
            encodedResultLength,
        ] = new Uint32Array(onigasmH.buffer, resultInfoReceiverPtr, 3)

        onigasmH._free(strPtr)
        onigasmH._free(resultInfoReceiverPtr)
        if (encodedResultLength > 0) {
            const encodedResult = new Uint32Array(onigasmH.buffer, encodedResultBeginAddress, encodedResultLength)
            const captureIndices = []
            let i = 0
            let captureIdx = 0
            while (i < encodedResultLength) {
                const index = captureIdx++
                const start = encodedResult[i++]
                const end = encodedResult[i++]
                const length = end - start
                captureIndices.push({
                    index,
                    start,
                    end,
                    length,
                })
            }
            onigasmH._free(encodedResultBeginAddress)
            return {
                index: bestPatternIdx,
                captureIndices,
                scanner: this,
            }
        }
        return null
    }

    public convertToString(value) {
        if (value === undefined) return 'undefined'
        if (value === null) return 'null'
        if (value.constructor == OnigString) return value
        return value.toString()
    }

    public convertToNumber(value) {
        value = parseInt(value)
        if (!isFinite(value)) { value = 0 }
        value = Math.max(value, 0)
        return value
    }
}

export default OnigScanner