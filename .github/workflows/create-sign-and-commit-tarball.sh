#!/usr/bin/env bash
set -e

PACKAGE_VERSION=$1
GPG_KEY_ID=$2

gpgloader

# Create signed "Release x.y.z" tarball
echo "Create release tarball"
npm pack
echo package version: $PACKAGE_VERSION
echo gpg key id: $GPG_KEY_ID
mv "bson-${PACKAGE_VERSION}.tgz" "bson-${PACKAGE_VERSION}.tgz.${GPG_KEY_ID}"

# Create signed "Package x.y.z" commit
echo "Create package commit"
git commit -m "Package ${PACKAGE_VERSION}" -s --gpg-sign=${GPG_KEY_ID} 