#!/bin/bash
usage='./convert_to_csv.sh <input> [<output>]'
input=$1
output=$2

if [ -z $1 ]; then
  echo "Usage: " $usage
fi

if [ -z $output ]; then
  output=results.csv
fi

script=$(tempfile)
/bin/cat <<EOM > $script
  # delete first 7 lines
  1,7d

  # delete skipped tests
  /skipped/D

  # delete total time
  /Total time taken to benchmark/D

  # delete horizontal lines
  /-------------/d

  # filter for lines that contain the max field
  /^.*max.*\$/h

  # remove spaces
  s/ //g

  # replace pipes with commas
  y/|/,/

  # remove trailing and leading comma
  s/^,(.*),\$/\1/

  # remove field names
  s/([a-zA-Z0-9]+:)//g

  # remove units
  s/([0-9]+)ms/\1/g

  # split version and test
  s/---/,/
  P
EOM
lines=$(sed --quiet --regexp-extended -f $script < $input)

echo 'version,test,max,min,mean,stddev,p90,p95,p99' | tee $output
for line in $lines; do 
  echo $line | tee -a $output
done

rm -rf $script
