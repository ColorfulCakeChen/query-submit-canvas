export { from_ExponentSignedCorrected_SignificandSigned };
export { from_Sign_ExponentSigned_SignificandUnsigned };
export { from_Sign_ExponentSigned_FractionUnsigned };
export { from_Sign_ExponentUnsigned_FractionUnsigned };
export { from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable };
export { from_Uint12 };
export { from_Base64_DecodedValue_Two };
export { from_Base64Char_CodePoint_Two };
export { from_String };
export { Base64Char_CodePoint_Uint8Array_to_Float32Array_generator };
export { Base64Char_StringOrStringArray_to_Float32Array_generator };

import * as ValueMax from "../../util/ValueMax.js";
import * as Base64 from "../Base64.js";
import * as Uint12 from "../Uint12.js";
import * as Float12_Constant_Coder from "./Float12_Constant_Coder.js";


//!!! ...unfinished... (2023/04/02)
// Perhaps, desgin Float8 (8-bits floating-point number).
// In server, every 3 Float8 (3 * 8 bits = 24 bits) are encoded
// as 4 Base64 (4 * 6 bits = 24 bits).


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
 *   A signed (i.e. already apply sign bit) integer representing significand
 * value. It should be between either [ -63, -32 ] or [ 32, 63 ] = [
 * -Float12.Constant.Coder.SignificandUnsignedMax,
 * -Float12.Constant.Coder.SignificandUnsignedMin ] or [
 * Float12.Constant.Coder.SignificandUnsignedMin,
 * Float12.Constant.Coder.SignificandUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the signed and corrected exponent and
 * the signed significand.
 */
function from_ExponentSignedCorrected_SignificandSigned(
  exponent_signed_corrected_n37_p26, significand_signed__n63_n32__p32_p63 ) {

  return ( significand_signed__n63_n32__p32_p63
    * ( 2 ** exponent_signed_corrected_n37_p26 ) );
}

/**
 *
 * It will call Float12.Decoder.from_ExponentSignedCorrected_SignificandSigned().
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
 *   An unsigned (i.e. already masked out sign bit) integer representing
 * unsigned significand value. It should be between [ 32, 63 ] = [
 * Float12.Constant.Coder.SignificandUnsignedMin,
 * Float12.Constant.Coder.SignificandUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the signed exponent
 * integer and the unsigned significand integer.
 */
function from_Sign_ExponentSigned_SignificandUnsigned(
  sign_0_1, exponent_signed_n32_p31, significand_unsigned_p32_p63 ) {

  let exponent_signed_corrected
    = exponent_signed_n32_p31 - Float12_Constant_Coder.FractionBitCount;

  if ( sign_0_1 == 0 ) // Positive
    return from_ExponentSignedCorrected_SignificandSigned(
      exponent_signed_corrected, significand_unsigned_p32_p63 );
  else // Negative
    return from_ExponentSignedCorrected_SignificandSigned(
      exponent_signed_corrected, -significand_unsigned_p32_p63 );
}

/**
 *
 * It will call Float12.Decoder.from_Sgin_ExponentSigned_SignificandUnsigned().
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
 *   An unsigned (i.e. already masked out sign bit) integer representing
 * unsigned fraction value. It should be between [ 0, 31 ] = [
 * Float12.Constant.Coder.FractionUnsignedMin,
 * Float12.Constant.Coder.FractionUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the signed exponent
 * integer and the unsigned fraction integer.
 */
function from_Sign_ExponentSigned_FractionUnsigned(
  sign_0_1, exponent_signed_n32_p31, fraction_unsigned_0_p31 ) {
  return from_Sign_ExponentSigned_SignificandUnsigned(
    sign_0_1, exponent_signed_n32_p31,
    ( fraction_unsigned_0_p31 | Float12_Constant_Coder.ImplicitBitmaskLShifted )
  );
}

/**
 *
 * It will call Float12.Decoder.from_Sign_ExponentSigned_FractionUnsigned().
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
 *   An unsigned (i.e. already masked out sign bit) integer representing
 * unsigned fraction value. It should be between [ 0, 31 ] = [
 * Float12.Constant.Coder.FractionUnsignedMin,
 * Float12.Constant.Coder.FractionUnsignedMax ].
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the unsigned exponent
 * integer and the unsigned fraction integer.
 */
function from_Sign_ExponentUnsigned_FractionUnsigned(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {
  return from_Sign_ExponentSigned_FractionUnsigned(
    sign_0_1,
    ( exponent_unsigned_0_p63 - Float12_Constant_Coder.ExponentOffsetToSigned ),
    fraction_unsigned_0_p31
  );
}

/**
 * Similar to Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned() but
 * it will return 0 if ( exponent_unsigned_0_p63 = 0 ) and
 * ( fraction_unsigned_0_p31 = 0 ) because that is the representable value
 * which is closest to zero.
 *
 * It will call Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned().
 *
 * @return {number}
 *   A 12-bits floating-point number by the sign bit, the unsigned exponent
 * integer and the unsigned fraction integer.
 */
function from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(
  sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 ) {

  if ( ( exponent_unsigned_0_p63 == 0 ) && ( fraction_unsigned_0_p31 == 0 ) )
    return 0;
  else
    return from_Sign_ExponentUnsigned_FractionUnsigned(
      sign_0_1, exponent_unsigned_0_p63, fraction_unsigned_0_p31 );
}

/**
 *
 * It will call Float12.Decoder.from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable().
 * So uint12 zero will become float12 zero, too.
 *
 * @param {integer} uint12_value
 *   The 12-bits unsigned integer to be viewed as float12.
 *
 * @return {number}
 *   A 12-bits floating-point number by the 12-bits unsigned integer which will
 * be destructured as sign, exponent, fraction of float12.
 */
function from_Uint12( uint12_value ) {
  return from_Sign_ExponentUnsigned_FractionUnsigned_Zeroable(
    ( ( uint12_value >> Float12_Constant_Coder.SignBitmaskLShiftCount )
      & Float12_Constant_Coder.SignBitmask ),
    ( ( uint12_value >> Float12_Constant_Coder.ExponentBitmaskLShiftCount )
      & Float12_Constant_Coder.ExponentBitmask ),
    ( uint12_value & Float12_Constant_Coder.FractionBitmask )
  );
}

/**
 *
 * @param {integer} base64_decodedValue_0
 *   A Base64 decoded value (i.e. integer between [ 0, 63 ]). It represents the
 * most-significant bits.
 *
 * @param {integer} base64_decodedValue_1
 *   A Base64 decoded value (i.e. integer between [ 0, 63 ]). It represents the
 * least-significant bits.
 *
 * @return {number}
 *   A float12 (12-bits floating-point number) value decoded from the
 * base64Char_codePoint_0 and base64Char_codePoint_1.
 */
function from_Base64_DecodedValue_Two(
  base64_decodedValue_0, base64_decodedValue_1 ) {

  let uint12_value = Uint12.Decoder.from_Base64_DecodedValue_Two(
    base64_decodedValue_0, base64_decodedValue_1 );
  return from_Uint12( uint12_value );
}

/**
 *
 * @param {integer} base64Char_codePoint_0
 *   A Base64 encoded value (as a charcater's code point). It represents the
 * most-significant bits.
 *
 * @param {integer} base64Char_codePoint_1
 *   A Base64 encoded value (as a charcater's code point). It represents the
 * least-significant bits.
 *
 * @return {number}
 *   A float12 (12-bits floating-point number) value decoded from the
 * base64Char_codePoint_0 and base64Char_codePoint_1.
 */
function from_Base64Char_CodePoint_Two(
  base64Char_codePoint_0, base64Char_codePoint_1 ) {

  let uint12_value = Uint12.Decoder.from_Base64Char_CodePoint_Two(
    base64Char_codePoint_0, base64Char_codePoint_1 );
  return from_Uint12( uint12_value );
}
    
/**
 *
 * @param {string} base64String
 *   A Base64 encoded string (with two charcaters). It represents a Base64
 * encoded float12 (12-bits floating-point number).
 *
 * @return {number}
 *   A float12 (12-bits floating-point number) value decoded from the
 * base64String.
 */
function from_String( base64String ) {
  let uint12_value = Uint12.Decoder.from_String( base64String );
  return from_Uint12( uint12_value );
}

/**
 * Generator for Float12 decoding from a Base64 character code point
 * Uint8Array.
 *
 * Every 2 elements of the source Uint8Array will be decoded into 1 element
 * (i.e. a float12; 12-bits floating-point number) of the result Float32Array.
 *
 * (Copied from
 * Base64.Decoder.Base64Char_CodePoint_Uint8Array_to_Uint8Array_generator())
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 * @param {Uint8Array} source_Base64Char_CodePoint_Uint8Array
 *   The input Base64 encoded value (as a Base64 charcater's code point) data
 * as Uint8Array. If the last bytes not enough 2 bytes, they will be discarded
 * (will not be decoded). If an input byte is not a legal Base64 code (i.e. not
 * A..Z, a..z, 0..9, +, /, -, _), the byte will be skipped (as if it does not
 * exist). So the input bytes can be separated by new line character (which
 * will be skipped and ignored).
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and
 * reporting progress). Default is ( 10 * 1024 ) bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.root_get() ) when ( done = false ).
 *
 * @yield {Float32Array}
 *   Yield ( value = decoded data as Float32Array ) when ( done = true ).
 */
function* Base64Char_CodePoint_Uint8Array_to_Float32Array_generator(
  progressParent,
  source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount ) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  //
  // Note: Bitwising OR with zero is for converting to integer (even if
  //       it is undefined or null or object).
  suspendByteCount |= 0;
  if ( suspendByteCount <= 0 )
    suspendByteCount = ( 10 * 1024 );

  let sourceByteLength = source_Base64Char_CodePoint_Uint8Array.length;
  let sourceBytes = source_Base64Char_CodePoint_Uint8Array;

  // Initialize progress.
  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( sourceByteLength ) );

  // 1. Skip specified lines.

  // It is important that the nextYieldByteCount is not greater than source
  // length, so that it can be used as boundary checking to reduce checking
  // times and increase performance.
  let lineSkipper = Base64.Decoder.lineSkipper_from_Uint8Array(
    progressToAdvance,
    sourceBytes, skipLineCount, suspendByteCount );

  let nextYieldByteCount = yield *lineSkipper;

  // 2. Decode.

  // Exclude the skipped lines.
  let possibleBase64ByteCount = ( sourceByteLength - progressToAdvance.value );

  // Decoding 2 Base64 characters into 1 Float12 will result in a shorter data
  // (about 50% (= 1 / 2) in size).
  let targetElementCount = Math.ceil( possibleBase64ByteCount * 0.5 );

  let targetFloat32Array = new Float32Array( targetElementCount );

  let resultFloat32Count = 0;  // Accumulate the real result Float32 count.

  {
    while ( progressToAdvance.value < sourceByteLength ) {

      nextYieldLoop:

      // (This inner loop combines both source and yield boundary checking.
      // Reducing checking to increase performance.) 
      while ( progressToAdvance.value < nextYieldByteCount ) {

        // Extract 2 source bytes. (A decode unit consists of 2 Base64 encoded
        // source bytes.)
        //
        // Although it is verbose to loop unrolling manually, it is far more
        // faster to use 2 local variables than use a 2-element normal array.
        // (Note: the 2-element normal array is far more faster than a
        // Uint8Array() again).

        let encoded_0;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should
          //       not exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_0 = Base64.Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_0 );


        let encoded_1;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should
          //       not exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_1 = Base64.Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_1 );


        targetFloat32Array[ resultFloat32Count++ ]
          = from_Base64_DecodedValue_Two( encoded_0, encoded_1 );
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if ( progressToAdvance.value >= nextYieldByteCount ) {
        nextYieldByteCount = Math.min(
          sourceByteLength,
          progressToAdvance.value + suspendByteCount );
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

/**
 * Generator for Base64 decoding from an array of Base64 encoded string.
 *
 * Join the string array, convert to Uint8Array, decode as Base64, result in
 * Float32Array.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 * @param {string|string[]} source_Base64Char_String_or_StringArray
 *   A string whose content is Base64 encoded text. Or, a string array whose
 * every element is a Base64 encoded text.
 *
 * @param {TextEncoder} textEncoder
 *   This TextEncoder will convert string to Uint8Array so that the Base64
 * decoder can work.
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and
 * reporting progress). Default is ( 10 * 1024 ) bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.root_get() ) when ( done = false ).
 *
 * @yield {Float32Array}
 *   Yield ( value = decoded data as Float32Array ) when ( done = true ).
 */
function* Base64Char_StringOrStringArray_to_Float32Array_generator(
  progressParent,
  source_Base64Char_String_or_StringArray, textEncoder,
  skipLineCount, suspendByteCount
) {
  return yield* Base64.Decoder
    .from_Base64Char_StringOrStringArray_generator_by_GeneratorFunction(
      progressParent,
      source_Base64Char_String_or_StringArray, textEncoder,
      skipLineCount, suspendByteCount,
      Base64Char_CodePoint_Uint8Array_to_Float32Array_generator
    );
}
