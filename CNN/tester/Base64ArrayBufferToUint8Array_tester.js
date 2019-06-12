import * as ScriptLoader from "../ScriptLoader.js";
import * as Base64ArrayBufferToUint8Array from "../Base64ArrayBufferToUint8Array.js";
import * as PartTime from "../PartTime.js";
import * as ValueMax from "../ValueMax.js";

const base64EncodedString = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
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

//let tEncoder = new TextEncoder();
//const base64EncodedUint8Array = tDecoder.decode(base64EncodedString);

let tDecoder = new TextDecoder();
const base64DecodedUint8Array = tDecoder.decode(base64DecodedString);

class TestCase {
  constructor(source, skipLineCount, result, note) {
    this.source = source;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.note = note;
  }
}

let testCases = [
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[0]), 0, base64DecodedUint8Array, "Extra 0 bytes" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[1]), 0, base64DecodedUint8Array, "Extra 1 bytes" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[2]), 0, base64DecodedUint8Array, "Extra 2 bytes" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[3]), 0, base64DecodedUint8Array, "Extra 3 bytes" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[4]), 0, base64DecodedUint8Array, "Extra LF inside" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[5]), 0, base64DecodedUint8Array, "Extra CR inside" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[6]), 0, base64DecodedUint8Array, "Extra CRLF inside" ),
  TestCase( tEncoder.encode(base64EncodedStrings_shorten[7]), 0, base64DecodedUint8Array, "Extra LFCR inside" ),

  TestCase( tEncoder.encode("\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin LF" ),
  TestCase( tEncoder.encode("\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Begin CR" ),
  TestCase( tEncoder.encode("\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Begin CRLF" ),
  TestCase( tEncoder.encode("\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Begin LFCR" ),

  TestCase( tEncoder.encode("qwerty\n"   + base64EncodedString), 1, base64DecodedUint8Array, "Text LF" ),
  TestCase( tEncoder.encode("qwerty\r"   + base64EncodedString), 1, base64DecodedUint8Array, "Text CR" ),
  TestCase( tEncoder.encode("qwerty\r\n" + base64EncodedString), 1, base64DecodedUint8Array, "Text CRLF" ),
  TestCase( tEncoder.encode("qwerty\n\r" + base64EncodedString), 2, base64DecodedUint8Array, "Text LFCR" ),
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
