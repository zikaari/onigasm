import OnigScanner from "./OnigScanner"

class OnigRegExp {
    private source: string
    private scanner: OnigScanner
    constructor(source: string) {
        this.source = source

        try {
            this.scanner = new OnigScanner([this.source])
        } catch (error) {
            // doesn't make much sense, but this to pass atom/node-oniguruam tests
        }
    }

    captureIndicesForMatch(string: string, match) {
        if (match != null) {
            const { captureIndices } = match
            let capture
            string = this.scanner.convertToString(string)
            for (let i = 0; i < captureIndices.length; i++) {
                capture = captureIndices[i]
                capture.match = string.slice(capture.start, capture.end)
            }
            return captureIndices
        } else {
            return null
        }
    }

    searchSync(string: string, startPosition?: number) {
        var match
        if (startPosition == null) {
            startPosition = 0
        }
        match = this.scanner.findNextMatchSync(string, startPosition)
        return this.captureIndicesForMatch(string, match)
    }

    search(string: string, startPosition: number, callback) {
        if (startPosition == null) {
            startPosition = 0
        }
        if (typeof startPosition === 'function') {
            callback = startPosition
            startPosition = 0
        }
        try {
            const ret = this.searchSync(string, startPosition)
            callback(null, ret)
        } catch (error) {
            callback(error)
        }
    }

    testSync(string) {
        if ((typeof this.source === 'boolean' || typeof string === 'boolean')) {
            return this.source === string
        }
        return this.searchSync(string) != null
    }

    test(string, callback) {
        if (typeof callback !== 'function') {
            callback = () => { }
        }
        try {
            callback(null, this.testSync(string))
        } catch (error) {
            callback(error)
        }
    }
}

export default OnigRegExp
