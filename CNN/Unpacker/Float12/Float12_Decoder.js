export { From_ExponentSignedCorrected_SignificandSigned };
export { From_Sign_ExponentSigned_SignificandUnsigned };
export { From_Sign_ExponentSigned_FractionUnsigned };
export { From_Sign_ExponentUnsigned_FractionUnsigned };
export { From_Sign_ExponentUnsigned_FractionUnsigned_Zeroable };
export { From_Uint12 };
export { From_Base64Char_CodePoint_Two };
export { FromString };

import * as Uint12 from "../Uint12.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";

/**
 *
 * @param {integer} exponent_signed_corrected_n37_p26
 *   A signed (i.e. already minus Float12.Constant.Coder.ExponentOffsetToSigned)
 * and corrected (i.e. already minus Float12.Constant.Coder.FractionBitCount)
 * integer representing exponent value. It should be between [ -37, 26 ] = [
 * Float12.Constant.Coder.ExponentNegativeMin - Float12.Constant.Coder.FractionBitCount,
 * Float12.Constant.Coder.ExponentPositiveMax - Float12.Constant.Coder.FractionBitCount ]
 * = [ -32 - 5, 31 - 5 ].
 *
 * @param {integer} significand_signed__n63_n32__p32_p63
 *   A signed (i.e. already apply sign bit) integer representing significand value.
 * It should be between either [ -63, -32 ] or [ 32, 63 ] = [
 * -Float12.Constant.Coder.SignificandUnsignedMax,
 * -Float12.Constant.Coder.SignificandUnsignedMin ] or [
 * Float12.Constant.Coder.SignificandUnsignedMin,
 * Float12.Constant.Coder.SignificandUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the signed and corrected exponent and the
 * signed significand.
 */
function From_ExponentSignedCorrected_SignificandSigned(
  exponent_signed_corrected_n37_p26, significand_signed__n63_n32__p32_p63 ) {

  return (
    significand_signed__n63_n32__p32_p63 * ( 2 ** exponent_signed_corrected_n37_p26 )
  );
}

/**
 *
 * It will call Float12.Decoder.From_ExponentSignedCorrected_SignificandSigned().
 *
 * @param {integer} sign_0_1
 *   The sign bit of the result value. It must be either 0 (for positive) or
 * 1 (for negative).
 *
 * @param {integer} exponent_signed_n32_p31
 *   An signed (i.e. already minus Float12.Constant.Coder.ExponentOffsetToSigned)
 * integer representing exponent value. It should be between [ -32, 31 ] = [
 * Float12.Constant.Coder.ExponentNegativeMin,
 * Float12.Constant.Coder.ExponentPositiveMax ].
 *
 * @param {integer} significand_unsigned_p32_p63
 *   An unsigned (i.e. already masked out sign bit) integer representing unsigned
 * significand value. It should be between [ 32, 63 ] = [
 * Float12.Constant.Coder.SignificandUnsignedMin,
 * Float12.Constant.Coder.SignificandUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the signed exponent integer
 * and the unsigned significand integer.
 */
function From_Sign_ExponentSigned_SignificandUnsigned(
  sign_0_1, exponent_signed_n32_p31, significand_unsigned_p32_p63 ) {

  let exponent_signed_corrected
    = exponent_signed_n32_p31 - Float12_Constant_Coder.FractionBitCount;

  if ( sign_0_1 == 0 ) // Positive
    return From_ExponentSignedCorrected_SignificandSigned(
      exponent_signed_corrected, significand_unsigned_p32_p63 );
  else // Negative
    return From_ExponentSignedCorrected_SignificandSigned(
      exponent_signed_corrected, -significand_unsigned_p32_p63 );
}

/**
 *
 * It will call Float12.Decoder.From_Sgin_ExponentSigned_SignificandUnsigned().
 *
 * @param {integer} sign_0_1
 *   The sign bit of the result value. It must be either 0 (for positive) or
 * 1 (for negative).
 *
 * @param {integer} exponent_signed_n32_p31
 *   An signed (i.e. already minus Float12.Constant.Coder.ExponentOffsetToSigned)
 * integer representing exponent value. It should be between [ -32, 31 ] = [
 * Float12.Constant.Coder.ExponentNegativeMin,
 * Float12.Constant.Coder.ExponentPositiveMax ].
 *
 * @param {integer} fraction_unsigned_0_p31
 *   An unsigned (i.e. already masked out sign bit) integer representing unsigned
 * fraction value. It should be between [ 0, 31 ] = [
 * Float12.Constant.Coder.FractionUnsignedMin,
 * Float12.Constant.Coder.FractionUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the signed exponent integer
 * and the unsigned fraction integer.
 */
function From_Sign_ExponentSigned_FractionUnsigned(
  sign_0_1, exponent_signed_n32_p31, fraction_unsigned_0_p31 ) {
  return From_Sign_ExponentSigned_SignificandUnsigned(
    sign_0_1, exponent_signed_n32_p31,
    ( fraction_unsigned_0_p31 | Float12_Constant_Coder.ImplicitBitmaskLShifted )
  );
}

/**
 *
 * It will call Float12.Decoder.From_Sign_ExponentSigned_FractionUnsigned().
 *
 * @param {integer} sign_0_1
 *   The sign bit of the result value. It must be either 0 (for positive) or
 * 1 (for negative).
 *
 * @param {integer} exponent_unsigned_0_p63
 *   An unsigned (i.e. not yet minus Float12.Constant.Coder.ExponentOffsetToSigned)
 * integer representing exponent value. It should be between [ 0, 63 ] = [
 * 0, Base64.Constant.ValueDecodedMax ].
 *
 * @param {integer} fraction_unsigned_0_p31
 *   An unsigned (i.e. already masked out sign bit) integer representing unsigned
 * fraction value. It should be between [ 0, 31 ] = [
 * Float12.Constant.Coder.FractionUnsignedMin,
 * Float12.Constant.Coder.FractionUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the unsigned exponent integer
 * and the unsigned fraction integer.
 */
function From_Sign_ExponentUnsigned_FractionUnsigned(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {
  return From_Sign_ExponentSigned_FractionUnsigned(
    sign_0_1,
    ( exponent_unsigned_0_p63 - Float12_Constant_Coder.ExponentOffsetToSigned ),
    fraction_unsigned_0_p31
  );
}

/**
 * Similar to Float12.Decoder.From_Sign_ExponentUnsigned_FractionUnsigned() but it
 * will return 0 if ( exponent_unsigned_0_p63 = 0 ) and ( fraction_unsigned_0_p31 = 0 )
 * because that is the representable value which is closest to zero.
 *
 * It will call Float12.Decoder.From_Sign_ExponentUnsigned_FractionUnsigned().
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the unsigned exponent integer
 * and the unsigned fraction integer.
 */
function From_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {

  if ( ( exponent_unsigned_0_p63 == 0 ) && ( fraction_unsigned_0_p31 == 0 ) )
    return 0;
  else
    return From_Sign_ExponentUnsigned_FractionUnsigned(
      sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 );
}

/**
 *
 * It will call Float12.Decoder.From_Sign_ExponentUnsigned_FractionUnsigned_Zeroable().
 * So uint12 zero will become float12 zero, too.
 *
 * @param {integer} uint12_value
 *   The 12-bits unsigned integer to be viewed as float12.
 *
 * @return {number}
 *   A 12-bits floating-point number by the 12-bits unsigned integer which will be
 * destructured as sign, exponent, fraction of float12.
 */
function From_Uint12( uint12_value ) {
  return From_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(
    ( ( uint12_value >> Float12_Constant_Coder.SignBitmaskLShiftCount )
      & Float12_Constant_Coder.SignBitmask ),
    ( ( uint12_value >> Float12_Constant_Coder.ExponentBitmaskLShiftCount )
      & Float12_Constant_Coder.ExponentBitmask ),
    ( uint12_value & Float12_Constant_Coder.FractionBitmask )
  );
}


/**
 *
 * @param {integer} base64Char_codePoint_0
 *   A BASE64 encoded value (as a charcater's code point). It represents the
 * most-significant bits.
 *
 * @param {integer} base64Char_codePoint_1
 *   A BASE64 encoded value (as a charcater's code point). It represents the
 * least-significant bits.
 *
 * @return {number}
 *   A float12 (12-bits floating-point number) value decoded from the
 * base64Char_codePoint_0 and base64Char_codePoint_1.
 */
function From_Base64Char_CodePoint_Two(
  base64Char_codePoint_0, base64Char_codePoint_1 ) {

  let uint12_value = Uint12.Decoder.From_Base64Char_CodePoint_Two(
    base64Char_codePoint_0, base64Char_codePoint_1 );
  return From_Uint12( uint12_value );
}
    
/**
 *
 * @param {string} base64String
 *   A BASE64 encoded string (with two charcaters). It represents a BASE64 encoded
 * float12 (12-bits floating-point number).
 *
 * @return {number}
 *   A float12 (12-bits floating-point number) value decoded from the base64String.
 */
function FromString( base64String ) {
  let uint12_value = Uint12.Decoder.FromString( base64String );
  return From_Uint12( uint12_value );
}
