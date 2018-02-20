export function encode(str: string): Uint8Array {
	// NOTE: In this function high performance is million times more critical than fancy looks (and maybe readability)

	// For some reason v8 is slower with let or const (so using var)
	var n = str.length
	var buffer = new ArrayBuffer(n + 1 /** null termination character */)
	var u8view = new Uint8Array(buffer)
	var bytes = []
	var ptrHead = 0
	var didExtendBuffer = false
	var i = 0
	// for some reason, v8 is faster with str.length than using a variable (might be illusion)
	while (i < str.length) {
		var codepoint
		var c = str.charCodeAt(i)

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
			var newBuffer = new ArrayBuffer(buffer.byteLength + (str.length + bytesRequiredToEncode))
			var newView = new Uint8Array(newBuffer)
			newView.set(u8view)
			u8view = newView
			buffer = newBuffer
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

    var final =  didExtendBuffer ? new Uint8Array(buffer, 0, ptrHead + 1 /** null termination char */) : u8view
    final[final.length] = 0x00
    return final
}
