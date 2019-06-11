import * as ValueMax from "./ValueMax.js";

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
function* Base64ArrayBuffer_To_Uint8Array_Generator(
  sourceBase64ArrayBuffer, skipLineCount, progressToYield, progressToAdvance, suspendByteCount) {

  suspendByteCount = ( suspendByteCount <= 0 ) ? 1024 : suspendByteCount;

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

  const BYTES_PER_DECODE_UNIT = 4; // A decode unit consists of 4 base64 encoded source bytes.
  let encodedArrayBuffer = new ArrayBuffer( BYTES_PER_DECODE_UNIT );
  let encodedBytes = new Uint8Array( encodedArrayBuffer );

  let resultBytes = 0; // Accumulate the real result byte count.
  let sourceIndex = 0;

  // Skip several lines.
  {
    let skippedLineCount = 0;
    let justMeetCR = false; // If just meet a "\r" (carriage return) character, set to true.

    while (sourceIndex < sourceByteLength) {
      if (skippedLineCount >= skipLineCount)
        break;                  // Already skip enough lines.

      let b = sourceBytes[ sourceIndex++ ];
      progress_AccumulateOne_yieldIfNeed(); // Every suspendByteCount, release CPU time.

      if (13 == b) {            // "\r" (carriage return)
        ++skippedLineCount;     // One line is skipped. 
        justMeetCR = true;
      } else {
        if (10 == b) {          // "\n" (new line)
          if (justMeetCR)       // A new line after a carriage return.
            ;                   // The line has already been counted. Ignore it.
          else
            ++skippedLineCount; // One line is skipped. 
        }

        justMeetCR = false;
      }
    }
  }

  while (sourceIndex < sourceByteLength) {
    for (let j = 0; j < BYTES_PER_DECODE_UNIT; ++j) {  // Extract 4 source bytes.
      if (sourceIndex >= sourceByteLength)
        break; // Decoding is done. (Ignore last non-4-bytes.)

      let b = table_base64_Uint8_to_index[ sourceBytes[ sourceIndex++ ] ];
      progress_AccumulateOne_yieldIfNeed(); // Every suspendByteCount, release CPU time.

      if (255 === b)
        continue; // Skip any non-base64 bytes.

      encodedBytes[ j ] = b;
    }

    if (sourceIndex >= sourceByteLength)
      break; // Decoding is done. (Ignore last non-4-bytes.)

    
!!! ...unfinished...


    targetBytes[ i ] = table_base64_Uint8_to_index[ sourceBytes[ i ] ];
  }


        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;
  
      if (base64[base64.length - 1] === "=") {
        bufferLength--;
        if (base64[base64.length - 2] === "=") {
          bufferLength--;
        }
      }
  
      var arraybuffer = new ArrayBuffer(bufferLength),
      bytes = new Uint8Array(arraybuffer);
  
      for (i = 0; i < len; i+=4) {
        encoded1 = THREE.Base64.base64ToIndexNew(base64[i]);
        encoded2 = THREE.Base64.base64ToIndexNew(base64[i+1]);
        encoded3 = THREE.Base64.base64ToIndexNew(base64[i+2]);
        encoded4 = THREE.Base64.base64ToIndexNew(base64[i+3]);
  
        bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }
  
      return arraybuffer;
    };


!!! ...unfinished... adjust resultBytes byteOffset , length]
  let resultBytes = new Uint8Array( targetArrayBuffer, 0, resultBytes ); 

  return result;
}
