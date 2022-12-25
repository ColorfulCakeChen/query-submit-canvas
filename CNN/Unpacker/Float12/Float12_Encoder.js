export { scientificNotation_Exponent_10 };
export { scientificNotation_Exponent_2 };
export { estimate_Exponent_Signed };
export { estimate_Significand_Signed };
export { to_String_by_Sign_ExponentUnsigned_FractionUnsigned };
export { to_String_by_Number_ExponentSigned };
export { to_String };
export { to_String_from_NumberArray };

import * as Uint12 from "../Uint12.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";

/**
 * For example, scientificNotation_Exponent_10( -0.25 ) = -1
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return a signed integer representing the base 10 exponent of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function scientificNotation_Exponent_10( aNumber ) {
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
 * For example, scientificNotation_Exponent_2( -0.125 ) = -3
 *
 * @param {number} aNumber
 *   The number to be found out its exponent.
 *
 * @return {integer}
 *   Return a signed integer representing the base 2 exponent of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function scientificNotation_Exponent_2( aNumber ) {
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
function estimate_Exponent_Signed( aNumber ) {
  return scientificNotation_Exponent_2( aNumber );
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
 *   The aNumber's exponent (i.e. estimate_Exponent_Signed( aNumber )).
 *
 * @return {integer}
 *   Return a signed integer representing the base 2 significand of the specified number
 * when the number is represented in normalized scientific notation (i.e. exponential
 * notation).
 */
function estimate_Significand_Signed( aNumber, exponent_signed ) {
  return Math.trunc(
    aNumber * ( 2 ** ( Float12_Constant_Coder.FractionBitCount - exponent_signed ) )
  );
}

/**
 *
 * It will call Uint12.Encoder.to_String().
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
function to_String_by_Sign_ExponentUnsigned_FractionUnsigned(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {

  return Uint12.Encoder.to_String(
      ( sign_0_1 << Float12_Constant_Coder.SignBitmaskLShiftCount )
    | ( exponent_unsigned_0_p63 << Float12_Constant_Coder.ExponentBitmaskLShiftCount )
    | fraction_unsigned_0_p31
  );
}

/**
 *
 * It will call Float12.Encoder.to_String_by_Sign_ExponentUnsigned_FractionUnsigned().
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
 * It should be Float12.Encoder.estimate_Exponent_Signed( number ).
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits floating-point
 * number by the number and its signed exponent.
 */
function to_String_by_Number_ExponentSigned( aNumber, exponent_signed_n32_p31 ) {

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
      = Math.abs( estimate_Significand_Signed( aNumber, exponent_signed_n32_p31 ) )
          & Float12_Constant_Coder.FractionBitmask;
  }

  // 3. Determine exponent_unsigned.
  let exponent_unsigned_0_p63
    = exponent_signed_n32_p31 + Float12_Constant_Coder.ExponentOffsetToSigned;

  // 4. Compose to string.
  return to_String_by_Sign_ExponentUnsigned_FractionUnsigned(
    sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 );
}

/**
 *
 * It will call Float12.Encoder.to_String_by_Number_ExponentSigned().
 *
 * Note1: It will restrict extracted signed exponent between [ -32, 31 ] = [
 *        Float12.Constant.Coder.ExponentNegativeMin,
 *        Float12.Constant.Coder.ExponentPositiveMax ].
 *
 * Note2: If the specified number is 0, it will be encoded as
 *        ( exponent_signed = Float12.Constant.Coder.ExponentNegativeMin ) (i.e. -32)
 *        (accompanied with ( fraction = 0 ) ) so that
 *        Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable()
 *        will view it as 0 when decoding.
 *
 * @param {number} aNumber
 *   The 12-bits floating-point number to be encoded to Base64 string. It should be
 * between [ Float12.Constant.NegativeMin, Float12.Constant.PositiveMax ].
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits floating-point
 * number.
 */
function to_String( aNumber ) {

  // Encode 0 as the (positive) minimum representable 12-bits floating-point number.
  let exponent_signed_n32_p31;
  if ( aNumber === 0 )
    exponent_signed_n32_p31 = Float12_Constant_Coder.ExponentNegativeMin;
  else
    exponent_signed_n32_p31 = estimate_Exponent_Signed( aNumber );

  return to_String_by_Number_ExponentSigned( aNumber, exponent_signed_n32_p31 );
}



//!!! ...unfinshed... (2022/12/25)

/**
 *
 * @param {number[]} numberArray
 *   The 12-bits floating-point number array to be encoded to Base64 string array.
 * They should be between [ Float12.Constant.NegativeMin, Float12.Constant.PositiveMax ].
 *
 * @param {TextDecoder} textDecoder
 *   This TextDecoder will convert (Base64 character code point) Uint8Array to string.
 *
 * @return {string}
 *   A Base64 encoded string representing all 12-bits floating-point numbers.
 */
function to_String_from_NumberArray( numberArray ) {


//!!! ...unfinshed... (2022/12/25)

}

/**
 * Generator for encoding Float12 array to Base64 character code point Uint8Array.
 *
 * Every 1 element (i.e. a float12; 12-bits floating-point number) of the source
 * number array will be encoded into 2 elements of the result Uint8Array.
 *
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 * @param {number[]} source_numberArray
 *   The 12-bits floating-point number array to be encoded to Base64 string array.
 * They should be between [ Float12.Constant.NegativeMin, Float12.Constant.PositiveMax ].
 *
 * @param {Uint32} suspendElementCount
 *   Everytime so many elements encoded, yield for releasing CPU time (and reporting
 * progress). Default is ( 10 * 1024 ) elements.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.root_get() ) when ( done = false ).
 *
 * @yield {Uint8Array}
 *   Yield ( value = Base64 encoded data (as Base64 charcaters' code point)
 * as Uint8Array ) when ( done = true ).
 */
function* to_Base64Char_CodePoint_Uint8Array_from_NumberArray(
  progressParent, source_numberArray, suspendElementCount ) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  //
  // Note: Bitwising OR with zero is for converting to integer (if it is undefined
  //       or null).
  if ( ( suspendElementCount | 0 ) <= 0 )
    suspendElementCount = ( 10 * 1024 );

  let sourceElementCount = source_numberArray.length;
  let sourceElements = source_numberArray;

  // Initialize progress.
  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( sourceElementCount ) );

  // 1.

  // It is important that the nextYieldElementCount is not greater than source length,
  // so that it can be used as boundary checking to reduce checking times and increase
  // performance.
  let nextYieldElementCount
    = Math.min( sourceElementCount, progressToAdvance.value + suspendElementCount );

  // 2. Decode.

  // Exclude the skipped lines.
  let possibleSourceElementCount = ( sourceElementCount - progressToAdvance.value );

  // Encoding 1 Float12 into 2 Base64 characters will result in a longer data
  // (about 200% (= 2 / 1) in size).
  let targetUint8Count = Math.ceil( possibleSourceElementCount * 2 );

  let targetUint8Array = new Uint8Array( targetUint8Count );
  //target_Base64Char_CodePoint_Uint8Array

  let resultUint8Count = 0;  // Accumulate the real result Uint8 count.

  {
    while ( progressToAdvance.value < sourceElementCount ) {

      nextYieldLoop:

      // (This inner loop combines both source and yield boundary checking. Reducing
      // checking to increase performance.) 
      while ( progressToAdvance.value < nextYieldElementCount ) {

//!!! ...unfinshed... (2022/12/25)

        // Extract 1 source element (i.e. a floating-point number).
        //
        // Although it is verbose to loop unrolling manually, it is far more faster
        // to use 2 local variables than use a 2-element normal array. (Note: the
        // 2-element normal array is far more faster than a Uint8Array() again).

        let encoded_0;
        do {
          // Note: It may exceed the nextYieldElementCount boundary. But it should not
          //       exceed sourceElementCount.
          if ( progressToAdvance.value >= sourceElementCount )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_0 = Base64.Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_0 );


        let encoded_1;
        do {
          // Note: It may exceed the nextYieldElementCount boundary. But it should not
          //       exceed sourceElementCount.
          if ( progressToAdvance.value >= sourceElementCount )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_1 = Base64.Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_1 );


        targetFloat32Array[ resultFloat32Count++ ]
          = from_Base64Char_CodePoint_Two( encoded_0, encoded_1 );
      }

      // Every suspendElementCount, release CPU time (and report progress).
      if ( progressToAdvance.value >= nextYieldElementCount ) {
        nextYieldElementCount
          = Math.min( sourceElementCount, progressToAdvance.value + suspendElementCount );
        yield progressRoot;
      }

    }
  }

  // 3. Result.

  // The resultFloat32Array is a sub-range of target buffer.
  //
  // Because the source may have some non-base64 codes which will be ignored,
  // the length of resultFloat32Array may be less than targetFloat32Array.
  let resultFloat32Array = new Float32Array(
    targetFloat32Array.buffer, 0, resultFloat32Count );

  yield progressRoot; // Report the progress has been done (100%).

  return resultFloat32Array;
}
