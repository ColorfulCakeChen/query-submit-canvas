import * as ValueMax from "./ValueMax.js";

export { Base64ArrayBuffer_To_ArrayBuffer_Generator };

const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Mapping table for base64 (as Uint8) to index. */
let table_base64_Uint8_to_index = new Uint8Array( new ArrayBuffer(256) );
for (let i = 0; i < base64String.length; ++i)
  table_base64_Uint8_to_index[ base64String.codePointAt(i) ] = i;

/**
 * @param  {ArrayBuffer}                   base64ArrayBuffer The input base64 data as ArrayBuffer.
 * @param  {ValueMax.Percentage.Aggregate} progressToYield   Return this when every time yield.
 * @param  {ValueMax.Percentage.Concrete}  progressToAdvance Increase this when every time advanced.
 * @param  {Uint32}                        suspendByteCount  Everytime so many bytes decoded, yield for releasing CPU time.
 * @return {ArrayBuffer} Return decoded data when done.
 */
function* Base64ArrayBuffer_To_ArrayBuffer_Generator(
            base64ArrayBuffer,
            progressYield,
            progressAdvance,
            suspendByteCount) {

  suspendByteCount = ( suspendByteCount <= 0 ) ? 1024 : suspendByteCount;

  let sourceByteLength = base64ArrayBuffer.byteLength;

  if (progressToAdvance) {
    progressToAdvance.accumulation = 0;
    progressToAdvance.total = sourceByteLength;
  }

  let resultByteLength = sourceByteLength * 0.75;
  let resultArrayBuffer = new ArrayBuffer( resultByteLength );

  let sourceBytes = new Uint8Array( base64ArrayBuffer );
  let resultBytes = new Uint8Array( resultArrayBuffer );
  for (let i = 0; i < sourceByteLength; ++i) {
  
!!! ...unfinished...

    resultBytes[ i ] = table_base64_Uint8_to_index[ sourceBytes[ i ] ];
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



  return result;
}
