import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
import * as Random from "../Random.js";
import * as ValueMax from "../ValueMax.js";

// const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// // https://jsperf.com/base64-to-index

// function base64ToIndex_withTable(base64ArrayBuffer, tableByUint8) {
// //   let resultArrayBuffer = new ArrayBuffer( base64ArrayBuffer.byteLength );
// //   let source = new Uint8Array( base64ArrayBuffer );
// //   let result = new Uint8Array( resultArrayBuffer );
// //   for (let i = 0; i < source.length; ++i)
// //     result[ i ] = tableByUint8[ source[ i ] ];
// //   return resultArrayBuffer;

// !!! ...unfinished... (2019/06/05) Use the following to decode.
// https://github.com/emn178/hi-base64/blob/master/src/base64.js
// https://github.com/beatgammit/base64-js/blob/master/index.js
  
//   let source = new Uint8Array( base64ArrayBuffer );
//   let sourceBytelength = source.length;
//   let bufferLength = sourceBytelength * 0.75,
//       p = 0,
//       encoded1, encoded2, encoded3, encoded4;

//   if ( (sourceBytelength >= 1) && (source[sourceBytelength - 1] === "=") ) {
//     bufferLength--;
//     if ( (sourceBytelength >= 1) && (source[sourceBytelength - 2] === "=") ) {
//       bufferLength--;
//     }
//   }

//   let resultArrayBuffer = new ArrayBuffer(bufferLength);
//   let bytes = new Uint8Array(resultArrayBuffer);

//   for (let i = 0; i < sourceBytelength; i+=4) {
//     encoded1 = tableByUint8[ source[i]   ];
//     encoded2 = tableByUint8[ source[i+1] ];
//     encoded3 = tableByUint8[ source[i+2] ];
//     encoded4 = tableByUint8[ source[i+3] ];

//     bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
//     bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
//     bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
//   }

//   return resultArrayBuffer;
// }

// function byArray() {
//   let table = [];
//   for (let i = 0; i < base64String.length; ++i)
//     table[ base64String.codePointAt(i) ] = i;

//   return function (base64_ArrayBuffer) {
//     return base64ToIndex_withTable(base64_ArrayBuffer, table);
//   };
// }

// function byHash() {
//   let table = {};
//   for (let i = 0; i < base64String.length; ++i)
//     table[ base64String.codePointAt(i) ] = i;

//   return function (base64_ArrayBuffer) {
//     return base64ToIndex_withTable(base64_ArrayBuffer, table);
//   };
// }

// function byArrayBuffer() {
//   let table = new Uint8Array( new ArrayBuffer(256) );
//   for (let i = 0; i < base64String.length; ++i)
//     table[ base64String.codePointAt(i) ] = i;

//   return function (base64_ArrayBuffer) {
//     return base64ToIndex_withTable(base64_ArrayBuffer, table);
//   };
// }

/** Aggregate all progress.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when parsing the downloaded data to Uint8Array.
    ];

    super(children);

    [this.uint8Array] = children;
  }
}

function byArrayBuffer() {
  return function (base64_ArrayBuffer) {
    let progress = new Progress();
    let suspendByteCount = base64_ArrayBuffer.byteLength;
    let decoder = Base64ArrayBufferToUint8Array.decoder(base64_ArrayBuffer, 0, progress, progress.uint8Array, suspendByteCount);
    for (let p of decoder) {
    }
  }
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

// Use all printable ASCII codes form a string of 3-divisible length.
// (So its base64-encoded codes will divisible by 4.)
let originalArray = [];
{
  const ORIGINAL_TEST_STRING_LENGTH = 3 * 22;

  const PRINTABLE_ASCII_MIN = 32;
  const PRINTABLE_ASCII_MAX = 126;

  for (let i = 0; i < ORIGINAL_TEST_STRING_LENGTH; ++i) {
    let c = Random.getIntInclusive(PRINTABLE_ASCII_MIN, PRINTABLE_ASCII_MAX);
    originalArray.push( String.fromCodePoint( c ) );
  }
}

const originalString = originalArray.join("");
const base64EncodedString = btoa(originalString);

const str = base64EncodedString.repeat(1024 * 8);
  
let array = [...str];
let arrayBuffer = new ArrayBuffer(array.length);
let uint8array = new Uint8Array(arrayBuffer);
array.forEach(function(e, i) { uint8array[i] = e.codePointAt(0) });

globalThis.dataArrayBuffer = arrayBuffer;

// var base64ToIndex_ByArray = byArray();
// var base64ToIndex_ByHash = byHash();
globalThis.base64ToIndex_ByArrayBuffer = byArrayBuffer();
globalThis.base64ToIndex_By_atob = by_atob();

