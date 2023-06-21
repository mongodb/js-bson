#!/bin/bash
# This script is meant to be used on the output of benchmark runs to generate a csv file that can be
# more easily ingested in google sheets or your spreadsheet/data anaylsis tool of choice
# note that you will also see the output of the csv file printed in the terminal
USAGE=$(/bin/cat <<EOM 
Usage:
  ./convert_to_csv.sh <input> [<output>]

  Arguments:
    input  - file to read from
    output - file to output csv (if not provided defaults to 'results.csv')
EOM
)
input=$1
output=${2:-results.csv}

if [ -z $input ]; then
  echo "$usage"
  exit 1
fi


SED_SCRIPT=$(cat <<EOM
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
)
lines=$(sed --quiet --regexp-extended -e "$SED_SCRIPT" < $input)

echo 'version,test,max,min,mean,stddev,p90,p95,p99' | tee $output
for line in $lines; do 
  echo $line | tee -a $output
done
