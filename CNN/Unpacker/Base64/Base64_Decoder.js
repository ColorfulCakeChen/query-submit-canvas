export { from_Base64Char_StringOrStringArray_generator_by_GeneratorFunction };
export { from_Base64Char_CodePoint_ArrayBuffer_generator_by_GeneratorFunction };

export { Base64Char_StringOrStringArray_to_Uint8Array_generator };
export { Base64Char_CodePoint_ArrayBuffer_to_Uint8Array_generator };
export { Base64Char_CodePoint_Uint8Array_to_Uint8Array_generator };

export { lineSkipper_from_Uint8Array };

import * as ValueMax from "../../util/ValueMax.js";
import * as Base64_Constant from "./Base64_Constant.js";

/**
 * Generator for Base64 decoding from an array of Base64 encoded string.
 *
 * Join the string array, and convert to Uint8Array. And then, decode as Base64
 * by generatorFunction.
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
 *   The TextEncoder for converting string to Uint8Array so that the Base64
 * decoder can work.
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and
 * reporting progress). Default is ( 10 * 1024 ) bytes.
 *
 * @param {function*} generatorFunction
 *   A generator function which accepts parameters ( progressParent,
 * source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount ).
 * It should:
 *   - Yield ( value = progressParent.root_get() ) when ( done = false ).
 *   - Yield ( value = decoded data ) when ( done = true ).
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.root_get() ) when ( done = false ).
 *
 * @yield {any}
 *   Yield ( value = decoded data of generatorFunction ) when ( done = true ).
 */
function* from_Base64Char_StringOrStringArray_generator_by_GeneratorFunction(
  progressParent,
  source_Base64Char_String_or_StringArray, textEncoder,
  skipLineCount, suspendByteCount,
  generatorFunction
) {

  let progressRoot = progressParent.root_get();

  // The ( progressToAdvance / progressParent ) ratio (50%) seems a little too
  // large. But it is reasonable in fact because the string Array.join() and
  // TextEncoder.encode() both will scan all input text. This is just the same
  // as the Base64 decoder (i.e. scanning all input text).

  // 50% for this function (i.e. Array.join() and TextEncoder.encode()).
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

  // 50% for next sub function (i.e. Base64 decoder).
  let progressParentNew = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let base64EncodedStringLong;
  if ( source_Base64Char_String_or_StringArray instanceof Array )
    // Note: If some element is undefined (or null), the String.join() still
    //       works correctly (i.e. undefined (or null) will be just ignored).
    base64EncodedStringLong = source_Base64Char_String_or_StringArray.join( "" );
  else
    base64EncodedStringLong = source_Base64Char_String_or_StringArray;

  progressToAdvance.value_advance(); // 25%
  yield progressRoot;

  let source_Base64Char_CodePoint_Uint8Array
    = textEncoder.encode( base64EncodedStringLong );

  progressToAdvance.value_advance(); // 25%
  yield progressRoot;

  let base64Decoder = generatorFunction(
    progressParentNew,
    source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount );

  let base64DecodedArray = yield *base64Decoder;
  return base64DecodedArray;
}

/**
 * Generator for Base64 decoding from an ArrayBuffer by generatorFunction.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 * @param {ArrayBuffer} source_Base64Char_CodePoint_ArrayBuffer
 *   The input Base64 encoded value (as a Base64 charcater's code point) data
 * as ArrayBuffer. If the last bytes not enough 4 bytes, they will be discarded
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
 * @param {function*} generatorFunction
 *   A generator function which accepts parameters ( progressParent,
 * source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount ).
 * It should:
 *   - Yield ( value = progressParent.root_get() ) when ( done = false ).
 *   - Yield ( value = decoded data ) when ( done = true ).
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.root_get() ) when ( done = false ).
 *
 * @yield {any}
 *   Yield ( value = decoded data of generatorFunction ) when ( done = true ).
 */
function* from_Base64Char_CodePoint_ArrayBuffer_generator_by_GeneratorFunction(
  progressParent,
  source_Base64Char_CodePoint_ArrayBuffer, skipLineCount, suspendByteCount,
  generatorFunction ) {

  let source_Base64Char_CodePoint_Uint8Array
    = new Uint8Array( source_Base64Char_CodePoint_ArrayBuffer );

  let base64Decoder = generatorFunction( progressParent,
    source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount );

  let base64DecodedArray = yield *base64Decoder;
  return base64DecodedArray;
}

/**
 * Generator for Base64 decoding from an array of Base64 encoded string.
 *
 * Join the string array, convert to Uint8Array, decode as Base64, result in
 * another Uint8Array.
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
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* Base64Char_StringOrStringArray_to_Uint8Array_generator(
  progressParent,
  source_Base64Char_String_or_StringArray, textEncoder,
  skipLineCount, suspendByteCount
) {
  return yield*
    from_Base64Char_StringOrStringArray_generator_by_GeneratorFunction(
      progressParent,
      source_Base64Char_String_or_StringArray, textEncoder,
      skipLineCount, suspendByteCount,
      Base64Char_CodePoint_Uint8Array_to_Uint8Array_generator
    );
}

/**
 * Generator for Base64 decoding from an ArrayBuffer.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 * @param {ArrayBuffer} source_Base64Char_CodePoint_ArrayBuffer
 *   The input Base64 encoded value (as a Base64 charcater's code point) data
 * as ArrayBuffer. If the last bytes not enough 4 bytes, they will be discarded
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
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* Base64Char_CodePoint_ArrayBuffer_to_Uint8Array_generator(
  progressParent,
  source_Base64Char_CodePoint_ArrayBuffer, skipLineCount, suspendByteCount ) {

  return yield*
    from_Base64Char_CodePoint_ArrayBuffer_generator_by_GeneratorFunction(
      progressParent,
      source_Base64Char_CodePoint_ArrayBuffer, skipLineCount, suspendByteCount,
      Base64Char_CodePoint_Uint8Array_to_Uint8Array_generator
    );
}

/**
 * Generator for line skipping specified lines from an Uint8Array.
 *
 * @param {ValueMax.Percentage.AggregConcrete} progressToAdvance
 *   This progressToAdvance will be increased when every time an Unit8
 * advanced. The progressToAdvance.root_get() will be returned when every time
 * yield. The progressToAdvance.max should be the same as
 * sourceUint8Array.length.
 *
 * @param {Uint8Array} sourceUint8Array
 *   The input data as Uint8Array.
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the sourceUint8Array.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and
 * reporting progress).
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressToAdvance.root_get() ) when ( done = false ).
 *
 * @yield {number}
 *   Yield ( value = nextYieldByteCount ) when ( done = true ).
 */
function* lineSkipper_from_Uint8Array( progressToAdvance,
  sourceUint8Array, skipLineCount, suspendByteCount ) {

  let sourceByteLength = sourceUint8Array.length;
  let sourceBytes = sourceUint8Array;

  // Initialize progress.
  let progressRoot = progressToAdvance.root_get();

  // It is important that the nextYieldByteCount is not greater than source
  // length, so that it can be used as boundary checking to reduce checking
  // times and increase performance.
  let nextYieldByteCount
    = Math.min( sourceByteLength, progressToAdvance.value + suspendByteCount );

  // 1. Skip specified lines.
  {
    let skippedLineCount = 0;

    while ( progressToAdvance.value < sourceByteLength ) {
      if ( skippedLineCount >= skipLineCount )
        break;                  // Already skip enough lines.

      // (This inner loop combines both source and yield boundary checking.
      // Reduce checking to increase performance.) 
      while ( progressToAdvance.value < nextYieldByteCount ) {
        if ( skippedLineCount >= skipLineCount )
          break;                // Already skip enough lines.

        let rawByte = sourceBytes[ progressToAdvance.value ];
        progressToAdvance.value_advance();

        if ( 13 == rawByte ) {  // "\r" (carriage return; CR)
          ++skippedLineCount;   // One line is skipped.

          // If a LF follows a CR, it is considered as CRLF sequence and viewed
          // as the same one line.
          //
          // Note: It may exceed the nextYieldByteCount boundary. But it should
          //       not exceed sourceByteLength.
          if (   ( progressToAdvance.value < sourceByteLength )
              && ( 10 == sourceBytes[ progressToAdvance.value ] )
             ) { 
            progressToAdvance.value_advance(); // Skip it.
          }

        } else {
          if ( 10 == rawByte )  // "\n" (new line; LF)
            ++skippedLineCount; // One line is skipped. 
        }
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if ( progressToAdvance.value >= nextYieldByteCount ) {
        nextYieldByteCount = Math.min(
          sourceByteLength, progressToAdvance.value + suspendByteCount );
        yield progressRoot;
      }
    }
  }

  return nextYieldByteCount;
}

/**
 * Generator for Base64 decoding from a Base64 character code point Uint8Array.
 *
 * Every 4 elements of the source Uint8Array will be decoded into 3 elements of
 * the result Uint8Array.
 *
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 * @param {Uint8Array} source_Base64Char_CodePoint_Uint8Array
 *   The input Base64 encoded value (as a Base64 charcater's code point) data
 * as Uint8Array. If the last bytes not enough 4 bytes, they will be discarded
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
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* Base64Char_CodePoint_Uint8Array_to_Uint8Array_generator(
  progressParent,
  source_Base64Char_CodePoint_Uint8Array, skipLineCount, suspendByteCount ) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  //
  // Note: Bitwising OR with zero is for converting to integer (if it is
  //       undefined or null).
  if ( ( suspendByteCount | 0 ) <= 0 )
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
  let lineSkipper = lineSkipper_from_Uint8Array( progressToAdvance,
    sourceBytes, skipLineCount, suspendByteCount );

  let nextYieldByteCount = yield *lineSkipper;

  // 2. Decode.

  // Exclude the skipped lines.
  let possibleBase64ByteCount = ( sourceByteLength - progressToAdvance.value );

  // Decoding 4 Base64 characters into 3 uint8 will result in a shorter data
  // (about 75% (= 3 / 4) in size).
  let targetByteLength = Math.ceil( possibleBase64ByteCount * 0.75 );

  let targetArrayBuffer = new ArrayBuffer( targetByteLength );
  let targetBytes = new Uint8Array( targetArrayBuffer );

  let resultByteCount = 0;  // Accumulate the real result byte count.

  {
    while ( progressToAdvance.value < sourceByteLength ) {

      nextYieldLoop:

      // (This inner loop combines both source and yield boundary checking. Reducing
      // checking to increase performance.) 
      while ( progressToAdvance.value < nextYieldByteCount ) {

        // Extract 4 source bytes. (A decode unit consists of 4 Base64 encoded source
        // bytes.)
        //
        // Although it is verbose to loop unrolling manually, it is far more faster
        // to use 4 local variables than use a 4-element normal array. (Note: the
        // 4-element normal array is far more faster than a Uint8Array() again).

        let encoded_0;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should not
          //       exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_0 = Base64_Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_0 );


        let encoded_1;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should not
          //       exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_1 = Base64_Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_1 );


        let encoded_2;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should not
          //       exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_2 = Base64_Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_2 );


        let encoded_3;
        do {
          // Note: It may exceed the nextYieldByteCount boundary. But it should not
          //       exceed sourceByteLength.
          if ( progressToAdvance.value >= sourceByteLength )
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_3 = Base64_Constant.DecodeTable_CharCodePoint_to_Uint6[
            sourceBytes[ progressToAdvance.value ] ];
          progressToAdvance.value_advance();
        } while ( 255 === encoded_3 );


        targetBytes[ resultByteCount++ ] = ( encoded_0       << 2) | (encoded_1 >> 4);
        targetBytes[ resultByteCount++ ] = ((encoded_1 & 15) << 4) | (encoded_2 >> 2);
        targetBytes[ resultByteCount++ ] = ((encoded_2 &  3) << 6) | (encoded_3 & 63);
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if ( progressToAdvance.value >= nextYieldByteCount ) {
        nextYieldByteCount
          = Math.min( sourceByteLength, progressToAdvance.value + suspendByteCount );
        yield progressRoot;
      }

    }
  }

  // 3. Result.

  // The resultBytes is a sub-range of target buffer.
  //
  // Because the source may have some non-base64 codes which will be ignored,
  // the length of resultBytes may be less than targetBytes.
  let resultBytes = new Uint8Array( targetArrayBuffer, 0, resultByteCount );

  yield progressRoot; // Report the progress has been done (100%).

  return resultBytes;
}
