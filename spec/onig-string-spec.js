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

  it('mapping 2/3/4 byte UTF-8 encoding', () => {
    let string = new OnigString('123$¢€𐍈123');
    expect(Array.from(string.utf8Bytes)).toEqual(
      [0x31 /*1*/, 0x32 /*2*/, 0x33 /*3*/, 0x24 /*$*/, 0xc2 /*¢*/, 0xa2, 0xe2 /*€*/, 0x82, 0xac, 0xf0 /*𐍈*/, 0x90, 0x8d, 0x88, 0x31 /*1*/, 0x32 /*2*/, 0x33 /*3*/, 0x00]
    );
    expect(string.convertUtf16OffsetToUtf8(0)).toEqual(0);
    expect(string.convertUtf16OffsetToUtf8(1)).toEqual(1);
    expect(string.convertUtf16OffsetToUtf8(2)).toEqual(2);
    expect(string.convertUtf16OffsetToUtf8(3)).toEqual(3);
    expect(string.convertUtf16OffsetToUtf8(4)).toEqual(4);
    expect(string.convertUtf16OffsetToUtf8(5)).toEqual(6);
    expect(string.convertUtf16OffsetToUtf8(6)).toEqual(9);
    expect(string.convertUtf16OffsetToUtf8(7)).toEqual(9);
    expect(string.convertUtf16OffsetToUtf8(8)).toEqual(13);
    expect(string.convertUtf16OffsetToUtf8(9)).toEqual(14);
    expect(string.convertUtf16OffsetToUtf8(10)).toEqual(15);    

    expect(string.convertUtf8OffsetToUtf16(0)).toEqual(0);
    expect(string.convertUtf8OffsetToUtf16(1)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(2)).toEqual(2);
    expect(string.convertUtf8OffsetToUtf16(3)).toEqual(3);
    expect(string.convertUtf8OffsetToUtf16(4)).toEqual(4);
    expect(string.convertUtf8OffsetToUtf16(5)).toEqual(4);
    expect(string.convertUtf8OffsetToUtf16(6)).toEqual(5);
    expect(string.convertUtf8OffsetToUtf16(7)).toEqual(5);
    expect(string.convertUtf8OffsetToUtf16(8)).toEqual(5);
    expect(string.convertUtf8OffsetToUtf16(9)).toEqual(6);
    expect(string.convertUtf8OffsetToUtf16(10)).toEqual(6);
    expect(string.convertUtf8OffsetToUtf16(11)).toEqual(6);
    expect(string.convertUtf8OffsetToUtf16(12)).toEqual(6);
    expect(string.convertUtf8OffsetToUtf16(13)).toEqual(8);
    expect(string.convertUtf8OffsetToUtf16(14)).toEqual(9);
    expect(string.convertUtf8OffsetToUtf16(15)).toEqual(10);
  })

  it('mapping UTF-16 surrogate pairs ', () => {
    let string = new OnigString('1𩸽𩹀');
    expect(Array.from(string.utf8Bytes)).toEqual(
      [0x31, 0xf0, 0xa9, 0xb8, 0xbd, 0xf0, 0xa9, 0xb9, 0x80, 0x0]
    );
    expect(string.convertUtf16OffsetToUtf8(0)).toEqual(0);
    expect(string.convertUtf16OffsetToUtf8(1)).toEqual(1);
    expect(string.convertUtf16OffsetToUtf8(2)).toEqual(1);
    expect(string.convertUtf16OffsetToUtf8(3)).toEqual(5); 
    expect(string.convertUtf16OffsetToUtf8(4)).toEqual(5);

    expect(string.convertUtf8OffsetToUtf16(0)).toEqual(0);
    expect(string.convertUtf8OffsetToUtf16(1)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(2)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(3)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(4)).toEqual(1);
    expect(string.convertUtf8OffsetToUtf16(5)).toEqual(3);
    expect(string.convertUtf8OffsetToUtf16(6)).toEqual(3);
    expect(string.convertUtf8OffsetToUtf16(7)).toEqual(3);
    expect(string.convertUtf8OffsetToUtf16(8)).toEqual(3);    
    
  }) 

})
