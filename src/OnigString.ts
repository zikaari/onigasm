
type UintArray = Uint8Array | Uint16Array | Uint32Array;

class OnigString {
    private source: string
    private _utf8Bytes: Uint8Array | null
    private _utf16OffsetToUtf8: UintArray | null;

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content
        this._utf8Bytes = null;
        this._utf16OffsetToUtf8 = null;

    }

    public get utf8Bytes(): Uint8Array {
        if (!this._utf8Bytes) {
            this.encode();
        }
        return this._utf8Bytes
    }

    /**
     * Returns `null` if all utf8 offsets match utf-16 offset (content has no multi byte characters)
     */
    private get utf16OffsetToUtf8(): UintArray {
        if (!this._utf8Bytes) {
            this.encode();
        }
        return this._utf16OffsetToUtf8
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

    public get hasMultiByteCharacters() {
        return this.utf16OffsetToUtf8 !== null;
    }

    public convertUtf8OffsetToUtf16(utf8Offset: number): number {
        if (utf8Offset < 0) {
            return 0;
        }
        let utf8Array = this._utf8Bytes;
        if (utf8Offset >= utf8Array.length - 1) {
            return this.source.length;
        }

        const utf8OffsetMap = this.utf16OffsetToUtf8;
        if (utf8OffsetMap) {
            return findFirstInSorted(utf8OffsetMap, utf8Offset);
        }
        return utf8Offset;
    }

    public convertUtf16OffsetToUtf8(utf16Offset: number): number {
        if (utf16Offset < 0) {
            return 0;
        }
        let utf8Array = this._utf8Bytes;
        if (utf16Offset >= this.source.length) {
            return utf8Array.length - 1;
        }

        const utf8OffsetMap = this.utf16OffsetToUtf8;
        if (utf8OffsetMap) {
            return utf8OffsetMap[utf16Offset];
        }
        return utf16Offset;
    }

    private encode(): void {
        // NOTE: In this function high performance is million times more critical than fancy looks (and maybe readability)
        const str = this.source;
        const n = str.length;

        const maxUtf8Len = n;

        let utf16OffsetToUtf8: UintArray;
        if (maxUtf8Len <= 0xff) {
            utf16OffsetToUtf8 = new Uint8Array(n);
        } else if (maxUtf8Len <= 0xffff) {
            utf16OffsetToUtf8 = new Uint16Array(n);
        } else {
            utf16OffsetToUtf8 = new Uint32Array(n);
        }

        // For some reason v8 is slower with let or const (so using var)
        let u8view = new Uint8Array(n + 1 /** null termination character */)
        const bytes = []
        let ptrHead = 0
        let didExtendBuffer = false
        let i = 0
        // for some reason, v8 is faster with str.length than using a variable (might be illusion)
        while (i < str.length) {
            let codepoint
            const c = str.charCodeAt(i)
            utf16OffsetToUtf8[i] = ptrHead;

            if (c < 0xD800 || c > 0xDFFF) {
                codepoint = c
            }

            else if (c >= 0xDC00) {
                codepoint = 0xFFFD
            }

            else {
                if (i === n - 1) {
                    codepoint = 0xFFFD
                }
                else {
                    let d = str.charCodeAt(i + 1)

                    if (0xDC00 <= d && d <= 0xDFFF) {
                        const a = c & 0x3FF

                        const b = d & 0x3FF

                        codepoint = 0x10000 + (a << 10) + b
                        i += 1
                        utf16OffsetToUtf8[i] = ptrHead;
                    }

                    else {
                        codepoint = 0xFFFD
                    }
                }
            }

            let bytesRequiredToEncode: number
            let offset: number;

            if (codepoint <= 0x7F) {
                bytesRequiredToEncode = 1
                offset = 0;
            } else if (codepoint <= 0x07FF) {
                bytesRequiredToEncode = 2
                offset = 0xC0
            } else if (codepoint <= 0xFFFF) {
                bytesRequiredToEncode = 3
                offset = 0xE0
            } else {
                bytesRequiredToEncode = 4
                offset = 0xF0
            }

            if ((ptrHead + bytesRequiredToEncode + 1) > u8view.length) {
                const newView = new Uint8Array(u8view.byteLength + (str.length + bytesRequiredToEncode + 1))
                newView.set(u8view)
                u8view = newView
                didExtendBuffer = true
            }

            if (bytesRequiredToEncode === 1) {
                u8view[ptrHead++] = codepoint
            }
            else {
                u8view[ptrHead++] = (codepoint >> (6 * (--bytesRequiredToEncode))) + offset

                while (bytesRequiredToEncode > 0) {

                    const temp = codepoint >> (6 * (bytesRequiredToEncode - 1))

                    u8view[ptrHead++] = (0x80 | (temp & 0x3F))

                    bytesRequiredToEncode -= 1
                }
            }

            i += 1
        }

        const utf8 = didExtendBuffer ? new Uint8Array(u8view.buffer, 0, ptrHead + 1 /** null termination char */) : u8view
        utf8[ptrHead] = 0x00

        this._utf8Bytes = utf8;
        if (this._utf8Bytes.length !== this.source.length + 1) {
            this._utf16OffsetToUtf8 = utf16OffsetToUtf8;
        }
    }
}


function findFirstInSorted<T>(array: UintArray, i: number): number {
    let low = 0, high = array.length;
    if (high === 0) {
        return 0; // no children
    }
    while (low < high) {
        let mid = Math.floor((low + high) / 2);
        if (array[mid] >= i) {
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    if (array[low] > i) {
        low--;
    }
    return low;
}

export default OnigString
