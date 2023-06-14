export { 
  FractionBitCount,
  FractionBitmask,
  FractionUnsignedMin,
  FractionUnsignedMax,

  ImplicitBitCount,
  ImplicitBitmask,
  ImplicitBitmaskLShiftCount,
  ImplicitBitmaskLShifted,

  ExponentBitCount,
  ExponentBitmask,
  ExponentBitmaskLShiftCount,
  ExponentBitmaskLShifted,
  ExponentOffsetToSigned,
  ExponentNegativeMin,
  ExponentPositiveMax,

  SignBitCount,
  SignBitmask,
  SignBitmaskLShiftCount,
  SignBitmaskLShifted,

  SignificandBitCount,
  SignificandUnsignedMin,
  SignificandUnsignedMax,

  BitCount
};

import * as Base64 from "../Base64.js";
import * as Bitmask from "../Bitmask.js";

/**
 * @file This is a scheme for encoding a floating-point number by 2 Base64
 * (i.e. Uint6 [ 0, 63 ]) characters.
 *
 * Because 12 bits (= 2 * 6 bits ) are used to representing a floating-point
 * number, so called float12.
 *
 *   - sign: 1 bit.
 *   - exponent: 6 bits.
 *   - fraction: 5 bits.
 *
 *
 *    bit                    bit
 *     11                     0
 *      s e e e e e e f f f f f 
 *
 *
 * It is a shorter floating-point representation (especially similar to
 * bfloat16). However, float12 is mainly used for storage (i.e. not for
 * computation). So, it has no NaN value, no sub-normal value. And it views the
 * representable value which is closest to zero (i.e. exponent_unsigned = 0 and
 * fraction_unsigned = 0) as 0 (this is different from standard floating-point
 * representation).
 *
 */


/**
 * The fraction (of significand) bit count of a 12-bits floating-point number.
 *
 * It always is 5.
 */
const FractionBitCount = 5;

/**
 * The fraction (of significand) bitmask (without left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 31 (=0b11111).
 */
const FractionBitmask = Bitmask.ByBitCount( FractionBitCount );

/**
 * The minimum representable fraction of a 12-bits floating-point number.
 *
 * It always is 0.
 */
const FractionUnsignedMin = 0;

/**
 * The maximum representable fraction of a 12-bits floating-point number.
 *
 * It always is 31.
 */
const FractionUnsignedMax = ( ( 2 ** FractionBitCount ) - 1 );


/**
 * The implicit (of significand) bit count of a 12-bits floating-point number.
 *
 * It always is 1.
 */
const ImplicitBitCount = 1;

/**
 * The implicit (of significand) bitmask (without left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 1 (=0b1).
 */
const ImplicitBitmask = Bitmask.ByBitCount( ImplicitBitCount );

/**
 * The position (as left-shift count) of the implicit (of significand) bitmask
 * of a 12-bits floating-point number.
 *
 * It always is 5.
 */
const ImplicitBitmaskLShiftCount = FractionBitCount;

/**
 * The implicit (of significand) bitmask (with left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 32.
 */
const ImplicitBitmaskLShifted = Bitmask.ByBitCount_LShift(
  ImplicitBitCount, ImplicitBitmaskLShiftCount );


/**
 * The exponent bit count of a 12-bits floating-point number. It always is 6.
 */
const ExponentBitCount = 6;

/**
 * The exponent bitmask (without left-shifted) of a 12-bits floating-point
 * number.
 *
 * It always is 63 (=0b111111).
 */
const ExponentBitmask = Bitmask.ByBitCount( ExponentBitCount );

/**
 * The position (as left-shift count) of the exponent bitmask of a 12-bits
 * floating-point number.
 *
 * It always is 5.
 */
const ExponentBitmaskLShiftCount = FractionBitCount;

/**
 * The exponent bitmask (with left-shifted) of a 12-bits floating-point number.
 *
 * It always is 2016.
 */
const ExponentBitmaskLShifted = Bitmask.ByBitCount_LShift(
  ExponentBitCount, ExponentBitmaskLShiftCount );

/**
 * The offset for exponent (of BASE64 encoded 12-bits floating-point number)
 * becoming signed integer between [ -32, +31 ].
 *
 * It always is 32.
 */
const ExponentOffsetToSigned = ( ( 2 ** ExponentBitCount ) / 2 );

/**
 * The minimum negative value of the signed exponent value of a Base64 encoded
 * 12-bits floating-point number.
 *
 * It always is -32.
 */
const ExponentNegativeMin = -ExponentOffsetToSigned;

/**
 * The maximum positive value of the signed exponent value of a Base64 encoded
 * 12-bits floating-point number.
 *
 * It always is 31.
 */
const ExponentPositiveMax
  = Base64.Constant.ValueDecodedMax - ExponentOffsetToSigned;


/**
 * The sign bit count of a 12-bits floating-point number.
 *
 * It always is 1.
 */
const SignBitCount = 1;

/**
 * The sign bitmask (without left-shifted) of a 12-bits floating-point number.
 *
 * It always is 1 (=0b1).
 */
const SignBitmask = Bitmask.ByBitCount( SignBitCount );

/**
 * The position (as left-shift count) of the sign bitmask of a 12-bits
 * floating-point number.
 *
 * It always is 11.
 */
const SignBitmaskLShiftCount = ExponentBitCount + FractionBitCount;

/**
 * The sign bitmask (with left-shifted) of a 12-bits floating-point number.
 *
 * It always is 2048.
 */
const SignBitmaskLShifted = Bitmask.ByBitCount_LShift(
  SignBitCount, SignBitmaskLShiftCount );


/**
 * The significand (i.e. implicit+fraction) bit count of a 12-bits
 * floating-point number.
 *
 * It always is 6.
 */
const SignificandBitCount = ImplicitBitCount + FractionBitCount;

/**
 * The minimum representable significand (i.e. implicit+fraction) of a 12-bits
 * floating-point number.
 *
 * It always is 32.
 */
const SignificandUnsignedMin = ImplicitBitmaskLShifted;

/**
 * The maximum representable significand (i.e. implicit+fraction) of a 12-bits
 * floating-point number.
 *
 * It always is 63.
 */
const SignificandUnsignedMax = ( ( 2 ** SignificandBitCount ) - 1 );


/**
 * The bit count of a 12-bits floating-point number.
 *
 * It always is 12.
 */
const BitCount = SignBitCount + ExponentBitCount + FractionBitCount;
