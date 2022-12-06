export { ScientificNotation_Exponent };

import * as Base64 from "./Base64.js";

/**
 * @file This is a scheme for encoding a floating-point number by 5 Base64 (i.e.
 * Uint6 [ 0, 63 ]) characters.
 *
 * Because 30 bits (= 5 * 6 bits ) are used to representing a floating-point
 * number, so called float30.
 *
 *   - The first 4 Base64 characters represents significand.
 *   - The last Base64 character represents exponent.
 *
 */


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
 * (= ScientificNotation_Exponent( Float30.Constant.CoderSignificandOffsetToSign ) )
 */
const CoderSignificandOffsetToSignedExponent
  = ScientificNotation_Exponent( CoderSignificandOffsetToSign );


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
const UseExponentPositiveMax = Base64.Constant.ValueDecodedMax - CoderExponentOffsetToSign;

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
  * The maximum positive value of the significand value of Base64 encoded 30-bits
  * floating-point number in actual use.
  *
  * It always is 999999 (= Float30.Constant.UseSignificandPositiveMaxMore - 1 )
  */
const UseSignificandPositiveMax = UseSignificandPositiveMaxMore - 1;
 
 /**
  * A number which is a little larger than the maximum positive value of the significand
  * value of Base64 encoded 30-bits floating-point number in actual use.
  *
  * It is mainly used for restricting a value not exceeding
  * Float30.Constant.UseSignificandPositiveMax.
  *
  * It always is 1000000 (= 10 ** Float30.Constant.UseSignificandDigitCount)
  */
const UseSignificandPositiveMaxMore = 10 ** Float30.Constant.UseSignificandDigitCount;
 
 
/**
 * The maximum positive value of Base64 encoded 30-bits floating-point number in
 * actual use.
 *
 * It always is 9.9999900000000000E+031
 * (= Float30.Constant.from_SignificandSigned_ExponentSignedCorrected(
 *      Float30.Constant.UseSignificandPositiveMax,
 *      Float30.Constant.UseExponentPositiveMax
 *        - Float30.Constant.UseSignificandFractionDigitCount))
 */
const UsePositiveMax
  = from_SignificandSigned_ExponentSignedCorrected(
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
 * (= Float30.Constant.from_SignificandSigned_ExponentSignedCorrected(
 *      Float30.Constant.UseSignificandPositiveMaxMore,
 *      Float30.Constant.UseExponentPositiveMax
 *        - Float30.Constant.UseSignificandFractionDigitCount))
 */
const UsePositiveMaxMore
  = from_SignificandSigned_ExponentSignedCorrected(
      UseSignificandPositiveMaxMore,
        UseExponentPositiveMax - UseSignificandFractionDigitCount );
  
/**
 * The minimum positive value of Base64 encoded 30-bits floating-point number in
 * actual use.
 *
 * It always is 1.0000000000000000E-031
 * (= Float30.Constant.from_SignificandSigned_ExponentSignedCorrected(
 *      1, -Float30.Constant.UseExponentPositiveMax ) )
 */
const UsePositiveMin
  = from_SignificandSigned_ExponentSignedCorrected( 1, -UseExponentPositiveMax );


/**
 * For example, ScientificNotation_Exponent( -0.25 ) = -1
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return an integer representing the exponent of the specified number when the
 * number is represented in normalized scientific notation (i.e. exponential notation).
 */
function ScientificNotation_Exponent( aNumber ) {
  if ( aNumber === 0 )
    return 0; // For avoiding Math.log10( 0 ) which is -Infinity.

  let exponent = Math.floor(
    Math.log10(
      Math.abs( aNumber ) // Because Math.log10() can not accept negative value.
    )
  );

  return exponent;
}


/**
 * Generate a 30-bits floating-point number by a signed significand and a signed
 * and corrected exponent.
 *
 * @param {integer} significand_signed_n999999_p999999
 *   An signed (i.e. already minus Float30.Constant.CoderSignificandOffsetToSign)
 * integer representing significand value. It should be between [ -999999, 999999 ]
 * = [ -Float30.Constant.UseSignificandPositiveMax,
 * Float30.Constant.UseSignificandPositiveMax ].
 *
 * @param {integer} exponent_signed_n36_p26
 *   An signed (i.e. already minus Float30.Constant.CoderExponentOffsetToSign) and
 * corrected (i.e. already minus Float30.Constant.UseSignificandFractionDigitCount)
 * integer representing exponent value. It should be between [ -36, 26 ]
 * = [
 * -Float30.Constant.UseExponentPositiveMax - Float30.Constant.UseSignificandFractionDigitCount,
 *  Float30.Constant.UseExponentPositiveMax - Float30.Constant.UseSignificandFractionDigitCount ]
 * = [ -31 - 5, 31 - 5 ].
 *
 */
function from_SignificandSigned_ExponentSignedCorrected(
  significand_signed_n999999_p999999,
  exponent_signed_n36_p26
) {
  return significand_signed_n999999_p999999 * (10 ** exponent_signed_n36_p26 );
}

