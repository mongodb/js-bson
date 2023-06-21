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
INPUT=$1
OUTPUT=${2:-results.csv}
SED_SCRIPT=$(cat <<EOM
  # filter for lines that contain the max field
  /^.*max.*\$/!d

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

if [ -z $INPUT ]; then
  echo "$USAGE"
  exit 1
fi


lines=$(sed --quiet --regexp-extended -e "$SED_SCRIPT" < $INPUT)

echo 'version,test,max,min,mean,stddev,p90,p95,p99' | tee $OUTPUT
for line in $lines; do 
  echo $line | tee -a $OUTPUT
done
