class OnigString {
    private source: string
    private _utf8Bytes: Uint8Array
    private _utf16Bytes: Uint16Array
    private _utf8OffsetToUtf16: Uint32Array
    private _utf16OffsetToUtf8: Uint32Array
    private _hasMultiByteChars: boolean

    constructor(content: string) {
        if (typeof content !== 'string') {
            throw new TypeError('Argument must be a string')
        }
        this.source = content

        const [utf8, utf16] = this.encode(content)

        this._utf8Bytes = utf8
        this._utf16Bytes = utf16

        this._hasMultiByteChars = (utf16.length < utf8.length);

        if (this._hasMultiByteChars) {
            var utf16Length = utf16.length - 1
            var utf8Length = utf8.length - 1

            const _utf16OffsetToUtf8 = new Uint32Array(utf16Length + 1)
            _utf16OffsetToUtf8[utf16Length] = utf8Length
            this._utf16OffsetToUtf8 = _utf16OffsetToUtf8

            const _utf8OffsetToUtf16 = new Uint32Array(utf8Length + 1)
            _utf8OffsetToUtf16[utf8Length] = utf16Length
            this._utf8OffsetToUtf16 = _utf8OffsetToUtf16

            // http://stackoverflow.com/a/148766
            var i8 = 0
            for (var i16 = 0, len = utf16Length; i16 < len; i16++) {
                var _in = utf16[i16]

                var codepoint = _in
                var wasSurrogatePair = false

                if (_in >= 0xd800 && _in <= 0xdbff) {
                    // Hit a high surrogate, try to look for a matching low surrogate
                    if (i16 + 1 < len) {
                        var next = utf16[i16 + 1]
                        if (next >= 0xdc00 && next <= 0xdfff) {
                            // Found the matching low surrogate
                            codepoint = (((_in - 0xd800) << 10) + 0x10000) | (next - 0xdc00)
                            wasSurrogatePair = true
                        }
                    }
                }

                _utf16OffsetToUtf8[i16] = i8

                if (codepoint <= 0x7f) {
                    _utf8OffsetToUtf16[i8++] = i16
                }
                else if (codepoint <= 0x7ff) {
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                }
                else if (codepoint <= 0xffff) {
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                }
                else {
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                    _utf8OffsetToUtf16[i8++] = i16
                }

                if (wasSurrogatePair) {
                    _utf16OffsetToUtf8[i16 + 1] = _utf16OffsetToUtf8[i16]
                    i16++
                }
            }
        }

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

    public get hasMultiByteCharacters() {
        return this._hasMultiByteChars
    }

    public convertUtf8OffsetToUtf16(utf8Offset: number): number {
        if (this._hasMultiByteChars) {
            if (utf8Offset < 0) {
                return 0;
            }
            if (utf8Offset > this._utf8Bytes.length) {
                return this._utf16Bytes.length;
            }
            return this._utf8OffsetToUtf16[utf8Offset];
        }
        return utf8Offset;
    }

    public convertUtf16OffsetToUtf8(utf16Offset: number): number {
        if (this._hasMultiByteChars) {
            if (utf16Offset < 0) {
                return 0;
            }
            if (utf16Offset > this._utf16Bytes.length) {
                return this._utf8Bytes.length;
            }
            return this._utf16OffsetToUtf8[utf16Offset];
        }
        return utf16Offset;
    }

    private encode(str: string): [Uint8Array, Uint16Array] {
        // NOTE: In this function high performance is million times more critical than fancy looks (and maybe readability)

        // For some reason v8 is slower with let or const (so using var)
        var n = str.length
        var u8view = new Uint8Array(n + 1 /** null termination character */)
        var u16view = new Uint16Array(n + 1 /** null termination character */)
        var bytes = []
        var ptrHead = 0
        var didExtendBuffer = false
        var i = 0
        // for some reason, v8 is faster with str.length than using a variable (might be illusion)
        while (i < str.length) {
            var codepoint
            var c = str.charCodeAt(i)
            u16view[i] = c

            if (c < 0xD800 || c > 0xDFFF) {
                codepoint = c
            }

            else if (0xDC00 <= c && c <= 0xDFFF) {
                codepoint = 0xFFFD
            }

            else if (0xD800 <= c && c <= 0xDBFF) {
                if (i === n - 1) {
                    codepoint = 0xFFFD
                }
                else {
                    var d = str.charCodeAt(i + 1)

                    if (0xDC00 <= d && d <= 0xDFFF) {
                        var a = c & 0x3FF

                        var b = d & 0x3FF

                        codepoint = 0x10000 + (a << 10) + b
                        i += 1
                        u16view[i] = d
                    }

                    else {
                        codepoint = 0xFFFD
                    }
                }
            }

            var bytesRequiredToEncode = 0
            var offset

            if (0x00 <= codepoint && codepoint <= 0x7F) {
                bytesRequiredToEncode = 1
            }
            if (0x0080 <= codepoint && codepoint <= 0x07FF) {
                bytesRequiredToEncode = 2
                offset = 0xC0
            }
            else if (0x0800 <= codepoint && codepoint <= 0xFFFF) {
                bytesRequiredToEncode = 3
                offset = 0xE0
            }
            else if (0x10000 <= codepoint && codepoint <= 0x10FFFF) {
                bytesRequiredToEncode = 4
                offset = 0xF0
            }

            if ((ptrHead + bytesRequiredToEncode) > u8view.length) {
                var newView = new Uint8Array(u8view.byteLength + (str.length + bytesRequiredToEncode))
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

                    var temp = codepoint >> (6 * (bytesRequiredToEncode - 1))

                    u8view[ptrHead++] = (0x80 | (temp & 0x3F))

                    bytesRequiredToEncode -= 1
                }
            }

            i += 1
        }

        var utf8 = didExtendBuffer ? new Uint8Array(u8view.buffer, 0, ptrHead + 1 /** null termination char */) : u8view
        utf8[utf8.length] = 0x00
        u16view[u16view.length] = 0x00
        return [utf8, u16view]
    }


}

export default OnigString
