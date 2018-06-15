import { encode } from "./UTF8Encoder";

class OnigString {
    private source: string
    private _utf8Bytes: Uint8Array

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content
        this._utf8Bytes = encode(content)
    }

    public get utf8Bytes(): Uint8Array {
        return this._utf8Bytes
    }

    public get content(): string {
        return this.source
    }

    public get length(): number {
        return this.source.length
    }

    public substring = (start, end) => {
        return this.source.substring(start, end)
    }

    public toString = (start, end) => {
        return this.source
    }

}

export default OnigString
