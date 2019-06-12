import * as ScriptLoader from "../ScriptLoader.js";
import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

// This string will not fit to ASCII when base64 decoded. So can not be used to test. 
//const base64EncodedString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Use all printable ASCII codes form a string of 3-divisible length.
// (So its base64-encoded codes will divisible by 4.)
let originalArray = [];
{
  const ORIGINAL_TEST_STRING_LENGTH = 3 * 4;

  const PRINTABLE_ASCII_MIN = 32;
  const PRINTABLE_ASCII_MAX = 126;

  for (let i = 0; i < ORIGINAL_TEST_STRING_LENGTH; ++i) {
    let c = PRINTABLE_ASCII_MIN + getRandomInt(PRINTABLE_ASCII_MAX - PRINTABLE_ASCII_MIN + 1);
    originalArray.push( String.fromCodePoint( c ) );
  }
}

const originalString = originalArray.join("");
const base64EncodedString = btoa(originalString);
const base64DecodedString = atob(base64EncodedString);

const base64EncodedStrings_extra = [
  // Test empty base64 content.
  "",
  "\n",
  "\r",
  "\r\n",
  "\n\r",

  base64EncodedString,

  // Test extra has 0 to 3 bytes. (They should be ignored.)
  base64EncodedString + base64EncodedString.slice(0, 1),
  base64EncodedString + base64EncodedString.slice(0, 2),
  base64EncodedString + base64EncodedString.slice(0, 3),

  // Test extra non-base64 codes inside. (They should be ignored.)
  base64EncodedString.slice(0, 3) + "\n"   + base64EncodedString.slice(3),
  base64EncodedString.slice(0, 3) + "\r"   + base64EncodedString.slice(3),
  base64EncodedString.slice(0, 3) + "\r\n" + base64EncodedString.slice(3),
  base64EncodedString.slice(0, 3) + "\n\r" + base64EncodedString.slice(3),

  // Test skip 3 lines. Test multiple non-base64 codes. (They should be ignored.)
  "qwerty5ASDFG7\n\n\r"
    + base64EncodedString.slice(0, 2) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(2, 7) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(7, 9) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(9)    + "\n\n\r\r\r\n\r\n",
];

let tEncoder = new TextEncoder();
let tDecoder = new TextDecoder();

//const base64EncodedUint8Array = tDecoder.decode(base64EncodedString);
const base64DecodedUint8Array = tEncoder.encode(base64DecodedString);
const emptyUint8Array = new Uint8Array(0);

class TestCase {
  constructor(source, skipLineCount, result, note) {
    this.source = source;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.note = note;
  }
}

let testCases = [
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 0]), 0, emptyUint8Array, "Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 1]), 1, emptyUint8Array, "LF Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 2]), 1, emptyUint8Array, "CR Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 3]), 1, emptyUint8Array, "CRLF Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 4]), 2, emptyUint8Array, "LFCR Empty" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 5]), 0, base64DecodedUint8Array, "Extra 0 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 6]), 0, base64DecodedUint8Array, "Extra 1 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 7]), 0, base64DecodedUint8Array, "Extra 2 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 8]), 0, base64DecodedUint8Array, "Extra 3 bytes" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 9]), 0, base64DecodedUint8Array, "Extra LF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[10]), 0, base64DecodedUint8Array, "Extra CR inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[11]), 0, base64DecodedUint8Array, "Extra CRLF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[12]), 0, base64DecodedUint8Array, "Extra LFCR inside" ),

  new TestCase( tEncoder.encode("\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin LF" ),
  new TestCase( tEncoder.encode("\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin CR" ),
  new TestCase( tEncoder.encode("\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Begin CRLF" ),
  new TestCase( tEncoder.encode("\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Begin LFCR" ),

  new TestCase( tEncoder.encode("qwerty\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Text LF" ),
  new TestCase( tEncoder.encode("qwerty\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Text CR" ),
  new TestCase( tEncoder.encode("qwerty\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Text CRLF" ),
  new TestCase( tEncoder.encode("qwerty\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Text LFCR" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[13]), 3, base64DecodedUint8Array, "Multiple LF and CR inside" ),
];




/** Aggregate all progress about downloading, JSON parsing, characters scanning, and weights scanning.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading from network.
      new ValueMax.Percentage.Concrete(), // Increased when parsing the downloaded data to Uint8Array.
    ];

    super(children);

    [this.download, this.uint8Array] = children;
  }
}

let progress = new Progress();
//let receiver = new ValueMax.Receiver.Base();

window.addEventListener("load", event => {
  ScriptLoader.createPromise("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.0.0/dist/tf.min.js").then(test); });

function test() {
  console.log("Base64 decode testing...");

  let testPromiseAll = [];
  for (let i = 0; i < testCases.length; ++i) {
    let testCase = testCases[ i ];

    let testPromise = PartTime.forOf(
      Base64ArrayBufferToUint8Array.decode_Generator(
        testCase.source, testCase.skipLineCount, progress, progress.uint8Array, 5),
      progrgess => {} 
    ).then(r => {
      tf.util.assert(
        r.toString() == testCase.result.toString(),
        `${i}. Skip ${testCase.skipLineCount} lines. ${testCase.note} [${r}] != [${testCase.result}]`);
    });

    testPromiseAll.push( testPromise );
  }

  Promise.all(testPromiseAll).then(values => {
    console.log("Base64 decode testing... Done.");
  });
}
