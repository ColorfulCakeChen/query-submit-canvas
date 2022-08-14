export { decoder_FromArrayBuffer, decoder_FromUint8Array };

import * as ValueMax from "./ValueMax.js";

const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Mapping table for base64 (as Uint8) to index.
let table_base64_Uint8_to_index = new Array(256); // Faster than using Uint8Array().
{
  // For all non-base64 codes, using value greater than 63 (i.e. impossible base64) for identifying them.
  for (let i = 0; i < table_base64_Uint8_to_index.length; ++i)
    table_base64_Uint8_to_index[ i ] = 255;

  // For all legal base64 codes, using value between [0, 63].
  {
    for (let i = 0; i < base64String.length; ++i) {
      let codePoint = base64String.codePointAt(i);
      table_base64_Uint8_to_index[ codePoint ] = i; 
    }

    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    table_base64_Uint8_to_index['-'.charCodeAt(0)] = 62;
    table_base64_Uint8_to_index['_'.charCodeAt(0)] = 63;
  }
}

/**
 * Generator for Base64 decoding from an array of Base64 encoded string.
 * Join the string array, convert to Uint8Array, decode as Base64, result in another Uint8Array.
 *
 * @param {string[]} sourceBase64EncodedStringArray
 *   Every element of the array is a string whose content is base64 encoded text.
 *
 * @param {TextEncoder} textEncoder
 *   This TextEncoder will convert string to Uint8Array so that the Base64 decoder can work.
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
 * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and reporting progress).
 *   Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
 *
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* decoder_FromStringArray(
  sourceBase64EncodedStringArray, textEncoder, skipLineCount, progressParent, suspendByteCount ) {

  let progressRoot = progressParent.getRoot();

  // The ( progressToAdvance / progressParent ) ratio (50%) seems a little too large. But it is
  // reasonable in fact because the string Array.join() and TextEncoder.encode() both will scan
  // all input text. This is just the same as the Base64 decoder (i.e. scanning all input text).

  // 50% for this function (i.e. Array.join() and TextEncoder.encode()).
  let progressToAdvance = progressParent.addChild(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

  // 50% for next sub function (i.e. Base64 decoder).
  let progressParentNew = progressParent.addChild(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let base64EncodedStringLong = sourceBase64EncodedStringArray.join( "" );
  progressToAdvance.value_advance(); // 25%
  yield progressRoot;

  let base64EncodedUint8Array = textEncoder.encode( base64EncodedStringLong );
  progressToAdvance.value_advance(); // 25%
  yield progressRoot;

  let base64Decoder = decoder_FromUint8Array(
    base64EncodedUint8Array, skipLineCount, progressParentNew, suspendByteCount );

  let base64DecodedUint8Array = yield *base64Decoder;
  return base64DecodedUint8Array;
}

/**
 * Generator for Base64 decoding from an ArrayBufffer.
 *
 * @param {ArrayBuffer} sourceBase64ArrayBuffer
 *   The input base64 data as ArrayBuffer. If the last bytes not enough 4 bytes, they will be discarded (will
 * not be decoded). If an input byte is not a legal base64 code (i.e. not A..Z, a..z, 0..9, +, /, -, _), the
 * byte will be skipped (as if it does not exist). So the input bytes can be separated by new line character
 * (which will be skipped and ignored).
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
 * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and reporting progress).
 *   Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
 *
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* decoder_FromArrayBuffer(
  sourceBase64ArrayBuffer, skipLineCount, progressParent, suspendByteCount ) {

  let sourceBase64Uint8Array = new Uint8Array( sourceBase64ArrayBuffer );
  let base64Decoder = decoder_FromUint8Array( sourceBase64Uint8Array, skipLineCount, progressParent, suspendByteCount );

  let base64DecodedUint8Array = yield *base64Decoder;
  return base64DecodedUint8Array;
}

/**
 * Generator for Base64 decoding from an Uint8Array.
 *
 * @param {Uint8Array} sourceBase64Uint8Array
 *   The input base64 data as Uint8Array. If the last bytes not enough 4 bytes, they will be discarded (will
 * not be decoded). If an input byte is not a legal base64 code (i.e. not A..Z, a..z, 0..9, +, /, -, _), the
 * byte will be skipped (as if it does not exist). So the input bytes can be separated by new line character
 * (which will be skipped and ignored).
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
 * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and reporting progress).
 *   Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate}
 *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
 *
 * @yield {Uint8Array}
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* decoder_FromUint8Array(
  sourceBase64Uint8Array, skipLineCount, progressParent, suspendByteCount ) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  // Note: Bitwising OR with zero is for converting to integer (if it is undefined or null).
  if ((suspendByteCount | 0) <= 0)
    suspendByteCount = 1024;

  let sourceByteLength = sourceBase64Uint8Array.length;
  let sourceBytes = sourceBase64Uint8Array;

  // Initialize progress.
  let progressRoot = progressParent.getRoot();
  let progressToAdvance = progressParent.addChild(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( sourceByteLength ) );

  // It is important that the nextYieldValue is not greater than source length, so that
  // it can be used as boundary checking to reduce checking times and increase performance.
  let nextYieldValue = Math.min(sourceByteLength, progressToAdvance.value + suspendByteCount);

  // 1. Skip specified lines.
  {
    let skippedLineCount = 0;

    while (progressToAdvance.value < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                 // Already skip enough lines.

      // (This inner loop combines both source and yield boundary checking. Reducing checking to increase performance.) 
      while (progressToAdvance.value < nextYieldValue) {
        if (skippedLineCount >= skipLineCount)
          break;                 // Already skip enough lines.

        let rawByte = sourceBytes[ progressToAdvance.value++ ];

        if (13 == rawByte) {     // "\r" (carriage return; CR)
          ++skippedLineCount;    // One line is skipped.

          // If a LF follows a CR, it is considered as CRLF sequence and viewed as the same one line.
          //
          // Note: It may exceed the nextYieldValue boundary. But should not exceed sourceByteLength.
          if (   (progressToAdvance.value < sourceByteLength)
              && (10 == sourceBytes[ progressToAdvance.value ])
             ) { 
            progressToAdvance.value_advance(); // Skip it.
          }

        } else {
          if (10 == rawByte)    // "\n" (new line; LF)
            ++skippedLineCount; // One line is skipped. 
        }
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.value >= nextYieldValue) {
        nextYieldValue = Math.min(sourceByteLength, progressToAdvance.value + suspendByteCount);
        yield progressRoot;
      }
    }
  }

  // 2. Decode.

  // Decoding base64 will result in a shorter data (about 75% (= 3 / 4) in size).
  let possibleBase64ByteLength = (sourceByteLength - progressToAdvance.value);  // Forget the skipped lines.
  let targetByteLength = Math.ceil(possibleBase64ByteLength * 0.75);
  let targetArrayBuffer = new ArrayBuffer( targetByteLength );
  let targetBytes = new Uint8Array( targetArrayBuffer );

  let resultByteCount = 0;  // Accumulate the real result byte count.

  {
    while (progressToAdvance.value < sourceByteLength) {

      nextYieldLoop:

      // (This inner loop combines both source and yield boundary checking. Reducing checking to increase performance.) 
      while (progressToAdvance.value < nextYieldValue) {

        // Extract 4 source bytes. (A decode unit consists of 4 base64 encoded source bytes.)
        //
        // Although it is verbose to loop unrolling manually, it is far more faster
        // to use 4 local variables than use a 4-element normal array. (Note: the
        // 4-element normal array is far more faster than a Uint8Array() again).

        let encoded_0;
        do {
          // Note: It may exceed the nextYieldValue boundary. But should not exceed sourceByteLength.
          if (progressToAdvance.value >= sourceByteLength)
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_0 = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.value++ ] ];
        } while (255 === encoded_0);


        let encoded_1;
        do {
          // Note: It may exceed the nextYieldValue boundary. But should not exceed sourceByteLength.
          if (progressToAdvance.value >= sourceByteLength)
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_1 = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.value++ ] ];
        } while (255 === encoded_1);


        let encoded_2;
        do {
          // Note: It may exceed the nextYieldValue boundary. But should not exceed sourceByteLength.
          if (progressToAdvance.value >= sourceByteLength)
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_2 = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.value++ ] ];
        } while (255 === encoded_2);


        let encoded_3;
        do {
          // Note: It may exceed the nextYieldValue boundary. But should not exceed sourceByteLength.
          if (progressToAdvance.value >= sourceByteLength)
            break nextYieldLoop; // Decoding is done. (Ignore last non-4-bytes.)

          encoded_3 = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.value++ ] ];
        } while (255 === encoded_3);


        targetBytes[resultByteCount++] =  (encoded_0       << 2) | (encoded_1 >> 4);
        targetBytes[resultByteCount++] = ((encoded_1 & 15) << 4) | (encoded_2 >> 2);
        targetBytes[resultByteCount++] = ((encoded_2 &  3) << 6) | (encoded_3 & 63);
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.value >= nextYieldValue) {
        nextYieldValue = Math.min(sourceByteLength, progressToAdvance.value + suspendByteCount);
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
