export * as Coder from "./Float12_Constant_Coder.js";

export {
  NegativeMin,

};

 import * as Base64 from "../Base64.js";
// import * as Bitmask from "../Bitmask.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";
import * as Float12_Decoder from "./Float12_Decoder.js";
//import * as Float12_Encoder from "./Float12_Encoder.js";


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
 * The minimum negative value of a Base64 encoded 12-bits floating-point number.
 *
 * It always is -4.2278584320000000E+009
 */
const NegativeMin
  = Float12_Decoder.From_Sign_ExponentSigned_FractionUnsigned(
      1,
      Float12_Constant_Coder.ExponentPositiveMax,
      Float12_Constant_Coder.FractionUnsignedMax );

/**
 * A number which is a little smaller than the minimum negative value of a 12-bits
 * floating-point number.
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
 * The maximum positive value of a Base64 encoded 12-bits floating-point number.
 *
 * It always is  4.2278584320000000E+009
 */
const PositiveMax
  = Float12_Decoder.From_Sign_ExponentSigned_FractionUnsigned(
    0,
    Float12_Constant_Coder.ExponentPositiveMax,
    Float12_Constant_Coder.FractionUnsignedMax );

/**
 * A number which is a little larger than the maximum positive value of a 12-bits
 * floating-point number.
 *
 * It is mainly used for restricting a value not exceeding
 * Float12.Constant.PositiveMax.
 *
 * The extra value is small but representable by floating-point number.
 *
 * It always is  4.2278584330000000E+009
 */
const PositiveMaxMore = PositiveMax + 1;


//!!! ...unfinished... (2022/12/21)
