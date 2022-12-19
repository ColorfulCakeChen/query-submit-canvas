export { 
  CoderExponentDigitCount,
  CoderExponentOffsetToSign,
  CoderSignificandDigitCount,
  CoderSignificandUnsignedMax,
  CoderSignificandOffsetToSign,
  CoderSignificandOffsetToSignedExponent
};

export {
  StringSignificandCharCount,
  StringExponentCharCount,
  StringCharCount,
  NextStringCharCount
};

export {
  UseExponentPositiveMax,
  UseExponentPositiveMaxMore,

  UseSignificandDigitCount,
  UseSignificandFractionDigitCount,
  UseSignificandPositiveMax,
  UseSignificandPositiveMaxMore,

  UsePositiveMax,
  UsePositiveMaxMore,
  UsePositiveMin
};  

import * as Base64 from "../Base64.js";
import * as Bitmask from "../Bitmask.js";
//import * as Float12_Util from "./Float12_Util.js";

/**
 * @file This is a scheme for encoding a floating-point number by 2 Base64 (i.e.
 * Uint6 [ 0, 63 ]) characters.
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
 * It is a shorter floating-point representation (especially similar to bfloat16).
 * However, float12 is mainly used for storage (i.e. not for computation). So, it
 * has no NaN value, no sub-normal value. And it views the representable value
 * which is closest to zero (i.e. exponent_unsigned = 0 and fraction_unsigned = 0)
 * as 0 (this is different from standard floating-point representation).
 *
 */




/** The fraction (of significand) bit count of a 12-bits floating-point number.
 *
 * It always is 5.
 */
const CoderFractionBitCount = 5;

/** The fraction (of significand) bitmask (without left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 31 (=0b11111).
 */
const CoderFractionBitmask = Bitmask.ByBitCount( CoderFractionBitCount );

/** The maximum representable fraction of a 12-bits floating-point number.
 *
 * It always is 31.
 */
const CoderFractionUnsignedMax = ( ( 2 ** CoderFractionBitCount ) - 1 );

/** The minimum representable fraction of a 12-bits floating-point number.
 *
 * It always is 0.
 */
const CoderFractionUnsignedMin = 0;


/** The implicit (of significand) bit count of a 12-bits floating-point number.
 *
 * It always is 1.
 */
const CoderImplicitBitCount = 1;

/** The implicit (of significand) bitmask (without left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 1 (=0b1).
 */
const CoderImplicitBitmask = Bitmask.ByBitCount( CoderImplicitBitCount );

/** The position (as left-shift count) of the implicit (of significand) bitmask of
 * a 12-bits floating-point number.
 *
 * It always is 5.
 */
const CoderImplicitLShiftCount = CoderFractionBitCount;

/** The implicit (of significand) bitmask (with left-shifted) of a 12-bits
 * floating-point number.
 *
 * It always is 32.
 */
const CoderImplicitLShifted = Bitmask.ByBitCount_LShifted(
  CoderImplicitBitCount, CoderImplicitLShiftCount );


/** The exponent bit count of a 12-bits floating-point number. It always is 6. */
const CoderExponentBitCount = 6;

/** The exponent bitmask (without left-shifted) of a 12-bits floating-point number.
 *
 * It always is 63 (=0b111111).
 */
const CoderExponentBitmask = Bitmask.ByBitCount( CoderExponentBitCount );

/** The position (as left-shift count) of the exponent bitmask of a 12-bits
 * floating-point number.
 *
 * It always is 5.
 */
const CoderExponentBitmaskLShiftCount = CoderFractionBitCount;

/** The exponent bitmask (with left-shifted) of a 12-bits floating-point number.
 *
 * It always is 2016.
 */
const CoderExponentBitmaskLShifted = Bitmask.ByBitCount_LShifted(
  CoderExponentBitCount, CoderExponentBitmaskLShiftCount );

/** The offset for exponent (of BASE64 encoded 12-bits floating-point number)
 * becoming signed integer between [ -32, +31 ].
 *
 * It always is 32.
 */
const CoderExponentOffsetToSigned = ( ( 2 ** CoderExponentBitCount ) / 2 );

/** The minimum negative value of the signed exponent value of a Base64 encoded
 * 12-bits floating-point number.
 *
 * It always is -32.
 */
const CoderExponentNegativeMin = -CoderExponentOffsetToSigned;

/** The maximum positive value of the signed exponent value of a Base64 encoded
 * 12-bits floating-point number.
 *
 * It always is 31.
 */
const CoderExponentPositiveMax
  = Base64.Constant.ValueDecodedMax - CoderExponentOffsetToSigned;


/** The sign bit count of a 12-bits floating-point number.
 *
 * It always is 1.
 */
const CoderSignBitCount = 1;

/** The sign bitmask (without left-shifted) of a 12-bits floating-point number.
 *
 * It always is 1 (=0b1).
 */
const CoderSignBitmask = Bitmask.ByBitCount( CoderSignBitCount );

/** The position (as left-shift count) of the sign bitmask of a 12-bits
 * floating-point number.
 *
 * It always is 11.
 */
const CoderSignBitmaskLShiftCount = CoderExponentBitCount + CoderFractionBitCount;

/** The sign bitmask (with left-shifted) of a 12-bits floating-point number.
 *
 * It always is 2048.
 */
const CoderSignBitmaskLShifted = Bitmask.ByBitCount_LShifted(
  CoderSignBitCount, CoderSignBitmaskLShiftCount );


  FLOAT12_CODER_SIGNIFICAND_BIT_COUNT().

  The significand (i.e. implicit+fraction) bit count of a 12-bits floating-point number.
  
  It always is 6 (=FLOAT12_CODER_IMPLICIT_BIT_COUNT()+FLOAT12_CODER_FRACTION_BIT_COUNT()).





//!!! ...unfinished... (2022/12/19)






/** The bit count of a 12-bits floating-point number.
 *
 * It always is 12.
 */
const CoderBitCount = CoderSignBitCount + CoderExponentBitCount + CoderFractionBitCount;







//!!! ...unfinished... (2022/12/19) should be deprecated.

/**
 * The digit count of exponent value when encode/decode 30-bits floating-point
 * number to/from Base64 string. It always is 1.
 */
const CoderExponentDigitCount = 1;

/**
 * The offset for exponent (of BASE64 encoded floating-point number) becoming
 * signed integer between [ -32, +31 ]. It always is 32 (= Base64.Constant.CodeCount / 2).
 */
const CoderExponentOffsetToSign = Base64.Constant.CodeCount / 2;

/**
 * The digit count of significand value when encode/decode 30-bits floating-point
 * number to/from Base64 string. It always is 4.
 */
const CoderSignificandDigitCount = 4;

/**
 * The maximum representable significand value when encode/decode 30-bits
 * floating-point number to/from Base64 string. It always is 16777215.
 * (= ( 64 ** 4 ) - 1 )
 */
const CoderSignificandUnsignedMax
  = ( Base64.Constant.CodeCount ** CoderSignificandDigitCount ) - 1;

/**
 * The offset value for significand value becoming signed value when encode/decode
 * 30-bits floating-point number to/from Base64 string. It always is 8388608.
 */
const CoderSignificandOffsetToSign = Math.ceil( CoderSignificandUnsignedMax / 2 );

/**
 * The exponent for the offset value for significand value becoming signed value
 * when encode/decode 30-bits floating-point number to/from Base64 string.
 * It always is 6
 * (= Float30_Util.ScientificNotation_Exponent(
 *      Float30.Constant.CoderSignificandOffsetToSign ) )
 */
const CoderSignificandOffsetToSignedExponent
  = Float30_Util.ScientificNotation_Exponent( CoderSignificandOffsetToSign );


/**
 * The significand BASE64 character count for BASE64 encoded 30-bits 
 * floating-point number. It always is 4.
 */
const StringSignificandCharCount = 4;

/**
 * The exponent BASE64 character count for BASE64 encoded 30-bits
 * floating-point number. It always is 1.
 */
const StringExponentCharCount = 1;

/**
 * The result string length (character count) for representing a BASE64 encoded
 * 30-bits floating-point number. It always is 5
 * (= Float30.Constant.StringSignificandCharCount
 *      + Float30.Constant.StringExponentCharCount = 4 + 1).
 *
 * Every Base64 character represents 6-bits unsigned integer. 5 Base64 characters
 * represents 30-bits floating point number. So called float30.
 */
const StringCharCount = StringSignificandCharCount + StringExponentCharCount;

/**
 * The distance (i.e. character count) to the next BASE64 encoded 30-bits 
 * floating-point number in a packed string. It always is 5
 * (= Float30.Constant.StringCharCount).
 */
const NextStringCharCount = StringCharCount;

 
/**
 * The maximum positive value of the exponent value of Base64 encoded 30-bits
 * floating-point number in actual use. It always is 31
 * (= Base64.Constant.ValueDecodedMax - Float30.Constant.CoderExponentOffsetToSign)
 */
const UseExponentPositiveMax
  = Base64.Constant.ValueDecodedMax - CoderExponentOffsetToSign;

/**
 * A number which is a little larger than the maximum positive value of the exponent
 * value of Base64 encoded 30-bits floating-point number in actual use.
 *
 * It is mainly used for restricting a value not exceeding
 * Float30.Constant.UseExponentPositiveMax.
 *
 * It always is 32 (= Float30.Constant.UseExponentPositiveMax + 1)
 */
const UseExponentPositiveMaxMore = UseExponentPositiveMax + 1;


/**
 * The digit count of the significand value in actual use. It always is 6
 * (= Float30.Constant.CoderSignificandOffsetToSignedExponent)
 */
const UseSignificandDigitCount = CoderSignificandOffsetToSignedExponent;

/**
 * The digit count of the fraction (i.e. below the decimal point) of the significand
 * value in actual use.
 *
 * The signed significand is an integer but should be viewed as a floating-point
 * number with this (10-base) exponent.
 *
 * It always is 5 (= Float30.Constant.CoderSignificandOffsetToSignedExponent - 1 )
 */
const UseSignificandFractionDigitCount = CoderSignificandOffsetToSignedExponent - 1;

/**
 * A number which is a little larger than the maximum positive value of the significand
 * value of Base64 encoded 30-bits floating-point number in actual use.
 *
 * It is mainly used for restricting a value not exceeding
 * Float30.Constant.UseSignificandPositiveMax.
 *
 * It always is 1000000 (= 10 ** Float30.Constant.UseSignificandDigitCount)
 */
const UseSignificandPositiveMaxMore = 10 ** UseSignificandDigitCount;

/**
 * The maximum positive value of the significand value of Base64 encoded 30-bits
 * floating-point number in actual use.
 *
 * It always is 999999 (= Float30.Constant.UseSignificandPositiveMaxMore - 1 )
 */
const UseSignificandPositiveMax = UseSignificandPositiveMaxMore - 1;


/**
 * The maximum positive value of Base64 encoded 30-bits floating-point number in
 * actual use.
 *
 * It always is 9.9999900000000000E+031
 * (= Float30_Util.from_SignificandSigned_ExponentSignedCorrected(
 *      Float30.Constant.UseSignificandPositiveMax,
 *      Float30.Constant.UseExponentPositiveMax
 *        - Float30.Constant.UseSignificandFractionDigitCount))
 */
const UsePositiveMax
  = Float30_Util.from_SignificandSigned_ExponentSignedCorrected(
      UseSignificandPositiveMax,
        UseExponentPositiveMax - UseSignificandFractionDigitCount );

/**
 * A number which is a little larger than the maximum positive value of 30-bits
 * floating-point number.
 *
 * It is mainly used for restricting a value not exceeding Float30.Constant.UsePositiveMax.
 *
 * The extra value is small but representable by floating-point number.
 *
 * It always is  1.0000000000000000E+032
 * (= Float30.Util.from_SignificandSigned_ExponentSignedCorrected(
 *      Float30.Constant.UseSignificandPositiveMaxMore,
 *      Float30.Constant.UseExponentPositiveMax
 *        - Float30.Constant.UseSignificandFractionDigitCount))
 */
const UsePositiveMaxMore
  = Float30_Util.from_SignificandSigned_ExponentSignedCorrected(
      UseSignificandPositiveMaxMore,
        UseExponentPositiveMax - UseSignificandFractionDigitCount );

/**
 * The minimum positive value of Base64 encoded 30-bits floating-point number in
 * actual use.
 *
 * It always is 1.0000000000000000E-031
 * (= Float30.Util.from_SignificandSigned_ExponentSignedCorrected(
 *      1, -Float30.Constant.UseExponentPositiveMax ) )
 */
const UsePositiveMin
  = Float30_Util.from_SignificandSigned_ExponentSignedCorrected(
      1, -UseExponentPositiveMax );
