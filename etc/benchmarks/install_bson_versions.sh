#!/bin/bash
# To be run from repo root
versions=$(jq '.versions' < etc/benchmarks/bson_versions.json | sed -E 's/(\[|\]|,|")//g')
installVersions=''
for bson in $versions; do
  versionNoDot=$(echo $bson | tr -d '.')
  installVersions+=" bson${versionNoDot}@npm:bson@${bson}"
done

set -o xtrace
npm install --no-save ${installVersions}
