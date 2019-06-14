export { decoder };

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
 *
 * @param {ArrayBuffer} sourceBase64ArrayBuffer
 *   The input base64 data as ArrayBuffer. If the last bytes not enough 4 bytes, they will be discarded (will
 * not be decoded). If an input byte is not a legal base64 code (i.e. not A..Z, a..z, 0..0, +, /), the byte
 * will be skipped (as if it does not exist). So the input bytes can be separated by new line.
 *
 * @param {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param {ValueMax.Percentage.Aggregate} progressToYield
 *   Return this when every time yield.
 *
 * @param {ValueMax.Percentage.Concrete}  progressToAdvance
 *   Increase this when every time advanced.
 *
 * @param {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time (and reporting progress).
 *   Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate or Uint8Array}
 *   Yield ( value = progressYield ) when ( done = false ).
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* decoder(
  sourceBase64ArrayBuffer, skipLineCount, progressToYield, progressToAdvance, suspendByteCount) {

  // 0. Initialize.

  // If undefined or null or negative or zero or less than 1, set to default.
  // Note: Bitwising OR with zero is for converting to integer (if it is undefined or null).
  if ((suspendByteCount | 0) <= 0)
    suspendByteCount = 1024;

  let sourceByteLength = sourceBase64ArrayBuffer.byteLength;
  let sourceBytes = new Uint8Array( sourceBase64ArrayBuffer );

  // Initialize progress.
  progressToAdvance.accumulation = 0;
  progressToAdvance.total = sourceByteLength;

  // It is important that the nextYieldAccumulation is not greater than source length, so that
  // it can be used as boundary checking to reduce checking times and increase performance.
  let nextYieldAccumulation = Math.min(sourceByteLength, progressToAdvance.accumulation + suspendByteCount);

  // 1. Skip specified lines.
  {
    let skippedLineCount = 0;

    while (progressToAdvance.accumulation < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                 // Already skip enough lines.

      // (This inner loop combines both source and yield boundary checking. Reducing checking to increase performance.) 
      while (progressToAdvance.accumulation < nextYieldAccumulation) {
        if (skippedLineCount >= skipLineCount)
          break;                 // Already skip enough lines.

        let rawByte = sourceBytes[ progressToAdvance.accumulation++ ];

        if (13 == rawByte) {     // "\r" (carriage return; CR)
          ++skippedLineCount;    // One line is skipped.

          // If a LF follows a CR, it is considered as CRLF sequence and viewed as the same one line.
          //
          // Note: It may exceed the nextYieldAccumulation boundary. But should not exceed sourceByteLength.
          if (   (progressToAdvance.accumulation < sourceByteLength)
              && (10 == sourceBytes[ progressToAdvance.accumulation ])
             ) { 
            ++progressToAdvance.accumulation; // Skip it.
          }

        } else {
          if (10 == rawByte)    // "\n" (new line; LF)
            ++skippedLineCount; // One line is skipped. 
        }
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = Math.min(sourceByteLength, progressToAdvance.accumulation + suspendByteCount);
        yield progressToYield;
      }
    }
  }

  // 2. Decode.

  // Decoding base64 will result in a shorter data (about 75% (= 3 / 4) in size).
  let possibleBase64ByteLength = (sourceByteLength - progressToAdvance.accumulation);  // Forget the skipped lines.
  let targetByteLength = Math.ceil(possibleBase64ByteLength * 0.75);
  let targetArrayBuffer = new ArrayBuffer( targetByteLength );
  let targetBytes = new Uint8Array( targetArrayBuffer );

  let resultByteCount = 0;  // Accumulate the real result byte count.

  {
    const BYTES_PER_DECODE_UNIT = 4; // A decode unit consists of 4 base64 encoded source bytes.
    let encodedBytes = new Array( BYTES_PER_DECODE_UNIT ); // Faster than using Uint8Array().

    while (progressToAdvance.accumulation < sourceByteLength) {

      // (This inner loop combines both source and yield boundary checking. Reducing checking to increase performance.) 
      while (progressToAdvance.accumulation < nextYieldAccumulation) {

        // Extract 4 source bytes.
        let j = 0;
        while (j < BYTES_PER_DECODE_UNIT) {

          // Note: It may exceed the nextYieldAccumulation boundary. But should not exceed sourceByteLength.
          if (progressToAdvance.accumulation >= sourceByteLength)
            break; // Decoding is done. (Ignore last non-4-bytes.)

          encodedBytes[ j ] = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.accumulation++ ] ];

          if (255 === encodedBytes[ j ])
            continue; // Skip any non-base64 bytes.

          ++j;
        }

        if (j != BYTES_PER_DECODE_UNIT)
          break; // Decoding is done. (Ignore last non-4-bytes.)

        targetBytes[resultByteCount++] =  (encodedBytes[ 0 ]       << 2) | (encodedBytes[ 1 ] >> 4);
        targetBytes[resultByteCount++] = ((encodedBytes[ 1 ] & 15) << 4) | (encodedBytes[ 2 ] >> 2);
        targetBytes[resultByteCount++] = ((encodedBytes[ 2 ] &  3) << 6) | (encodedBytes[ 3 ] & 63);
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = Math.min(sourceByteLength, progressToAdvance.accumulation + suspendByteCount);
        yield progressToYield;
      }

    }
  }

  // 3. Result.

  // The resultBytes is a sub-range of target buffer.
  //
  // Because the source may have some non-base64 codes which will be ignored,
  // the result data may be less than target length.
  let resultBytes = new Uint8Array( targetArrayBuffer, 0, resultByteCount );

  yield progressToYield; // Report the progress has been done (100%).

  return resultBytes;
}
