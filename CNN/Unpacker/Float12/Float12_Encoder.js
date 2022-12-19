export { Estimate_Exponent_Signed };
export { Estimate_Significand_Signed };

import * as Floa12_Constant_Coder from "./Floa12_Constant_Coder.js";
import * as Floa12_Util from "./Floa12_Util.js";

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
  return Floa12_Util.ScientificNotation_Exponent_2( aNumber );
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
