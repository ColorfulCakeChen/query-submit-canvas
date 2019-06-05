const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// https://jsperf.com/base64-to-index

function base64ToIndex_withTable(base64ArrayBuffer, tableByUint8) {
//   let resultArrayBuffer = new ArrayBuffer( base64ArrayBuffer.byteLength );
//   let source = new Uint8Array( base64ArrayBuffer );
//   let result = new Uint8Array( resultArrayBuffer );
//   for (let i = 0; i < source.length; ++i)
//     result[ i ] = tableByUint8[ source[ i ] ];
//   return resultArrayBuffer;

!!! ...unfinished... (2019/06/05) Use https://github.com/beatgammit/base64-js/blob/master/index.js to decode.
  
  let source = new Uint8Array( base64ArrayBuffer );
  let sourceBytelength = source.length;
  let bufferLength = sourceBytelength * 0.75,
      p = 0,
      encoded1, encoded2, encoded3, encoded4;

  if ( (sourceBytelength >= 1) && (source[sourceBytelength - 1] === "=") ) {
    bufferLength--;
    if ( (sourceBytelength >= 1) && (source[sourceBytelength - 2] === "=") ) {
      bufferLength--;
    }
  }

  let resultArrayBuffer = new ArrayBuffer(bufferLength);
  let bytes = new Uint8Array(resultArrayBuffer);

  for (let i = 0; i < sourceBytelength; i+=4) {
    encoded1 = tableByUint8[ source[i]   ];
    encoded2 = tableByUint8[ source[i+1] ];
    encoded3 = tableByUint8[ source[i+2] ];
    encoded4 = tableByUint8[ source[i+3] ];

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return resultArrayBuffer;
}

function byArray() {
  let table = [];
  for (let i = 0; i < base64String.length; ++i)
    table[ base64String.codePointAt(i) ] = i;

  return function (base64_ArrayBuffer) {
    return base64ToIndex_withTable(base64_ArrayBuffer, table);
  };
}

function byHash() {
  let table = {};
  for (let i = 0; i < base64String.length; ++i)
    table[ base64String.codePointAt(i) ] = i;

  return function (base64_ArrayBuffer) {
    return base64ToIndex_withTable(base64_ArrayBuffer, table);
  };
}

function byArrayBuffer() {
  let table = new Uint8Array( new ArrayBuffer(256) );
  for (let i = 0; i < base64String.length; ++i)
    table[ base64String.codePointAt(i) ] = i;

  return function (base64_ArrayBuffer) {
    return base64ToIndex_withTable(base64_ArrayBuffer, table);
  };
}

function by_atob() {
  let textDecoder = new TextDecoder();
  let textEncoder = new TextEncoder();

  return function (base64_ArrayBuffer) {
    let strBase64 = textDecoder.decode(base64_ArrayBuffer);
    let strBase64Decoded = globalThis.atob(strBase64);
    let resultUint8Array = textEncoder.encode(strBase64Decoded);
    let resultArrayBuffer = resultUint8Array.buffer;
    return resultArrayBuffer;
  };
}

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive 
}

var dataArrayBuffer = new ArrayBuffer(4096);
let dataUint8Array = new Uint8Array( dataArrayBuffer );
for (let i = 0; i < dataUint8Array.length; ++i) {
  dataUint8Array[ i ] = base64String.codePointAt( getRandomIntInclusive(0, 63) );
}

var base64ToIndex_ByArray = byArray();
var base64ToIndex_ByHash = byHash();
var base64ToIndex_ByArrayBuffer = byArrayBuffer();
var base64ToIndex_By_atob = by_atob();

