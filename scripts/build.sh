#!/bin/bash
if [ -f oniguruma/src/.libs/libonig.so ]
then
    echo "libonig.so exists, skipping oniguruma build"
else
    echo "libonig.so not found. Running oniguruma build"
    cd oniguruma
    # for the time being
    git checkout develop
    if [ ! -f configure ]
    then
        echo "Running autoreconf -vfi"
        autoreconf -vfi
    fi
    if [ ! -f src/Makefile ]
    then
        echo "Running emconfigure ./configure"
        emconfigure ./configure --enable-posix-api=no
        autoreconf -vfi
    fi
    make clean
    emmake make
    cd ..
fi

# ATM emcc blows up if path passed to -o doesn't exist
if [ ! -d lib ]
then
    mkdir lib
fi

emcc -O2 \
    oniguruma/src/.libs/libonig.so \
    src/onigasm.cc\
    -Isrc -Ioniguruma/src \
    -s WASM=1 \
    -s NO_EXIT_RUNTIME=1 \
    -s NO_FILESYSTEM=1 \
    -s TOTAL_MEMORY=157286400 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s DEMANGLE_SUPPORT=1 \
    -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall']" \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="'Onigasm'" \
    -o lib/onigasm.js

# 'require("fs")' in onigasm.js makes webpack go haywire, so remove it. It's OK as we don't need it anyway
sed -i -r 's/require\("\w+"\)/{}/g' lib/onigasm.js
