"use strict"

var Long = require('./long');

var PARSE_STRING_REGEXP = /^(\+|\-)?(\d+|(\d*\.\d+))?(E|e)?([\-\+])?(\d+)?$/;

var EXPONENT_MAX = 6111;
var EXPONENT_MIN = -6176;
var EXPONENT_BIAS = 6176;
var MAX_DIGITS = 34;

// Nan value bits as 32 bit values (due to lack of longs)
var NAN_BUFFER = [0x7c, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
// Infinity value bits 32 bit values (due to lack of longs)
var INF_NEGATIVE_BUFFER = [0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
var INF_POSITIVE_BUFFER = [0x78, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

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

  var leftHigh = left.shiftRight(32);
  var leftLow = new Long(left.getLowBits(), 0);
  var rightHigh = right.shiftRight(32);
  var rightLow = new Long(right.getLowBits(), 0);

  var productHigh = leftHigh.multiply(rightHigh);
  var productMid = leftHigh.multiply(rightLow);
  var productMid2 = leftLow.multiply(rightHigh);
  var productLow = leftLow.multiply(rightLow);

  productHigh = productHigh.add(productMid.shiftRight(32));
  productMid = new Long(productMid.getLowBits(), 0)
                .add(productMid2)
                .add(productLow.shiftRight(32));

  productHigh = productHigh.add(productMid.shiftRight(32));
  productLow = productMid.shiftLeft(32).add(new Long(productLow.getLowBits(), 0));

  // Return the 128 bit result
  return {high: productHigh, low: productLow};
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

  console.log("[0] exponent = " + exponent)
  console.log("[0] radixPosition = " + radixPosition)

  // Overflow prevention
  if(exponent <= radixPosition && radixPosition - exponent > (1 << 14)) {
    console.log("-- exponent 0")
    exponent = EXPONENT_MIN;
  } else {
    console.log("-- exponent 1")
    exponent = exponent - radixPosition;
  }

  console.log("[1] exponent = " + exponent)

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
    var endOfString = nDigitsRead;

    // If we have seen a radix point, 'string' is 1 longer than we have
    // documented with ndigits_read, so inc the position of the first nonzero
    // digit and the position that digits are read to.
    if(sawRadix && exponent == MIN_EXPONENT) {
      firstNonZero = firstNonZero + 1;
      endOfString = endOfString + 1;
    }

    var roundDigit = string[firstNonZero + lastDigit + 1] - '0';
    var roundBit = 0;

    if(roundBit >= 5) {
      roundBit = 1;

      if(roundDigit == 5) {
        roundBit = digits[lastDigit] % 2 == 1;

        for(var i = firstNonZero + lastDigit + 2; i < endOfString; i++) {
          if(string[i] - '0') {
            roundBit = 1;
            break;
          }
        }
      }
    }

    if(roundBit) {
      var dIdx = lastDigit;

      for(; dIdx >= 0; dIdx--) {
        if(++digits[dIdx] > 9) {
          digits[dIdx] = 0;

          // overflowed most significant digit
          if(dIdex == 0) {
            if(exponent < MAX_EXPONENT) {
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

  // Encode significand
  // The high 17 digits of the significand
  significandHigh = Long.fromNumber(0);
  // The low 17 digits of the significand
  significandLow = Long.fromNumber(0);

  // read a zero
  if(significantDigits == 0) {
    significandHigh = Long.fromNumber(0);
    significandLow = Long.fromNumber(0);
  } else if(lastDigit - firstDigit < 17) {
    var dIdx = firstDigit;
    significandLow = Long.fromNumber(digits[dIdx++]);

    for(; dIdx <= lastDigit; dIdx++) {
      significandLow = significandLow.multiply(Long.fromNumber(10));
      significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
      significandHigh = new Long(0, 0);
    }
  } else {
    var dIdx = firstDigit;
    significandHigh = Long.fromNumber(digits[dIdx++]);

    for(; dIdx <= lastDigit - 17; dIdx++) {
      significandHigh = significandHigh.multiply(Long.fromNumber(10));
      significandHigh = significandHigh.add(Long.fromNumber(digits[dIdx]));
    }

    significandLow = Long.fromNumber(digits[dIdx++]);

    for(; dIdx <= lastDigit; dIdx) {
      significandLow = significandLow.multiply(Long.fromNumber(10));
      significandLow = significandLow.add(Long.fromNumber(digits[dIdx]));
    }
  }

  var significand = multiply64x2(significandHigh, Long.fromString("100000000000000000"));
  significand.low = significand.low.add(significandLow);

  if(significand.low.lessThan(significandLow)) {
    significand.high = significand.high.add(Long.fromNumber(1));
  }

  console.log("======================== significand")
  console.dir("exponent = " + exponent)
  console.dir("significand.low = " + significand.low.toString())
  console.dir("significand.high = " + significand.high.toString())

  // Biased exponent
  var biasedExponent = (exponent + EXPONENT_BIAS);
  var dec = { low: Long.fromNumber(0), high: Long.fromNumber(0) };

  // console.log("========================= dec 1")
  // console.dir(significand)

  // Encode combination, exponent, and significand.
  if(significand.high.shiftRight(49).and(Long.fromNumber(1)).equals(Long.fromNumber)) {
    console.log("path 0")
    // Encode '11' into bits 1 to 3
    dec.high = dec.high.or(Long.fromNumber(0x3).shiftLeft(61));
    dec.high = dec.high.or(Long.fromNumber(biasedExponent).and(Long.fromNumber(0x3fff).shiftLeft(47)));
    dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x7fffffffffff)));
  } else {
    console.log("path 1 :: " + biasedExponent)
    // console.log("!!!!!!!!!!!!!!!!!!!!!! 1 :: " + biasedExponent)
    console.dir(dec.high.toString())
    dec.high = dec.high.or(Long.fromNumber(biasedExponent & 0x3fff).shiftLeft(49));
    console.dir(dec.high.toString())
    dec.high = dec.high.or(significand.high.and(Long.fromNumber(0x1ffffffffffff)));
    console.dir(dec.high.toString())
  }

  dec.low = significand.low;

  console.log("========================= dec 0")
  console.dir(dec)
  console.log(" dec.low: " + dec.low.toString())
  console.log(" dec.high: " + dec.high.toString())

  // Encode sign
  if(isNegative) {
    dec.high = dec.high.or(Long.fromString('9223372036854775808'));
  }

  console.log("========================= dec 1")
  console.dir(dec)
  console.log(" dec.low: " + dec.low.toString())
  console.log(" dec.high: " + dec.high.toString())

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

// "use strict"
//
// // Regular expressions used to match string format
// var SCIENTIFIC_EXPONENT_REGEXP = /(E|e)\+?/;
// var INFINITY_REGEX = /^(\+|\-)?Inf(inity)?$/i;
// var NAN_REGEXP = /^NaN$/i;
// var SIGNIFICANT_WITH_LEADING_ZEROS = /(0*)(\d+)/;
// var DECIMAL_POINT = /\./;
// var ZERO = /\0/;
// var VALID_DECIMAL128_STRING_REGEX = /^(\+|\-)?(\d+|(\d*\.\d+))?((E|e)?[\-\+]?\d+)?$/;
// var VALID_DECIMAL128_STRING_REGEX = /^(\+|\-)?(\d+|(\d*\.\d+))?(E|e)?([\-\+])?(\d+)?$/;
// var SIGN_DIGITS_SEPARATOR = /^(\-)?(\S+)/;
//
// var Parser = function() {}
//
// Parser.parseString = function(string) {
//   // Validate the string
//   Parser.validate(string);
//
//   // Split up the string
//   var entries = string.match(SIGN_DIGITS_SEPARATOR);
//   var original = entries[0];
//   var sign = entries[1];
//   var digitsString = entries[2];
//   console.log("----------------------------- -4")
//   console.log(entries)
//
//   // Split up exponent
//   var entries = digitsString.split(SCIENTIFIC_EXPONENT_REGEXP);
//   var digits = entries[0];
//   var scientificExp = entries[2];
//   console.log("----------------------------- -3")
//   console.log(entries)
//
//   // Split by decimal point
//   var entries = digits.split(DECIMAL_POINT);
//   var beforeDecimal = entries[0];
//   var afterDecimal = entries[1];
//
//   if(parseInt(beforeDecimal, 10) >= 0) {
//     var significantDigits = beforeDecimal + afterDecimal;
//   } else {
//     var significantDigits = afterDecimal.match(SIGNIFICANT_WITH_LEADING_ZEROS)[2];
//   }
//
//   // Exponent
//   var exponent = -1 * afterDecimal.length;
//   console.log("----------------------------- -2")
//   console.log(exponent)
//   console.log(scientificExp)
//   if(scientificExp) exponent = exponent + parseInt(scientificExp, 10);
//   console.log("----------------------------- -1")
//   console.log(exponent)
//
//   console.log("----------------------------- 0")
//   console.log(exponent)
//   console.log(significantDigits)
//
//   // Round the exponent
//   var entries = Parser.roundExact(exponent, significantDigits);
//   exponent = entries[0];
//   significantDigits = entries[1];
//
//   console.log("----------------------------- 1")
//   console.log(exponent)
//   console.log(significantDigits)
//
//   // Clamp it
//   var entries = Parser.clamp(exponent, significantDigits);
//   exponent = entries[0];
//   significantDigits = entries[1];
//
//   console.log("----------------------------- 2")
//   console.log(exponent)
//   console.log(significantDigits)
//
//   // Return the results
//   return [significantDigits, exponent, sign == '-'];
// }
//
// Parser.roundExact = function(exponent, significantDigits) {
//   if(exponent < Decimal128.MIN_EXPONENT) {
//     var j = 0;
//
//     for(var i = significantDigits.length; i > 0; i--) {
//       if(exponent < Decimal128.MIN_EXPONENT && significantDigits[i - 1] == ZERO) {
//         exponent += 1;
//         j += 1;
//         continue
//       }
//     }
//   }
//
//   return [exponent, significantDigits.substr(j)];
// }
//
// Parser.clamp = function(exponent, significantDigits) {
//   if(exponent > Decimal128.MAX_EXPONENT) {
//     while(exponent > Decimal128.MAX_EXPONENT && significantDigits.length < 34) {
//       exponent -= 1;
//       significantDigits = significantDigits + "0";
//     }
//   }
//
//   return [exponent, significantDigits];
// }
//
// Parser.parseSpecialType = function(string) {
//   if(NAN_REGEXP.test(string)) {
//     return new Decimal128(Decimal128.NAN_STRING);
//   } else {
//     var match = string.match(INFINITY_REGEX);
//     if(!match) {
//       return new Decimal128('' + match[1] + Decimal128.INFINITY_STRING);
//     }
//   }
// }
//
// Parser.validate = function(string) {
//   if(!VALID_DECIMAL128_STRING_REGEX.test(string)) {
//     throw new Error('Invalid Decimal128 string format');
//   }
// }
//
// // Decimal128 type
// var Decimal128 = function(bytes) {
//   this.bytes = bytes;
// }
//
// Decimal128.prototype.equals = function(other) {
//   if(!(other instanceof Decimal128)) return false;
//   for(var i = 0; i < this.bytes.length; i++) {
//     if(this.bytes[i] != other.bytes[i]) return false;
//   }
//
//   return true;
// }
//
// // Constants
// Decimal128.INFINITY_MASK = 0x7800000000000000;
// Decimal128.NAN_MASK =  0x7c00000000000000;
// Decimal128.SIGN_BIT_MASK = (1 << 63);
// Decimal128.EXPONENT_OFFSET = 6176;
// Decimal128.MIN_EXPONENT = -6176;
// Decimal128.MAX_EXPONENT = 6111;
// Decimal128.TWO_HIGHEST_BITS_SET = (3 << 61);
// Decimal128.SIGNIFICANDS_REGEX = /^(0*)(\d*)/;
//
// // Representation
// Decimal128.NAN_STRING = 'NaN';
// Decimal128.INFINITY_STRING = 'Infinity';
//
// // Add the parser
// Decimal128.Parser = Parser;
//
// // Decimal128.EXTENDED_JSON_KEY = "$numberDecimal";
//
// module.exports = Decimal128;
// module.exports.Decimal128 = Decimal128;
