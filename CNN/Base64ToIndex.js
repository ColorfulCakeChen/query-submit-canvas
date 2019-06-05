const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToIndex_withTable(base64ArrayBuffer, table_ByUint8) {
  let resultArrayBuffer = new ArrayBuffer( base64ArrayBuffer.byteLength );
  let source = new Uint8Array( base64ArrayBuffer );
  let result = new Uint8Array( resultArrayBuffer );
  for (let i = 0; i < source.length; ++i)
    result[ i ] = table_ByUint8[ source[ i ] ];
  return resultArrayBuffer;
}

function byArray() {
  //let table = new Array(256);
  let table = [];
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

function byHash() {
  let table = {};
  for (let i = 0; i < base64String.length; ++i)
    table[ base64String.codePointAt(i) ] = i;

  return function (base64_ArrayBuffer) {
    return base64ToIndex_withTable(base64_ArrayBuffer, table);
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
var base64ToIndex_ByArrayBuffer = byArrayBuffer();
var base64ToIndex_ByHash = byHash();
