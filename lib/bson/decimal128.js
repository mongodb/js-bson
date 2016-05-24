"use strict"

var Long = require('./long');

var PARSE_STRING_REGEXP = /^(\+|\-)?(\d+|(\d*\.\d+))?(E|e)?([\-\+])?(\d+)?$/;

var EXPONENT_MAX = 6111;
var EXPONENT_MIN = -6176;
var EXPONENT_BIAS = 6176;
var MAX_DIGITS = 34;

// Nan value bits as 32 bit values (due to lack of longs)
var NAN_BUFFER = [0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse();
// Infinity value bits 32 bit values (due to lack of longs)
var INF_NEGATIVE_BUFFER = [0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse();
var INF_POSITIVE_BUFFER = [0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00].reverse();

var EXPONENT_REGEX = /^([\-\+])?(\d+)?$/;


// Detect if the value is a digit
var isDigit = function(value) {
  return !isNaN(parseInt(value, 10));
}

// Multiply two Long values and return the 128 bit value
var multiply64x2 = function(left, right) {
  if(!left && !right) {
    return {high: Long.fromNumber(0), low: Long.fromNumber(0)};
  }

  // console.log("== left " + longtoHex(left));
  // console.log("== right " + longtoHex(right));

  var leftHigh = left.shiftRightUnsigned(32);
  // console.log("== leftHigh " + longtoHex(leftHigh));
  // console.log("=== leftHigh low = " + longtoHex(leftHigh.low_));
  // console.log("=== leftHigh high = " + longtoHex(leftHigh.high_));
  var leftLow = new Long(left.getLowBits(), 0);
  // console.log("== leftLow " + longtoHex(leftLow));

  var rightHigh = right.shiftRightUnsigned(32);
  // console.log("== rightHigh " + longtoHex(rightHigh));

  var rightLow = new Long(right.getLowBits(), 0);
  // console.log("== rightLow " + longtoHex(rightLow));

  var productHigh = leftHigh.multiply(rightHigh);
  // console.log("== productHigh " + longtoHex(productHigh));
  var productMid = leftHigh.multiply(rightLow);
  // console.log("== productMid " + longtoHex(productMid));
  var productMid2 = leftLow.multiply(rightHigh);
  // console.log("== productMid2 " + longtoHex(productMid2));
  var productLow = leftLow.multiply(rightLow);
  // console.log("== productLow " + longtoHex(productLow));

  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  // console.log("== productHigh " + longtoHex(productHigh));
  productMid = new Long(productMid.getLowBits(), 0)
                .add(productMid2)
                .add(productLow.shiftRightUnsigned(32));
  // console.log("== productMid " + longtoHex(productMid));

  productHigh = productHigh.add(productMid.shiftRightUnsigned(32));
  // console.log("== productHigh " + longtoHex(productHigh));
  productLow = productMid.shiftLeft(32).add(new Long(productLow.getLowBits(), 0));
  // console.log("== productLow " + longtoHex(productLow));

  // Return the 128 bit result
  return {high: productHigh, low: productLow};
}

var lessThan = function(left, right) {
  // Make values unsigned
  var uhleft = left.high_ >>> 0;
  var uhright = right.high_ >>> 0;

  // Compare high bits first
  if(uhleft < uhright) {
    return true
  } else if(uhleft == uhright) {
    var ulleft = left.low_ >>> 0;
    var ulright = right.low_ >>> 0;
    if(ulleft < ulright) return true;
  }

  return false;
}

var longtoHex = function(value) {
  var buffer = new Buffer(8);
  var index = 0;
  // Encode the low 64 bits of the decimal
  // Encode low bits
  buffer[index++] = value.low_ & 0xff;
  buffer[index++] = (value.low_ >> 8) & 0xff;
  buffer[index++] = (value.low_ >> 16) & 0xff;
  buffer[index++] = (value.low_ >> 24) & 0xff;
  // Encode high bits
  buffer[index++] = value.high_ & 0xff;
  buffer[index++] = (value.high_ >> 8) & 0xff;
  buffer[index++] = (value.high_ >> 16) & 0xff;
  buffer[index++] = (value.high_ >> 24) & 0xff;
  return buffer.reverse().toString('hex');
}

var Decimal128 = function(bytes) {
  this.bytes = bytes;
}

Decimal128.fromString = function(string) {
  // Parse state tracking
  var isNegative = false;
  var sawRadix = false;
  var foundNonZero = false;

  // Total number of significant digits (no leading or trailing zero)
  var significantDigits = 0;
  // Total number of significand digits read
  var nDigitsRead = 0;
  // Total number of digits (no leading zeros)
  var nDigits = 0;
  // The number of the digits after radix
  var radixPosition = 0;
  // The index of the first non-zero in *str*
  var firstNonZero = 0;

  // Digits Array
  var digits = [0];
  // The number of digits in digits
  var nDigitsStored = 0;
  // Insertion pointer for digits
  var digitsInsert = 0;
  // The index of the first non-zero digit
  var firstDigit = 0;
  // The index of the last digit
  var lastDigit = 0;

  // Exponent
  var exponent = 0;
  // loop index over array
  var i = 0;
  // The high 17 digits of the significand
  var significandHigh = [0, 0];
  // The low 17 digits of the significand
  var significandLow = [0, 0];
  // The biased exponent
  var biasedExponent = 0;

  // Read index
  var index = 0;

  // Trim the string
  string = string.trim();

  if(string[index] == '+' || string[index] == '-') {
    isNegative = string[index++] == '-';
  }

  // Check if user passed Infinity or NaN
  if(!isDigit(string[index]) || string[index] == '.') {
    if(string[index] == 'i' || string[index] == 'I') {
      index = index + 1;

      if(string[index] == 'n' || string[index] == 'N') {
        index = index + 1;

        if(string[index] == 'f' || string[index] == 'F') {
          return new Decimal128(new Buffer(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
        }
      }
    } else if(string[index] == 'N') {
      index = index + 1;

      if(string[index] == 'a') {
        index = index + 1;

        if(string[index] == 'N') {
          return new Decimal128(new Buffer(NAN_BUFFER));
        }
      }
    }

    return new Decimal128(new Buffer(NAN_BUFFER));
  }

  // console.log("%%%%%%%%%%%%%%%%%%%%%%%%%%")

  // Read all the digits
  while(isDigit(string[index]) || string[index] == '.') {
    // console.log(string[index])

    if(string[index] == '.') {
      // console.log("^^^^^^^^^^^^^^^^^^^^")
      if(sawRadix) {
        return new Decimal128(new Buffer(NAN_BUFFER));
      }

      sawRadix = true;
      index = index + 1;
      continue;
    }

    if(nDigitsStored < 34) {
      if(string[index] != '0' || foundNonZero) {
        if(!foundNonZero) {
          firstNonZero = nDigitsRead;
        }

        foundNonZero = true;
        /* Only store 34 digits */
        digits[digitsInsert++] = string[index] - '0';
        nDigitsStored = nDigitsStored + 1;
      }
    }

    if(foundNonZero) {
      nDigits = nDigits + 1;
    }

    if(sawRadix) {
      radixPosition = radixPosition + 1;
    }

    nDigitsRead = nDigitsRead + 1;
    index = index + 1;
  }

  if(sawRadix && !nDigitsRead) {
    return new Decimal128(new Buffer(NAN_BUFFER));
  }

  // Read exponent if exists
  if(string[index] == 'e' || string[index] == 'E') {
    // Read exponent digits
    var match = string.substr(++index).match(EXPONENT_REGEX);

    // console.log("================= --------------")
    // console.dir(match)
    //
    // No digits read
    if(!match || !match[2]) {
      return new Decimal128(new Buffer(NAN_BUFFER));
    }

    // Get exponent
    exponent = parseInt(match[0], 10);

    // Adjust the index
    index = index + match[0].length;
  }

  if(string[index]) {
    return new Decimal128(new Buffer(NAN_BUFFER));
  }

  // Done reading input
  // Find first non-zero digit in digits
  firstDigit = 0;

  if(!nDigitsStored) {
    firstDigit = 0;
    lastDigit = 0;
    digits[0] = 0;
    nDigits = 1;
    nDigitsStored = 1;
    significantDigits = 0;
  } else {
    lastDigit = nDigitsStored - 1;
    significantDigits = nDigits;

    while(string[firstNonZero + significantDigits - 1] == '0') {
      significantDigits = significantDigits - 1;
    }
  }

  // Normalization of exponent
  // Correct exponent based on radix position, and shift significand as needed
  // to represent user input

  // console.log("[0] exponent = " + exponent)
  // console.log("[0] radixPosition = " + radixPosition)

  // Overflow prevention
  if(exponent <= radixPosition && radixPosition - exponent > (1 << 14)) {
    // console.log("-- exponent 0")
    exponent = EXPONENT_MIN;
  } else {
    // console.log("-- exponent 1")
    exponent = exponent - radixPosition;
  }

  // console.log("[1] exponent = " + exponent)

  // Attempt to normalize the exponent
  while(exponent > EXPONENT_MAX) {
    // Shift exponent to significand and decrease
    lastDigit = lastDigit + 1;

    if(lastDigit - firstDigit > MAX_DIGITS) {
      return new Decimal128(new Buffer(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER));
    }

    exponent = exponent - 1;
  }

  while(exponent < EXPONENT_MIN || nDigitsStored < nDigits) {
    // Shift last digit
    if(lastDigit == 0) {
      exponent = EXPONENT_MIN;
      significantDigits = 0;
      break;
    }

    if(nDigitsStored < nDigits) {
      // adjust to match digits not stored
      nDigits = nDigits - 1;
    } else {
      // adjust to round
      lastDigit = lastDigit - 1;
    }

    if(exponent < EXPONENT_MAX) {
      exponent = exponent + 1;
    } else {
      return new Decimal128(new Buffer(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER))
    }
  }

  // Round
  // We've normalized the exponent, but might still need to round.
  if(lastDigit - firstDigit + 1 < significantDigits) {
    // console.log(" == round")
    var endOfString = nDigitsRead;

    // If we have seen a radix point, 'string' is 1 longer than we have
    // documented with ndigits_read, so inc the position of the first nonzero
    // digit and the position that digits are read to.
    if(sawRadix && exponent == EXPONENT_MIN) {
      // console.log(" == round : 0:1")
      firstNonZero = firstNonZero + 1;
      endOfString = endOfString + 1;
    }

    var roundDigit = string[firstNonZero + lastDigit + 1] - '0';
    var roundBit = 0;
    // console.log(" == round : 1")
    // console.log(" roundDigit = " + roundDigit)

    if(roundDigit >= 5) {
      // console.log(" == round : 1:1")
      roundBit = 1;

      if(roundDigit == 5) {
        // console.log(" == round : 1:2")
        roundBit = digits[lastDigit] % 2 == 1;

        for(var i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
          // console.log(" == round : 1:3")
          if(string[i] - '0') {
            // console.log(" == round : 1:4")
            roundBit = 1;
            break;
          }
        }
      }
    }

    // console.log(" roundBit = " + roundBit)

    if(roundBit) {
      var dIdx = lastDigit;

      for(; dIdx >= 0; dIdx--) {
        if(++digits[dIdx] > 9) {
          digits[dIdx] = 0;

          // overflowed most significant digit
          if(dIdx == 0) {
            if(exponent < EXPONENT_MAX) {
              exponent = exponent + 1;
              digits[dIdx] = 1;
            } else {
              return new Decimal128(new Buffer(isNegative ? INF_NEGATIVE_BUFFER : INF_POSITIVE_BUFFER))
            }
          }
        } else {
          break;
        }
      }
    }
  }

  // console.log("firstDigit = " + firstDigit)
  // console.log("lastDigit = " + lastDigit)
  // console.log("significantDigits = " + significantDigits)

  // Encode significand
  // The high 17 digits of the significand
  significandHigh = Long.fromNumber(0);
  // The low 17 digits of the significand
  significandLow = Long.fromNumber(0);

  // read a zero
  if(significantDigits == 0) {
    // console.log("--- branch 0");
    significandHigh = Long.fromNumber(0);
    significandLow = Long.fromNumber(0);
  } else if(lastDigit - firstDigit < 17) {
    // console.log("--- branch 1");
    // console.log("first_digit = " + firstDigit)
    // console.log("last_digit = " + lastDigit)
    var dIdx = firstDigit;
    significandLow = Long.fromNumber(digits[dIdx++]);
    // console.log("signifcand_low = " + significandLow.toString())
    significandHigh = new Long(0, 0);

    for(; dIdx <= lastDigit; dIdx++) {
      significandLow = significandLow.multiply(Long.fromNumber(10));
      significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
    }
  } else {
    // console.log("--- branch 2");
    // console.log("-- exponent 2 :: " + firstDigit)
    var dIdx = firstDigit;
    significandHigh = Long.fromNumber(digits[dIdx++]);

    // console.log("significandHigh = " + significandHigh.toString())

    for(; dIdx <= lastDigit - 17; dIdx++) {
      significandHigh = significandHigh.multiply(Long.fromNumber(10));
      significandHigh = significandHigh.add(Long.fromNumber(digits[dIdx]));
    }
    // console.log("-- exponent 2 :: " + firstDigit)

    // console.log("significandHigh = " + significandHigh.toString())

    significandLow = Long.fromNumber(digits[dIdx++]);

    // console.log("significandLow = " + significandLow.toString())

    for(; dIdx <= lastDigit; dIdx++) {
      significandLow = significandLow.multiply(Long.fromNumber(10));
      significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
    }

    // console.log("significandLow = " + significandLow.toString())
  }

  // console.log("======================== significandHigh")
  // console.dir("significandHigh = " + longtoHex(significandHigh))
  // console.dir("Long.fromString('100000000000000000') = " + longtoHex(Long.fromString("100000000000000000")))


  var significand = multiply64x2(significandHigh, Long.fromString("100000000000000000"));

  // console.log("======================== significand :: 0")
  // console.dir("significand.low = " + longtoHex(significand.low))
  // console.dir("significand.high = " + longtoHex(significand.high))

  significand.low = significand.low.add(significandLow);

  // console.log("======================== significand :: 1")
  // console.dir("significand.low = " + longtoHex(significand.low))
  // console.dir("significand.high = " + longtoHex(significand.high))

  // console.log("======================== significand :: 1:1")
  // console.dir("significand.low = " + longtoHex(significand.low))
  // console.dir("significand.low = " + significand.low.toString())
  // console.dir("significandLow = " + longtoHex(significandLow))
  // console.dir("significandLow = " + significandLow.toString())
  // console.log(significand.low.lessThan(significandLow))
  // console.log(significandLow.greaterThanOrEqual(significand.low))
  // console.log(significand.low.subtract(significandLow).toString())
  // console.log(significandLow.subtract(significand.low).toString())

  // if(significandLow.isNegative()) significandLow = significandLow.negate();
  // if(significand.low.isNegative()) significand.low = significand.low.negate();

  // if(significand.low.lessThan(significandLow)) {
  if(lessThan(significand.low, significandLow)) {
  // if(significandLow.subtract(significand.low).isNegative()) {
    // console.log("!!!!!!!!!!! + 1")
    significand.high = significand.high.add(Long.fromNumber(1));
  }

  // console.log("======================== significand :: 2  ")
  // console.dir("significand.low = " + longtoHex(significand.low))
  // console.dir("significand.high = " + longtoHex(significand.high))

  // Biased exponent
  var biasedExponent = (exponent + EXPONENT_BIAS);
  var dec = { low: Long.fromNumber(0), high: Long.fromNumber(0) };

  // console.log("======================== biasedExponent ")
  // console.log("biasedExponent = " + biasedExponent)
  // console.log("========================= dec 1")
  // console.dir(significand)

  // Encode combination, exponent, and significand.
  if(significand.high.shiftRightUnsigned(49).and(Long.fromNumber(1)).equals(Long.fromNumber)) {
    // console.log("path 0")
    // Encode '11' into bits 1 to 3
    dec.high = dec.high.or(Long.fromNumber(0x3).shiftLeft(61));
    dec.high = dec.high.or(Long.fromNumber(biasedExponent).and(Long.fromNumber(0x3fff).shiftLeft(47)));
    dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x7fffffffffff)));
  } else {
    // console.log("path 1 :: " + biasedExponent)
    // console.log("[0] dec->high = " + longtoHex(dec.high))
    dec.high = dec.high.or(Long.fromNumber(biasedExponent & 0x3fff).shiftLeft(49));
    // console.log("[1] dec->high = " + longtoHex(dec.high))
    // console.log("[1:1] significand.high = " + longtoHex(significand.high));
    // console.log("[1:2] dec->high = " + longtoHex(significand.high.and(Long.fromNumber(0x1ffffffffffff))));
    dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x1ffffffffffff)));
    // console.log("[2] dec->high = " + longtoHex(dec.high))
  }

  dec.low = significand.low;

  // console.log("========================= dec 0")
  // console.dir(dec)
  // console.log(" dec.low: " + dec.low.toString())
  // console.log(" dec.high: " + dec.high.toString())

  // Encode sign
  if(isNegative) {
    dec.high = dec.high.or(Long.fromString('9223372036854775808'));
  }

  // console.log("========================= dec 1")
  // console.dir(dec)
  // console.log(" dec.low: " + dec.low.toString())
  // console.log(" dec.high: " + dec.high.toString())

  // Encode into a buffer
  var buffer = new Buffer(16);
  var index = 0;

  // Encode the low 64 bits of the decimal
  // Encode low bits
  buffer[index++] = dec.low.low_ & 0xff;
  buffer[index++] = (dec.low.low_ >> 8) & 0xff;
  buffer[index++] = (dec.low.low_ >> 16) & 0xff;
  buffer[index++] = (dec.low.low_ >> 24) & 0xff;
  // Encode high bits
  buffer[index++] = dec.low.high_ & 0xff;
  buffer[index++] = (dec.low.high_ >> 8) & 0xff;
  buffer[index++] = (dec.low.high_ >> 16) & 0xff;
  buffer[index++] = (dec.low.high_ >> 24) & 0xff;

  // Encode the high 64 bits of the decimal
  // Encode low bits
  buffer[index++] = dec.high.low_ & 0xff;
  buffer[index++] = (dec.high.low_ >> 8) & 0xff;
  buffer[index++] = (dec.high.low_ >> 16) & 0xff;
  buffer[index++] = (dec.high.low_ >> 24) & 0xff;
  // Encode high bits
  buffer[index++] = dec.high.high_ & 0xff;
  buffer[index++] = (dec.high.high_ >> 8) & 0xff;
  buffer[index++] = (dec.high.high_ >> 16) & 0xff;
  buffer[index++] = (dec.high.high_ >> 24) & 0xff;

  // console.log("!!!!!!!!!!!!!!!!!!!!!!!! BUFFER")
  // console.log(buffer.toString('hex'))
  // Return the new Decimal128
  return new Decimal128(buffer);
}

module.exports = Decimal128;
module.exports.Decimal128 = Decimal128;
