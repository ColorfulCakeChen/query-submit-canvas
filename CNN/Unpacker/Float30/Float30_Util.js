
export { ScientificNotation_Exponent };
export { from_SignificandSigned_ExponentSignedCorrected };

/** */
const TenExpTable_n36_p26_offset = 36;

/**
 * Because Math.pow( 10, m ) has accumulated error (e.g. ( 10 ** 26 ) != 1.0E+26 ),
 * using a look-up table to generating ( 10 ** m ) for n between [ -36, 26 ].
 *
 * Please use ( m + TenExpTable_n36_p26_offset ) = ( m + 36 ) as array index of
 * TenExpTable_n36_p26[].
 */
const TenExpTable_n36_p26 = new Array( 63 );
{
  for ( let i = 0; i < TenExpTable_n36_p26.length; ++i ) {
    let exponent = i - TenExpTable_n36_p26_offset;
    TenExpTable_n36_p26[ i ] = Number.parseFloat( `1E${exponent}` );
  }
}

/**
 * For example, ScientificNotation_Exponent_2( -0.125 ) = -3
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return an integer representing the base 2 exponent of the specified number when
 * the number is represented in normalized scientific notation (i.e. exponential notation).
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

/**
 * For example, ScientificNotation_Exponent_10( -0.25 ) = -1
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return an integer representing the base 10 exponent of the specified number when
 * the number is represented in normalized scientific notation (i.e. exponential notation).
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
 * -Float30.Constant.UseExponentPositiveMax
 *    - Float30.Constant.UseSignificandFractionDigitCount,
 *  Float30.Constant.UseExponentPositiveMax
 *    - Float30.Constant.UseSignificandFractionDigitCount
 * ]
 * = [ -31 - 5, 31 - 5 ].
 *
 */
function from_SignificandSigned_ExponentSignedCorrected(
  significand_signed_n999999_p999999, exponent_signed_n36_p26 ) {

  //!!! (2022/12/06) Use TenExpTable_n36_p26[] for reducing Math.pow() accumulation error.
  //return significand_signed_n999999_p999999 * (10 ** exponent_signed_n36_p26 );

  return significand_signed_n999999_p999999
           * TenExpTable_n36_p26[ exponent_signed_n36_p26 + TenExpTable_n36_p26_offset ];
}
