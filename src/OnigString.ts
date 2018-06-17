import { onigasmH } from "./onigasmH";

class OnigString {
    private source: string
    public utf8Bytes: Uint8Array
    private _utf16Bytes: Uint16Array
    private _utf8OffsetToUtf16: Uint32Array
    private _utf16OffsetToUtf8: Uint32Array
    public hasMultiByteCharacters: boolean

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content

        this.encode(content)
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

    public convertUtf8OffsetToUtf16(utf8Offset: number): number {
        if (this.hasMultiByteCharacters) {
            if (utf8Offset < 0) {
                return 0;
            }
            if (utf8Offset > this.utf8Bytes.length) {
                return this._utf16Bytes.length;
            }
            return this._utf8OffsetToUtf16[utf8Offset];
        }
        return utf8Offset;
    }

    public convertUtf16OffsetToUtf8(utf16Offset: number): number {
        if (this.hasMultiByteCharacters) {
            if (utf16Offset < 0) {
                return 0;
            }
            if (utf16Offset > this._utf16Bytes.length) {
                return this.utf8Bytes.length;
            }
            return this._utf16OffsetToUtf8[utf16Offset];
        }
        return utf16Offset;
    }

    private encode(str: string): void {
        // NOTE: In this function high performance is million times more critical than fancy looks (and maybe readability)

        // For some reason v8 is slower with let or const (so using var)
        var n = str.length
        var u8view = new Uint8Array((n * 2) + 1 /** null termination character */)
        var utf16 = new Uint16Array(n + 1 /** null termination character */)
        var ptrHead = 0
        var i16 = 0
        var i8 = 0
        var utf16OffsetToUtf8 = new Uint32Array(n + 1)
        var utf8OffsetToUtf16 = new Uint32Array((n * 2) + 1)
        // for some reason, v8 is faster with str.length than using a variable (might be illusion)
        while (i16 < str.length) {
            var codepoint
            var wasSurrogatePair = false
            var c = str.charCodeAt(i16)
            utf16[i16] = c

            if (c < 0xD800 || c > 0xDFFF) {
                codepoint = c
            }

            else if (0xDC00 <= c && c <= 0xDFFF) {
                codepoint = 0xFFFD
            }

            else if (0xD800 <= c && c <= 0xDBFF) {
                if (i16 === n - 1) {
                    codepoint = 0xFFFD
                }
                else {
                    var d = str.charCodeAt(i16 + 1)

                    if (0xDC00 <= d && d <= 0xDFFF) {
                        var a = c & 0x3FF

                        var b = d & 0x3FF
                        wasSurrogatePair = true
                        codepoint = 0x10000 + (a << 10) + b
                        utf16[i16] = d
                    }

                    else {
                        codepoint = 0xFFFD
                    }
                }
            }

            var bytesRequiredToEncode = 0
            var offset
            utf16OffsetToUtf8[i16] = i8
            if (0x00 <= codepoint && codepoint <= 0x7F) {
                bytesRequiredToEncode = 1
                utf8OffsetToUtf16[i8++] = i16
            }
            else if (0x0080 <= codepoint && codepoint <= 0x07FF) {
                bytesRequiredToEncode = 2
                offset = 0xC0
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
            }
            else if (0x0800 <= codepoint && codepoint <= 0xFFFF) {
                bytesRequiredToEncode = 3
                offset = 0xE0
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
            }
            else if (0x10000 <= codepoint && codepoint <= 0x10FFFF) {
                bytesRequiredToEncode = 4
                offset = 0xF0
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
                utf8OffsetToUtf16[i8++] = i16
            }

            if (bytesRequiredToEncode === 1) {
                u8view[ptrHead++] = codepoint
            }
            else {
                u8view[ptrHead++] = (codepoint >> (6 * (--bytesRequiredToEncode))) + offset

                while (bytesRequiredToEncode > 0) {

                    var temp = codepoint >> (6 * (bytesRequiredToEncode - 1))

                    u8view[ptrHead++] = (0x80 | (temp & 0x3F))

                    bytesRequiredToEncode -= 1
                }
            }

            if(wasSurrogatePair) {
                utf16OffsetToUtf8[i16 + 1] = utf16OffsetToUtf8[i16]
                i16++
            }
            i16++
        }

        var utf8 = u8view.slice(0, ptrHead + 1 /** null termination char */)
        utf8[utf8.length] = 0x00
        utf16[utf16.length] = 0x00

        
        this.utf8Bytes = utf8
        this._utf16Bytes = utf16
        this.hasMultiByteCharacters = utf8.length > utf16.length
        
        utf8OffsetToUtf16 = utf8OffsetToUtf16.slice(0, utf8.length)
        utf8OffsetToUtf16[utf8.length - 1] = utf16.length - 1
        this._utf8OffsetToUtf16 = utf8OffsetToUtf16
        utf16OffsetToUtf8[utf16.length - 1] = utf8.length - 1
        this._utf16OffsetToUtf8 = utf16OffsetToUtf8
    }


}

export default OnigString
