'use strict'

const OnigString = require('..').OnigString
const OnigScanner = require('..').OnigScanner

describe('OnigString', () => {
  it('has a length property', () => {
    withOnigString('abc', onigString => { 
      expect(onigString.length).toBe(3)
    })  
  })

  it('can be converted back into a string', () => {
    withOnigString('abc', onigString => { 
      expect(onigString.toString()).toBe('abc')
    })
  })

  it('can retrieve substrings (for conveniently inspecting captured text)', () => {
    const string = 'abcdef'
    withOnigString(string, onigString => {
      expect(onigString.substring(2, 3)).toBe(string.substring(2, 3))
      expect(onigString.substring(2)).toBe(string.substring(2))
      expect(onigString.substring()).toBe(string.substring())
      expect(onigString.substring(-1)).toBe(string.substring(-1))
      expect(onigString.substring(-1, -2)).toBe(string.substring(-1, -2))

      onigString.substring({})
      onigString.substring(null, undefined)
    })
  })

  it('handles invalid arguments', () => {
    expect(() => new OnigString(undefined)).toThrow('Argument must be a string')
  })

  it('keeps and releases pointer', () => {
    let onigString = new OnigString('abs');
    expect(onigString.hasPtr()).toBe(false);
    new OnigScanner(['a']).findNextMatchSync(onigString, 0);
    expect(onigString.hasPtr()).toBe(true);
    onigString.dispose();
    expect(onigString.hasPtr()).toBe(false);
  })  
})

function withOnigString(string, closure) {
  const onigString = new OnigString(string);
  try {
    closure(onigString);
  } finally {
    onigString.dispose();
  }
}
