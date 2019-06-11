//import * as ValueMax from "./ValueMax.js";

export { Base64ArrayBuffer_To_Uint8Array_Generator };

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
 * @return {ValueMax.Percentage.Aggregate or Uint8Array}
 *   Return progressYield when ( done = false ). Return decoded data as Uint8Array when ( done = true ).
 */
function* decode_Generator(
  sourceBase64ArrayBuffer, skipLineCount, progressToYield, progressToAdvance, suspendByteCount = 1024) {

  let byteCountAfterYield = 0;

  function progress_AccumulateOne_yieldIfNeed() {
    progressToAdvance.accumulation++;
    byteCountAfterYield++;

    if (byteCountAfterYield >= suspendByteCount) { // Every suspendByteCount, release CPU time.
      yield progressToYield;
      byteCountAfterYield = 0;
    }
  }

  let sourceByteLength = sourceBase64ArrayBuffer.byteLength;

  // Initialize progress.
  progressToAdvance.accumulation = 0;
  progressToAdvance.total = sourceByteLength;

  // Decoding base64 will result a shorten data (75% in size). However, the source may not be pure base64 codes.
  // So it is safer to prepare same size bufer as source.
  let targetByteLength = sourceByteLength;
  let targetArrayBuffer = new ArrayBuffer( targetByteLength );

  let sourceBytes = new Uint8Array( sourceBase64ArrayBuffer );
  let targetBytes = new Uint8Array( targetArrayBuffer );

  let resultByteCount = 0; // Accumulate the real result byte count.
  let sourceIndex = 0;

  // Skip several lines.
  {
    let skippedLineCount = 0;
    let justMeetCR = false;     // True, if just meet a "\r" (carriage return) character. For handling CRLF.
    let rawByte;

    while (sourceIndex < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                  // Already skip enough lines.

      rawByte = sourceBytes[ sourceIndex++ ];

      progressToAdvance.accumulation++;
      byteCountAfterYield++;

      if (byteCountAfterYield >= suspendByteCount) { // Every suspendByteCount, release CPU time.
        yield progressToYield;
        byteCountAfterYield = 0;
      }

      if (13 == rawByte) {      // "\r" (carriage return)
        ++skippedLineCount;     // One line is skipped. 
        justMeetCR = true;
      } else {
        if (10 == rawByte) {    // "\n" (new line)
          if (justMeetCR)       // A new line after a carriage return.
            ;                   // The line has already been counted. Ignore it.
          else
            ++skippedLineCount; // One line is skipped. 
        }

        justMeetCR = false;
      }
    }
  }

  {
    const BYTES_PER_DECODE_UNIT = 4; // A decode unit consists of 4 base64 encoded source bytes.
    let encodedBytes = new Uint8Array( new ArrayBuffer( BYTES_PER_DECODE_UNIT ) );

    let encodedByte;   
    while (sourceIndex < sourceByteLength) {

      // Extract 4 source bytes.
      for (let j = 0; j < BYTES_PER_DECODE_UNIT; ++j) {
        if (sourceIndex >= sourceByteLength)
          break; // Decoding is done. (Ignore last non-4-bytes.)

        let encodedByte = table_base64_Uint8_to_index[ sourceBytes[ sourceIndex++ ] ];

        progressToAdvance.accumulation++;
        byteCountAfterYield++;

        if (byteCountAfterYield >= suspendByteCount) { // Every suspendByteCount, release CPU time.
          yield progressToYield;
          byteCountAfterYield = 0;
        }

        if (255 === encodedByte)
          continue; // Skip any non-base64 bytes.

        encodedBytes[ j ] = encodedByte;
      }

      if (sourceIndex >= sourceByteLength)
        break; // Decoding is done. (Ignore last non-4-bytes.)

      targetBytes[resultByteCount++] =  (encodedBytes[ 1 ]       << 2) | (encodedBytes[ 2 ] >> 4);
      targetBytes[resultByteCount++] = ((encodedBytes[ 2 ] & 15) << 4) | (encodedBytes[ 3 ] >> 2);
      targetBytes[resultByteCount++] = ((encodedBytes[ 3 ] &  3) << 6) | (encodedBytes[ 4 ] & 63);
    }
  }

  // The resultBytes is a sub-range of target buffer.
  let resultBytes = new Uint8Array( targetArrayBuffer, 0, resultByteCount ); 
  return resultBytes;
}
