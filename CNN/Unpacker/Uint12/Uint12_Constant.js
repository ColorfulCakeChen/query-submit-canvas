export {
  CoderLeastSignificantBitCount,
  CoderLeastSignificantBitmask,

  CoderMostSignificantBitCount,
  CoderMostSignificantBitmask,
  CoderMostSignificantBitmaskLShiftCount,
  CoderMostSignificantBitmaskLShifted,

  CoderBitCount,

  UnsignedMin,
  UnsignedMax,

  StringCharCount,
  NextStringCharCount,
};

import * as Base64 from "../Base64.js";
import * as Bitmask from "../Bitmask.js";


/**
 * The least significant bit count of a 12-bits unsigned integer.
 *
 * It always is 6.
 */
const CoderLeastSignificantBitCount = 6;

/**
 * The least significant bitmask (without left-shifted) of a 12-bits unsigned
 * integer.
 *
 * It always is 63 (=0b111111).
 */
const CoderLeastSignificantBitmask
  = Bitmask.ByBitCount( CoderLeastSignificantBitCount );


/**
 * The most significant bit count of a 12-bits unsigned integer.
 *
 * It always is 6.
 */
const CoderMostSignificantBitCount = 6;

/**
 * The most significant bitmask (without left-shifted) of a 12-bits unsigned
 * integer.
 *
 * It always is 63 (=0b111111).
 */
const CoderMostSignificantBitmask
  = Bitmask.ByBitCount( CoderMostSignificantBitCount );

/**
 * The position (as left-shift count) of the most significant bitmask of a
 * 12-bits unsigned integer.
 *
 * It always is 6.
 */
const CoderMostSignificantBitmaskLShiftCount = CoderLeastSignificantBitCount;

/**
 * The most significant bitmask (with left-shifted) of a 12-bits unsigned
 * integer.
 *
 * It always is 4032.
 */
const CoderMostSignificantBitmaskLShifted = Bitmask.ByBitCount_LShift(
  CoderMostSignificantBitCount, CoderMostSignificantBitmaskLShiftCount );


/**
 * The bit count of a 12-bits unsigned integer.
 *
 * It always is 12.
 */
const CoderBitCount
  = CoderMostSignificantBitCount + CoderLeastSignificantBitCount;


/**
 * The minimum 12-bits unsigned integer.
 *
 * It always is 0.
 */
const UnsignedMin = 0;

/**
 * The maximum 12-bits unsigned integer.
 *
 * It always is 4095.
 */
const UnsignedMax = ( ( 2 ** CoderBitCount ) - 1 );


/**
 * The result string length (character count) for representing a BASE64 encoded
 * 12-bits unsigned integer.
 *
 * It always is 2.
 */
const StringCharCount
  = Math.ceil( CoderBitCount / Base64.Constant.CoderBitCount );

/**
 * The distance (i.e. character count) to the next BASE64 encoded 12-bits
 * unsigned integer in a packed string.
 *
 * It always is 2.
 */
const NextStringCharCount = StringCharCount;
