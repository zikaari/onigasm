import { onigasmH } from "./onigasmH";
import { encode } from "./UTF8Encoder";

class OnigString {
    private source: string;
    private ptr: number;

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content
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

    public toAsmString(): number {
        if (!this.ptr) {
            const u8Encoded = encode(this.source);
            this.ptr = onigasmH._malloc(u8Encoded.length);
            onigasmH.HEAPU8.set(u8Encoded, this.ptr);
        }
        return this.ptr;
    }

    /** For testing purposes */
    public hasPtr() {
        return !!this.ptr;
    }

    public dispose(): void {
        if (this.ptr) {
            onigasmH._free(this.ptr);
            this.ptr = null;
        }
    }

}

export default OnigString
