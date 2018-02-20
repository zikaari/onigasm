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
		// 1. Let c be the code unit in S at index i.
		var c = str.charCodeAt(i)

		// 2. Depending on the value of c:

		// c < 0xD800 or c > 0xDFFF
		if (c < 0xD800 || c > 0xDFFF) {
			// Append to U the Unicode character with code point c.
			codepoint = c
		}

		// 0xDC00 ≤ c ≤ 0xDFFF
		else if (0xDC00 <= c && c <= 0xDFFF) {
			// Append to U a U+FFFD REPLACEMENT CHARACTER.
			codepoint = 0xFFFD
		}

		// 0xD800 ≤ c ≤ 0xDBFF
		else if (0xD800 <= c && c <= 0xDBFF) {
			// 1. If i = n−1, then append to U a U+FFFD REPLACEMENT
			// CHARACTER.
			if (i === n - 1) {
				codepoint = 0xFFFD
			}
			// 2. Otherwise, i < n−1:
			else {
				// 1. Let d be the code unit in S at index i+1.
				var d = str.charCodeAt(i + 1)

				// 2. If 0xDC00 ≤ d ≤ 0xDFFF, then:
				if (0xDC00 <= d && d <= 0xDFFF) {
					// 1. Let a be c & 0x3FF.
					var a = c & 0x3FF

					// 2. Let b be d & 0x3FF.
					var b = d & 0x3FF

					// 3. Append to U the Unicode character with code point
					// 2^16+2^10*a+b.
					codepoint = 0x10000 + (a << 10) + b

					// 4. Set i to i+1.
					i += 1
				}

				// 3. Otherwise, d < 0xDC00 or d > 0xDFFF. Append to U a
				// U+FFFD REPLACEMENT CHARACTER.
				else {
					codepoint = 0xFFFD
				}
			}
		}

		// if (codepoint === 0)
		//     return 0;

		// // 2. If code point is an ASCII code point, return a byte whose
		// // value is code point.

		// 3. Set count and offset based on the range code point is in:
		var bytesRequiredToEncode = 0
		var offset;


        if (0x00 <= codepoint && codepoint <= 0x7F) {
			bytesRequiredToEncode = 1
		}
		// U+0080 to U+07FF, inclusive:
		if (0x0080 <= codepoint && codepoint <= 0x07FF) {
			// 1 and 0xC0
			bytesRequiredToEncode = 2;
			offset = 0xC0;
		}
		// U+0800 to U+FFFF, inclusive:
		else if (0x0800 <= codepoint && codepoint <= 0xFFFF) {
			// 2 and 0xE0
			bytesRequiredToEncode = 3;
			offset = 0xE0;
		}
		// U+10000 to U+10FFFF, inclusive:
		else if (0x10000 <= codepoint && codepoint <= 0x10FFFF) {
			// 3 and 0xF0
			bytesRequiredToEncode = 4;
			offset = 0xF0;
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
			u8view[ptrHead++] = (codepoint >> (6 * (--bytesRequiredToEncode))) + offset;

			while (bytesRequiredToEncode > 0) {

				var temp = codepoint >> (6 * (bytesRequiredToEncode - 1));

				u8view[ptrHead++] = (0x80 | (temp & 0x3F));

				bytesRequiredToEncode -= 1;
			}
		}

		i += 1
	}

    var final =  didExtendBuffer ? new Uint8Array(buffer, 0, ptrHead + 1 /** null termination char */) : u8view
    final[final.length] = 0x00
    return final
}
