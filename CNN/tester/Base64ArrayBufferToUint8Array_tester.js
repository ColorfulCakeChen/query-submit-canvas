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
  const ORIGINAL_TEST_STRING_LENGTH = 3 * 5;

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
  base64EncodedString,

  // Test extra has 0 to 3 bytes. (They should be ignored.)
  base64EncodedString + "ab",
  base64EncodedString + "ab",
  base64EncodedString + "abc",

  // Test extra non-base64 codes inside. (They should be ignored.)
  base64EncodedString.slice(0, 3) + "\n"   + base64EncodedString.slice(3, -1),
  base64EncodedString.slice(0, 3) + "\r"   + base64EncodedString.slice(3, -1),
  base64EncodedString.slice(0, 3) + "\r\n" + base64EncodedString.slice(3, -1),
  base64EncodedString.slice(0, 3) + "\n\r" + base64EncodedString.slice(3, -1),
];

let tEncoder = new TextEncoder();
let tDecoder = new TextDecoder();

//const base64EncodedUint8Array = tDecoder.decode(base64EncodedString);
const base64DecodedUint8Array = tEncoder.encode(base64DecodedString);

class TestCase {
  constructor(source, skipLineCount, result, note) {
    this.source = source;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.note = note;
  }
}

let testCases = [
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[0]), 0, base64DecodedUint8Array, "Extra 0 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[1]), 0, base64DecodedUint8Array, "Extra 1 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[2]), 0, base64DecodedUint8Array, "Extra 2 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[3]), 0, base64DecodedUint8Array, "Extra 3 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[4]), 0, base64DecodedUint8Array, "Extra LF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[5]), 0, base64DecodedUint8Array, "Extra CR inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[6]), 0, base64DecodedUint8Array, "Extra CRLF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[7]), 0, base64DecodedUint8Array, "Extra LFCR inside" ),

  new TestCase( tEncoder.encode("\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin LF" ),
  new TestCase( tEncoder.encode("\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin CR" ),
  new TestCase( tEncoder.encode("\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Begin CRLF" ),
  new TestCase( tEncoder.encode("\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Begin LFCR" ),

  new TestCase( tEncoder.encode("qwerty\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Text LF" ),
  new TestCase( tEncoder.encode("qwerty\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Text CR" ),
  new TestCase( tEncoder.encode("qwerty\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Text CRLF" ),
  new TestCase( tEncoder.encode("qwerty\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Text LFCR" ),
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

  for (let i = 0; i < testCases.length; ++i) {
    let testCase = testCases[ i ];

    PartTime.forOf(
      Base64ArrayBufferToUint8Array.decode_Generator(
        testCase.source, testCase.skipLineCount, progress, progress.uint8Array, 5),
      progrgess => {} 
    ).then(r => {
      tf.util.assert(
        r.toString() == testCase.result.toString(),
        `[${i}] (${testCase.skipLineCount}) (${testCase.note}) ${r} != ${testCase.result}`);
    });
  }

  console.log("Base64 decode testing... Done.");
}
