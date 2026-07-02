#!/usr/bin/env bash

# This script is used to fetch the latest JSON tests for the BSON spec.
# It puts the tests in the direcory $spec_root It should be run from the root of the repository.

set -o errexit
set -o nounset

if [ ! -d ".git" ]; then
    echo "$0: This script must be run from the root of the repository" >&2
    exit 1
fi

spec_root="test/node/specs"

tmpdir=$(mktemp -d -t spec_testsXXXX)
curl -sL https://github.com/mongodb/specifications/archive/master.zip -o "$tmpdir/specs.zip"
unzip -d "$tmpdir" "$tmpdir/specs.zip" > /dev/null

mkdir -p "$spec_root/bson-corpus"
rsync -ah "$tmpdir/specifications-master/source/bson-corpus/tests/" "$spec_root/bson-corpus" --delete

rm -rf "$tmpdir"
