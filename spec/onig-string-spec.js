'use strict'

const OnigString = require('..').OnigString

describe('OnigString', () => {
  it('has a length property', () => {
    expect(new OnigString('abc').length).toBe(3)
  })

  it('can be converted back into a string', () => {
    expect(new OnigString('abc').toString()).toBe('abc')
  })

  it('can retrieve substrings (for conveniently inspecting captured text)', () => {
    const string = 'abcdef'
    const onigString = new OnigString(string)
    expect(onigString.substring(2, 3)).toBe(string.substring(2, 3))
    expect(onigString.substring(2)).toBe(string.substring(2))
    expect(onigString.substring()).toBe(string.substring())
    expect(onigString.substring(-1)).toBe(string.substring(-1))
    expect(onigString.substring(-1, -2)).toBe(string.substring(-1, -2))

    onigString.substring({})
    onigString.substring(null, undefined)
  })

  it('handles invalid arguments', () => {
    expect(() => new OnigString(undefined)).toThrow('Argument must be a string')
  })

  it('handles encoding', () => {
    let string = new OnigString('Wörld');
    expect(Array.from(string.utf8Bytes)).toEqual([0x57, 0xc3, 0xb6, 0x72, 0x6c, 0x64, 0x00]);
    expect(string.convertUtf16OffsetToUtf8(0)).toEqual(0);
    expect(string.convertUtf16OffsetToUtf8(1)).toEqual(1);
    expect(string.convertUtf16OffsetToUtf8(2)).toEqual(3);
    expect(string.convertUtf16OffsetToUtf8(3)).toEqual(4);
    expect(string.convertUtf8OffsetToUtf16(0)).toEqual(0);
    expect(string.convertUtf8OffsetToUtf16(1)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(2)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(3)).toEqual(2);
    expect(string.convertUtf8OffsetToUtf16(4)).toEqual(3);   
  })
})
