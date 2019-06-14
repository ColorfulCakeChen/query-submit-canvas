export { decoder };

const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

//!!! (2019/06/14) Remarked for performance testing.
// Mapping table for base64 (as Uint8) to index.
let table_base64_Uint8_to_index = new Uint8Array( new ArrayBuffer(256) );
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

//!!! (2019/06/14) Remarked for performance testing.
// const BITS_ONES_0_5 = Number.parseInt("00111111", 2);  // 00111111 = 0x3F
// const BITS_ONES_6_7 = Number.parseInt("11000000", 2);  // 11000000 = 0xC0
// const BITS_ONES_6_6 = Number.parseInt("01000000", 2);  // 01000000 = 0x40
//
// // Mapping table for base64 (as Uint8) to index.
// //
// // The value of decoded base64 is between [0, 63]. It uses only lowest 6 bits.
// // The highest 2 bits can be used to store the byte count to advance.
// // It is 0 for illegal base64 codes, and 1 for legal base64 codes.
// //
// let table_base64_Uint8_to_index = new Uint8Array( new ArrayBuffer(256) );
// {
//   // For all non-base64 codes, the 6th bit always 0.
//   for (let i = 0; i < table_base64_Uint8_to_index.length; ++i)
//     table_base64_Uint8_to_index[ i ] = 0;
//
//   // For all legal base64 codes, the 6th bit always 1.
//   {
//     for (let i = 0; i < base64String.length; ++i) {
//       let codePoint = base64String.codePointAt(i);
//       table_base64_Uint8_to_index[ codePoint ] = i | BITS_ONES_6_6; 
//     }
//
//     // Support decoding URL-safe base64 strings, as Node.js does.
//     // See: https://en.wikipedia.org/wiki/Base64#URL_applications
//     table_base64_Uint8_to_index['-'.charCodeAt(0)] = 62 | BITS_ONES_6_6;
//     table_base64_Uint8_to_index['_'.charCodeAt(0)] = 63 | BITS_ONES_6_6;
//   }
// }

//!!! (2019/06/14) Remarked for performance testing.
// // Mapping table for base64 (as Uint8) to index.
// let table_arrayBuffer512 = new ArrayBuffer(512);
// let table_base64_Uint8_to_index = new Uint8Array( table_arrayBuffer512,   0, 256 );
// let table_base64_Uint8_to_advanceByteCount = new Uint8Array( table_arrayBuffer512, 255, 256 );
// {
//   // For all non-base64 codes, the advanceByteCount is 0.
//   for (let i = 0; i < table_base64_Uint8_to_index.length; ++i) {
//     table_base64_Uint8_to_index[ i ] = 255;
//     table_base64_Uint8_to_advanceByteCount[ i ] = 0;
//   }
//
//   // All legal base64 codes.
//   {
//     for (let i = 0; i < base64String.length; ++i)
//       table_base64_Uint8_to_index[ base64String.codePointAt(i) ] = i; 
//
//     // Support decoding URL-safe base64 strings, as Node.js does.
//     // See: https://en.wikipedia.org/wiki/Base64#URL_applications
//     table_base64_Uint8_to_index['-'.charCodeAt(0)] = 62;
//     table_base64_Uint8_to_index['_'.charCodeAt(0)] = 63;
//
//     // For all legal base64 codes, the advanceByteCount is 1.
//     for (let i = 0; i < table_base64_Uint8_to_index.length; ++i) {
//       if (255 != table_base64_Uint8_to_index[ i ])
//         table_base64_Uint8_to_advanceByteCount[ i ] = 1;
//     }
//   }
// }

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
  if ((suspendByteCount | 0) <= 0)
    suspendByteCount = 1024;

  let sourceByteLength = sourceBase64ArrayBuffer.byteLength;
  let sourceBytes = new Uint8Array( sourceBase64ArrayBuffer );

  // Initialize progress.
  progressToAdvance.accumulation = 0;
  progressToAdvance.total = sourceByteLength;

  let nextYieldAccumulation = suspendByteCount;

  // 1. Skip specified lines.
  {
    let skippedLineCount = 0;

    while (progressToAdvance.accumulation < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                 // Already skip enough lines.

      let rawByte = sourceBytes[ progressToAdvance.accumulation++ ];

      if (13 == rawByte) {     // "\r" (carriage return; CR)
        ++skippedLineCount;    // One line is skipped.

        // If a LF follows a CR, it is considered as CRLF sequence and viewed as the same one line.
        if (   (progressToAdvance.accumulation < sourceByteLength)
            && (10 == sourceBytes[ progressToAdvance.accumulation ])
           ) { 
          ++progressToAdvance.accumulation; // Skip it.
        }

      } else {
        if (10 == rawByte)    // "\n" (new line; LF)
          ++skippedLineCount; // One line is skipped. 
      }

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = progressToAdvance.accumulation + suspendByteCount;
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
//    let encodedBytes = new Uint8Array( BYTES_PER_DECODE_UNIT );
    let encodedBytes = new Array( BYTES_PER_DECODE_UNIT );
//    let oneByte;

    while (progressToAdvance.accumulation < sourceByteLength) {

      // Extract 4 source bytes.
      let j = 0;
      while (j < BYTES_PER_DECODE_UNIT) {
        if (progressToAdvance.accumulation >= sourceByteLength)
          break; // Decoding is done. (Ignore last non-4-bytes.)
// !!! (2019/06/14) Remarked for use 6th bit the advance byte count.
        encodedBytes[ j ] = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.accumulation++ ] ];

        if (255 === encodedBytes[ j ])
          continue; // Skip any non-base64 bytes.

        ++j;

// !!! (2019/06/14) Remarked for use 6th bit the advance byte count.
//         oneByte = table_base64_Uint8_to_index[ sourceBytes[ progressToAdvance.accumulation++ ] ];
//
//         encodedBytes[ j ] = oneByte & 0x3F; // Remove the highest two bits. (0x3F = BITS_ONES_0_5)
//
//         // The highest two bits is:
//         //   1 for legal base64 code. So the byte count is increased.
//         //   0 for non-base64 code. So the code is skipped (i.e. the byte count is kept).
//         //
//         // This trick control the byte count (i.e. variable j) without using if-condition.
//         // Hope for increasing parsing performance.
//         j += ( oneByte & 0xC0 ) >>> 6; // (0xC0 = BITS_ONES_6_7)

// !!! (2019/06/14) Remarked for use 6th bit the advance byte count.
//         let base64Byte = sourceBytes[ progressToAdvance.accumulation++ ];
//
//         encodedBytes[ j ] = table_base64_Uint8_to_index[ base64Byte ];  // Base64 to index.
//
//         // Base64 to advanceByteCount.
//         //
//         // This trick control the byte count (i.e. variable j) without using if-condition.
//         // Hope for increasing parsing performance.
//         j += table_base64_Uint8_to_advanceByteCount[ base64Byte ];
      }

      if (j != BYTES_PER_DECODE_UNIT)
        break; // Decoding is done. (Ignore last non-4-bytes.)

      targetBytes[resultByteCount++] =  (encodedBytes[ 0 ]       << 2) | (encodedBytes[ 1 ] >> 4);
      targetBytes[resultByteCount++] = ((encodedBytes[ 1 ] & 15) << 4) | (encodedBytes[ 2 ] >> 2);
      targetBytes[resultByteCount++] = ((encodedBytes[ 2 ] &  3) << 6) | (encodedBytes[ 3 ] & 63);

      // Every suspendByteCount, release CPU time (and report progress).
      if (progressToAdvance.accumulation >= nextYieldAccumulation) {
        nextYieldAccumulation = progressToAdvance.accumulation + suspendByteCount;
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

  if (   // Never yield (i.e. never report progress), report at least once for done.
         (nextYieldAccumulation == suspendByteCount)

         // Or, some advance has been made after last progress report, report for done.
      || ((nextYieldAccumulation - progressToAdvance.accumulation) < suspendByteCount)
     )
    yield progressToYield; // Report the progress has been done (100%).
  else
    ; // The last progress report is (just luckily) 100%. No need to report the progress again.

  return resultBytes;
}
