export { decoder };

const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Mapping table for base64 (as Uint8) to index. */
let table_base64_Uint8_to_index = new Uint8Array( new ArrayBuffer(256) );
{
  for (let i = 0; i < table_base64_Uint8_to_index.length; ++i)
    table_base64_Uint8_to_index[ i ] = 255; // For identifying any non-base64 bytes.

  for (let i = 0; i < base64String.length; ++i)
    table_base64_Uint8_to_index[ base64String.codePointAt(i) ] = i;

  // Support decoding URL-safe base64 strings, as Node.js does.
  // See: https://en.wikipedia.org/wiki/Base64#URL_applications
  table_base64_Uint8_to_index['-'.charCodeAt(0)] = 62
  table_base64_Uint8_to_index['_'.charCodeAt(0)] = 63
}

/**
 *
 * @param  {ArrayBuffer} sourceBase64ArrayBuffer
 *   The input base64 data as ArrayBuffer. If the last bytes not enough 4 bytes, they will be discarded (will
 * not be decoded). If an input byte is not a legal base64 code (i.e. not A..Z, a..z, 0..0, +, /), the byte
 * will be skipped (as if it does not exist). So the input bytes can be separated by new line.
 *
 * @param  {Uint32} skipLineCount
 *   Skip how many lines in the source before decoding.
 *
 * @param  {ValueMax.Percentage.Aggregate} progressToYield
 *   Return this when every time yield.
 *
 * @param  {ValueMax.Percentage.Concrete}  progressToAdvance
 *   Increase this when every time advanced.
 *
 * @param  {Uint32} suspendByteCount
 *   Everytime so many bytes decoded, yield for releasing CPU time. Default is 1024 bytes.
 *
 * @yield {ValueMax.Percentage.Aggregate or Uint8Array}
 *   Yield ( value = progressYield ) when ( done = false ).
 *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
 */
function* decoder(
  sourceBase64ArrayBuffer, skipLineCount, progressToYield, progressToAdvance, suspendByteCount = 1024) {

  let byteCountAfterYield = 0;
  let hasEverYielded = false;  // True, if yielded at least once.

  function progress_accumulateOne_isNeedYield() {
    progressToAdvance.accumulation++;
    byteCountAfterYield++;

    if (byteCountAfterYield >= suspendByteCount) { // Every suspendByteCount, release CPU time.
      byteCountAfterYield = 0;
      hasEverYielded = true;
      return true;
    }
    return false;
  }

  let sourceByteLength = sourceBase64ArrayBuffer.byteLength;

  // Initialize progress.
  progressToAdvance.accumulation = 0;
  progressToAdvance.total = sourceByteLength;

  let sourceBytes = new Uint8Array( sourceBase64ArrayBuffer );
  let sourceIndex = 0;

  // Skip specified lines.
  {
    let skippedLineCount = 0;
    let rawByte;

    while (sourceIndex < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                  // Already skip enough lines.

      rawByte = sourceBytes[ sourceIndex++ ];

      if (progress_accumulateOne_isNeedYield()) // Every suspendByteCount, release CPU time.
        yield progressToYield;

      if (13 == rawByte) {      // "\r" (carriage return; CR)
        ++skippedLineCount;     // One line is skipped.

        // If a LF follows a CR, it is considered as CRLF sequence and viewed as the same one line.
        if ((sourceIndex < sourceByteLength) && (10 == sourceBytes[ sourceIndex ])) { 
          ++sourceIndex;       // Skip it.
          if (progress_accumulateOne_isNeedYield()) // Every suspendByteCount, release CPU time.
            yield progressToYield;
        }

      } else {
        if (10 == rawByte)      // "\n" (new line; LF)
          ++skippedLineCount; // One line is skipped. 
      }
    }
  }

  // Decoding base64 will result in a shorter data (about 75% (= 3 / 4) in size).
  let possibleBase64ByteLength = (sourceByteLength - sourceIndex);  // The skipped lines will not be decoded.
  let targetByteLength = Math.ceil(possibleBase64ByteLength * 0.75);
  let targetArrayBuffer = new ArrayBuffer( targetByteLength );
  let targetBytes = new Uint8Array( targetArrayBuffer );

  let resultByteCount = 0;  // Accumulate the real result byte count.

  {
    const BYTES_PER_DECODE_UNIT = 4; // A decode unit consists of 4 base64 encoded source bytes.
    let encodedBytes = new Uint8Array( new ArrayBuffer( BYTES_PER_DECODE_UNIT ) );
//    let encodedBytes = new Array( BYTES_PER_DECODE_UNIT );

    let j, encodedByte;   
    while (sourceIndex < sourceByteLength) {

      // Extract 4 source bytes.
      j = 0;
      while (j < BYTES_PER_DECODE_UNIT) {
        if (sourceIndex >= sourceByteLength)
          break; // Decoding is done. (Ignore last non-4-bytes.)

        let encodedByte = table_base64_Uint8_to_index[ sourceBytes[ sourceIndex++ ] ];
// !!! ... Temp Remarked for performance test ... (2019/06/13)
//         if (progress_accumulateOne_isNeedYield()) // Every suspendByteCount, release CPU time.
//           yield progressToYield;

        if (255 === encodedByte)
          continue; // Skip any non-base64 bytes.

        encodedBytes[ j++ ] = encodedByte;
      }

      if (j != BYTES_PER_DECODE_UNIT)
        break; // Decoding is done. (Ignore last non-4-bytes.)

      targetBytes[resultByteCount++] =  (encodedBytes[ 0 ]       << 2) | (encodedBytes[ 1 ] >> 4);
      targetBytes[resultByteCount++] = ((encodedBytes[ 1 ] & 15) << 4) | (encodedBytes[ 2 ] >> 2);
      targetBytes[resultByteCount++] = ((encodedBytes[ 2 ] &  3) << 6) | (encodedBytes[ 3 ] & 63);
    }
  }

  // The resultBytes is a sub-range of target buffer.
  //
  // Because the source may have some non-base64 codes which will be ignored,
  // the result data may be less than target length.
  let resultBytes = new Uint8Array( targetArrayBuffer, 0, resultByteCount );

  if ((byteCountAfterYield > 0) || (false == hasEverYielded))
    yield progressToYield; // Report the progress has been 100%
  else
    ; // The last progress report is (just luckily) 100%. No need to report the progress again.

  return resultBytes;
}
