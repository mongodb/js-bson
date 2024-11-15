#! /usr/bin/env bash

# At the time of writing. This script is not used in CI.
# but can be used to locally iterate on big endian bugs.
# buildx requires an output, so I put docs which should be a no-op.

set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

# If you get an error you may have an outdated buildkit version
# Try running this:
# docker buildx rm builder && docker buildx create --name builder --bootstrap --use

docker buildx build \
    --progress=plain \
    --platform linux/s390x \
    --build-arg="NODE_ARCH=s390x" \
    -f ./.github/docker/Dockerfile \
    --output type=local,dest=./docs,platform-split=false \
    .
