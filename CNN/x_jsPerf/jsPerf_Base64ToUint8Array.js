import * as Base64ArrayBufferToUint8Array from "../Unpacker/Base64ArrayBufferToUint8Array.js";
import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/**
 * @see {@link https://jsperf.com/colorfulcakechen-base64-to-uint8array}
 */


//!!! ...unfinished... (2022/09/21)
// Use ValueMax.Percentage.Xxx.Pool.get_or_create_by() instead of new
// ValueMax.Percentage.Xxx

/** Aggregate all progress.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      // Increased when parsing the downloaded data to Uint8Array.
      new ValueMax.Percentage.Concrete(),
    ];

    super(children);

    [this.uint8Array] = children;
  }
}

function byArrayBuffer() {
  let progress = new Progress();

  return function (base64_ArrayBuffer) {
    // Large enough to avoid from yield.
    let suspendByteCount = base64_ArrayBuffer.byteLength + 1;
    let decoder = Base64ArrayBufferToUint8Array.decoder(
      base64_ArrayBuffer, 0, progress, progress.uint8Array, suspendByteCount );
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
    let c = RandTools.getIntInclusive(PRINTABLE_ASCII_MIN, PRINTABLE_ASCII_MAX);
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

