# Onigasm (**Onig**uruma**ASM**)

`WebAssembly` port of Oniguruma regex library.

Usage/API/Behaviour 100% same as [`node-oniguruma`](https://github.com/atom/node-oniguruma) port, tests are literally imported from `node-oniguruma` repository for maximum compliance.

## Instructions for porting your app to web

### Install

```bash
npm i onigasm
```

### Light it up

```diff
- import { OnigRegExp } from 'oniguruma'
+ import { OnigRegExp } from 'onigasm'
```

### That's it!
