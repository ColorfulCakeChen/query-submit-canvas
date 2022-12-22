export { ScientificNotation_Exponent_10 };
export { ScientificNotation_Exponent_2 };
export { Estimate_Exponent_Signed };
export { Estimate_Significand_Signed };
export { ToString_by_Sign_ExponentUnsigned_FractionUnsigned };
export { ToString_by_Number_ExponentSigned };
export { ToString };

import * as Uint12 from "../Uint12.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";

/**
 * For example, ScientificNotation_Exponent_10( -0.25 ) = -1
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return a signed integer representing the base 10 exponent of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function ScientificNotation_Exponent_10( aNumber ) {
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
 * For example, ScientificNotation_Exponent_2( -0.125 ) = -3
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return a signed integer representing the base 2 exponent of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function ScientificNotation_Exponent_2( aNumber ) {
  if ( aNumber === 0 )
    return 0; // For avoiding Math.log2( 0 ) which is -Infinity.

  let exponent = Math.floor(
    Math.log2(
      Math.abs( aNumber ) // Because Math.log2() can not accept negative value.
    )
  );

  return exponent;
}

/** Estimate the signed exponent integer of the specified number for 12-bits
 * floating-point number Base64 encoding.
 *
 * It just calls SCIENTIFIC_NOTATION_EXPONENT_2().
 *
 * Note: Although it seems more fair to use ROUND() than INT() in
 * SCIENTIFIC_NOTATION_EXPONENT_2(), using ROUND() may result in the most
 * (i.e. left most) significant bit of FLOAT12_ESTIMATE_SIGNIFICAND_SIGNED()
 * not 1 (i.e. illegal significand value). So using INT() instead of ROUND().
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return a signed integer representing the base 2 exponent of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function Estimate_Exponent_Signed( aNumber ) {
  return ScientificNotation_Exponent_2( aNumber );
}

/** Estimate the signed significand integer of the specified number for 12-bits
 * floating-point number Base64 encoding.
 *
 * It un-powers the signed exponent integer (in base 2 (i.e. binary) scientific
 * notation) and TRUNC() the result signed significand (i.e. implicit+fraction)
 * to integer.
 *
 * The result signed significand integer is between either [ -63, -32 ] or [ 32, 63 ].
 *
 * Note: Although it seems more fair to use ROUND() than TRUNC(), using ROUND() may
 * result in -64 or 64 (i.e. illegal significand integer). So using TRUNC().
 *
 * @param {number} aNumber
 *   The number to be found out its significand.
 *
 * @param {number} exponent_signed
 *   The aNumber's exponent (i.e. Estimate_Exponent_Signed( aNumber )).
 *
 * @return {integer}
 *   Return a signed integer representing the base 2 significand of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function Estimate_Significand_Signed( aNumber, exponent_signed ) {
  return Math.trunc(
    aNumber * ( 2 ** ( Float12_Constant_Coder.FractionBitCount - exponent_signed ) )
  );
}

/**
 *
 * It will call Uint12.Encoder.ToString().
 *
 * @param {integer} sign_0_1
 *   The sign bit of the original float12 value. It must be either 0 (for positive)
 * or 1 (for negative).
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
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits floating-point
 * number by the sign bit, the unsigned exponent and the unsigned fraction.
 */
function ToString_by_Sign_ExponentUnsigned_FractionUnsigned(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {

  return Uint12.Encoder.ToString(
      ( sign_0_1 << Float12_Constant_Coder.SignBitmaskLShiftCount )
    | ( exponent_unsigned_0_p63 << Float12_Constant_Coder.ExponentBitmaskLShiftCount )
    | fraction_unsigned_0_p31
  );
}

/**
 *
 * It will call Float12.Encoder.ToString_by_Sign_ExponentUnsigned_FractionUnsigned().
 *
 * @param {number} aNumber
 *   The 12-bits floating-point number to be encoded to Base64 string. It should be
 * between [ Float12.Constant.NegativeMin, Float12.Constant.PositiveMax ].
 *
 * @param {integer} exponent_signed_n32_p31
 *   An signed (i.e. not yet plus Float12.Constant.Coder.ExponentOffsetToSigned)
 * integer representing exponent value. It should be between [ -32, 31 ] = [
 * Float12.Constant.Coder.ExponentNegativeMin,
 * Float12.Constant.Coder.ExponentPositiveMax ].
 * It should be Float12.Encoder.Estimate_Exponent_Signed( number ).
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits floating-point
 * number by the number and its signed exponent.
 */
function ToString_by_Number_ExponentSigned( aNumber, exponent_signed_n32_p31 ) {

  // 1. Extract sign bit.
  let sign_0_1; 
  if ( aNumber < 0 )
    sign_0_1 = 1;
  else
    sign_0_1 = 0;

  // 2. Adjust exponent_signed and extract fraction_unsigned.
  let fraction_unsigned_0_p31;

  // 2.1 If exponent is less than minimum representable (exponent) value,
  //     use minimum representable exponent and fraction value.
  if ( exponent_signed_n32_p31 < Float12_Constant_Coder.ExponentNegativeMin ) {
    exponent_signed_n32_p31 = Float12_Constant_Coder.ExponentNegativeMin;
    fraction_unsigned_0_p31 = Float12_Constant_Coder.FractionUnsignedMin;

  // 2.2 If exponent is greater than maximum representable (exponent) value,
  //     use maximum representable exponent and fraction value.
  } else if ( exponent_signed_n32_p31 > Float12_Constant_Coder.ExponentPositiveMax ) {
    exponent_signed_n32_p31 = Float12_Constant_Coder.ExponentPositiveMax;
    fraction_unsigned_0_p31 = Float12_Constant_Coder.FractionUnsignedMax;

  // 2.3 Otherwise, find out significand by the exponent. And then, get fraction by
  //     masking out the implicit bit of the significand.
  } else {
    fraction_unsigned_0_p31
      = Math.abs( Estimate_Significand_Signed( aNumber, exponent_signed_n32_p31 ) )
          & Float12_Constant_Coder.FractionBitmask;
  }

  // 3. Determine exponent_unsigned.
  let exponent_unsigned_0_p63
    = exponent_signed_n32_p31 + Float12_Constant_Coder.ExponentOffsetToSigned;

  // 4. Compose to string.
  return ToString_by_Sign_ExponentUnsigned_FractionUnsigned(
    sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 );
}

/**
 *
 * It will call Float12.Encoder.ToString_by_Number_ExponentSigned().
 *
 * Note1: It will restrict extracted signed exponent between [ -32, 31 ] = [
 *        Float12.Constant.Coder.ExponentNegativeMin,
 *        Float12.Constant.Coder.ExponentPositiveMax ].
 *
 * Note2: If the specified number is 0, it will be encoded as
 *        ( exponent_signed = Float12.Constant.Coder.ExponentNegativeMin ) (i.e. -32)
 *        (accompanied with ( fraction = 0 ) ) so that
 *        Float12.Decoder.From_Sign_ExponentUnsigned_FractionUnsigned_Zeroable()
 *        will view it as 0 when decoding.
 *
 * @param {number} aNumber
 *   The 12-bits floating-point number to be encoded to Base64 string. It should be
 * between [ Float12.NegativeMin, Float12.PositiveMax ].
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits floating-point
 * number.
 */
function ToString( aNumber ) {

  // Encode 0 as the (positive) minimum representable 12-bits floating-point number.
  let exponent_signed_n32_p31;
  if ( aNumber === 0 )
    exponent_signed_n32_p31 = Float12_Constant_Coder.ExponentNegativeMin;
  else
    exponent_signed_n32_p31 = Estimate_Exponent_Signed( aNumber );

  return ToString_by_Number_ExponentSigned( aNumber, exponent_signed_n32_p31 );
}
