export * as Coder from "./Float12_Constant_Coder.js";

export {
  StringCharCount,
  NextStringCharCount,

  NegativeMin,
  NegativeMinLess,

  PositiveMax,
  PositiveMaxMore,

  PositiveMin,
  PositiveMinLess,
};

import * as Base64 from "../Base64.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";
import * as Float12_Decoder from "./Float12_Decoder.js";


/**
 * The result string length (character count) for representing a BASE64 encoded
 * 12-bits floating-point number.
 *
 * It always is 2.
 */
const StringCharCount = Math.ceil(
  Float12_Constant_Coder.BitCount / Base64.Constant.CoderBitCount );

/**
 * The distance (i.e. character count) to the next BASE64 encoded 12-bits 
 * floating-point number in a packed string.
 *
 * It always is 2.
 */
const NextStringCharCount = StringCharCount;


/**
 * The minimum negative value of a Base64 encoded 12-bits floating-point
 * number.
 *
 * It always is -4.2278584320000000E+009
 */
const NegativeMin = Float12_Decoder.from_Sign_ExponentSigned_FractionUnsigned(
  1,
  Float12_Constant_Coder.ExponentPositiveMax,
  Float12_Constant_Coder.FractionUnsignedMax );

/**
 * A number which is a little smaller than the minimum negative value of a
 * 12-bits floating-point number.
 *
 * It is mainly used for restricting a value not smaller than
 * Float12.Constant.NegativeMin.
 *
 * The extra value is small but representable by floating-point number.
 *
 * It always is -4.2278584330000000E+009
 */
const NegativeMinLess = NegativeMin - 1;

/**
 * The maximum positive value of a Base64 encoded 12-bits floating-point
 * number.
 *
 * It always is 4.2278584320000000E+009
 */
const PositiveMax = Float12_Decoder.from_Sign_ExponentSigned_FractionUnsigned(
  0,
  Float12_Constant_Coder.ExponentPositiveMax,
  Float12_Constant_Coder.FractionUnsignedMax );

/**
 * A number which is a little larger than the maximum positive value of a
 * 12-bits floating-point number.
 *
 * It is mainly used for restricting a value not exceeding
 * Float12.Constant.PositiveMax.
 *
 * The extra value is small but representable by floating-point number.
 *
 * It always is 4.2278584330000000E+009
 */
const PositiveMaxMore = PositiveMax + 1;


/**
 * The minimum positive value of a Base64 encoded 12-bits floating-point
 * number.
 *
 * In fact, Float12.Constant.PositiveMinLess is the real minimum representable
 * positive value of a 12-bits floating-point number. However, it is used to
 * represent zero by
 * Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(). The
 * number which is a little larger than Float12.Constant.PositiveMinLess is
 * used as this Float12.Constant.PositiveMin (i.e. fraction=1 instead of 0).
 *
 * It always is 2.4010660126805300E-010
 */
const PositiveMin = Float12_Decoder.from_Sign_ExponentSigned_FractionUnsigned(
  0,
  Float12_Constant_Coder.ExponentNegativeMin,
  1 );

/**
 * A number which is a little smaller than the minimum positive value of a
 * 12-bits floating-point number.
 *
 * In fact, it is the real minimum representable positive value of a 12-bits
 * floating-point number. However, it is used to represent zero by
 * Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(). So
 * it should be viewed as a little smaller than the minimum positive value
 * (i.e. Float12.Constant.PositiveMin) of a 12-bits floating-point number in
 * actual use.
 *
 * It always is 2.3283064365387000E-010
 */
const PositiveMinLess = Float12_Decoder.from_Sign_ExponentSigned_FractionUnsigned(
  0,
  Float12_Constant_Coder.ExponentNegativeMin,
  0 );
