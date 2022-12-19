export { From__ExponentSignedCorrected__SignificandSigned };

//import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";

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
 *   A 12-bits floating-point number by the signed significand and the signed and
 * corrected exponent.
 */
function From__ExponentSignedCorrected__SignificandSigned(
  exponent_signed_corrected_n37_p26, significand_signed__n63_n32__p32_p63 ) {

  return (
    significand_signed__n63_n32__p32_p63 * ( 2 ** exponent_signed_corrected_n37_p26 )
  );
}


//!!! ...unfinished... (2022/12/19)

