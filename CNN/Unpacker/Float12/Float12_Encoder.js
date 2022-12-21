export { ScientificNotation_Exponent_10 };
export { ScientificNotation_Exponent_2 };
export { Estimate_Exponent_Signed };
export { Estimate_Significand_Signed };

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
