# Onigasm (**Onig**uruma**ASM**)

`WebAssembly` port of Oniguruma regex library.

Usage/API/Behaviour 100% same as [`node-oniguruma`](https://github.com/atom/node-oniguruma) port, tests are literally imported from `node-oniguruma` repository for maximum compliance.

Of course, unlike `node-oniguruma`, this library can't hook into roots of `V8` and is therefore ~2 times slower than latter.

But don't loose faith! Searching for a string in a file* with  5839708 characters  it only takes about ~260ms to process. Not bad if you ask me ;P

\* File was taken from `Microsoft/TypeScript/lib/typescriptServices.js`
## Instructions for porting your app to web

### Install

```bash
npm i onigasm
```

### Light it up

> WASM must be loaded before you use any other feature like `OnigRegExp` or `OnigScanner`

```javascript
// index.js (entry point)

import { loadWASM } from 'onigasm'
import App from './App'

(async () => {
    await loadWASM('path/to/onigasm.wasm') // You can also pass ArrayBuffer of onigasm.wasm file
    App.start()
})()
```

> Once loaded `onigasm` is a drop-in replacement for `oniguruma`

```javascript
// app.js (rest of the app)

/** replace this */ import { OnigRegExp } from 'oniguruma'
/** with this   */  import { OnigRegExp } from 'onigasm'
```

### That's it!


## To do

- ~~Pass `node-oniguruma` tests~~
- Code cleanup wherever possible
- Optimizations wherever possible
- Improve internal and public documentation
