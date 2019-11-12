#!/bin/bash
VERSION=${1:-latest}

emsdk install "$VERSION"
emsdk activate "$VERSION"
source "$(which emsdk)_env.sh"