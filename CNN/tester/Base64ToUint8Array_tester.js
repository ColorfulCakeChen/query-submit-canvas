export { tester };

import * as Base64ToUint8Array from "../Base64ToUint8Array.js";
import * as Random from "../Random.js";
import * as ScriptLoader from "../ScriptLoader.js";
import * as ValueMax from "../ValueMax.js";

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
    let c = Random.getIntInclusive(PRINTABLE_ASCII_MIN, PRINTABLE_ASCII_MAX);
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

  // Test extra has 0 to 3 bytes. (They should be ignored.)
  base64EncodedString,
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
  constructor(source, skipLineCount, result, suspendByteCount, note) {
    this.source = source;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.suspendByteCount = suspendByteCount;
    this.note = note;
  }
}

let testCases = [
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 0]), 1, emptyUint8Array, undefined, "Empty. Not enough lines." ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 0]), 0, emptyUint8Array,         3, "Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 1]), 1, emptyUint8Array,         2, "LF Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 2]), 1, emptyUint8Array,         5, "CR Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 3]), 1, emptyUint8Array, undefined, "CRLF Empty" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 4]), 2, emptyUint8Array,         5, "LFCR Empty" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 5]), 0, base64DecodedUint8Array,        15, "Extra 0 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 6]), 0, base64DecodedUint8Array,         7, "Extra 1 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 7]), 0, base64DecodedUint8Array,        17, "Extra 2 bytes" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 8]), 0, base64DecodedUint8Array,         8, "Extra 3 bytes" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 9]), 0, base64DecodedUint8Array,         4, "Extra LF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[10]), 0, base64DecodedUint8Array,         3, "Extra CR inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[11]), 0, base64DecodedUint8Array,         5, "Extra CRLF inside" ),
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[12]), 0, base64DecodedUint8Array,        11, "Extra LFCR inside" ),

  new TestCase( tEncoder.encode("\n"   + base64EncodedString), 1, base64DecodedUint8Array,         5, "Begin LF" ),
  new TestCase( tEncoder.encode("\r"   + base64EncodedString), 1, base64DecodedUint8Array,         5, "Begin CR" ),
  new TestCase( tEncoder.encode("\r\n" + base64EncodedString), 1, base64DecodedUint8Array,         5, "Begin CRLF" ),
  new TestCase( tEncoder.encode("\n\r" + base64EncodedString), 2, base64DecodedUint8Array,         5, "Begin LFCR" ),

  new TestCase( tEncoder.encode("qwerty\n"   + base64EncodedString), 1, base64DecodedUint8Array,         6, "Text LF" ),
  new TestCase( tEncoder.encode("qwerty\r"   + base64EncodedString), 1, base64DecodedUint8Array, undefined, "Text CR" ),
  new TestCase( tEncoder.encode("qwerty\r\n" + base64EncodedString), 1, base64DecodedUint8Array,      2048, "Text CRLF" ),
  new TestCase( tEncoder.encode("qwerty\n\r" + base64EncodedString), 2, base64DecodedUint8Array,         7, "Text LFCR" ),

  new TestCase( tEncoder.encode(base64EncodedStrings_extra[13]), 3, base64DecodedUint8Array, 8, "Multiple LF and CR inside" ),
];




/** Aggregate all progress about downloading, JSON parsing, characters scanning, and weights scanning.  */
class Progress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = new Array( testCases.length );
    for (let i = 0; i < testCases.length; ++i) {
      children[ i ] = new ValueMax.Percentage.Aggregate(); // Increased when parsing the downloaded data to Uint8Array.
    }

    super(children);
  }
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
 * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log("Base64 decode testing...");

  let progress = progressParent.addChild( new Progress() );

  for (let i = 0; i < testCases.length; ++i) {
    let testCase = testCases[ i ];

    let decoder = Base64ToUint8Array.decoder_FromArrayBuffer(
        testCase.source, testCase.skipLineCount, progress.children[ i ], testCase.suspendByteCount);

    let r = yield* decoder;
   
    if ( r.toString() != testCase.result.toString() )
      throw Error( `[${i}]`
        + ` Skip ${testCase.skipLineCount} lines.`
        + ` suspendByteCount=${testCase.suspendByteCount}.`
        + ` ${testCase.note} [${r}] != [${testCase.result}]` );
  }

  console.log("Base64 decode testing... Done.");
}

/*!!! Old (2020/12/13 Remarked)
function test( progressParent ) {
  console.log("Base64 decode testing...");
  let delayMilliseconds = 1000;

  let progress = progressParent.addChild( new Progress() );
  let progressReceiver = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy("TestProgressBar");

  let testPromiseAll = [];
  for (let i = 0; i < testCases.length; ++i) {
    let testCase = testCases[ i ];

    let decoder = Base64ToUint8Array.decoder_FromArrayBuffer(
        testCase.source, testCase.skipLineCount, progress.children[ i ], testCase.suspendByteCount);

    let testPromise = PartTime.forOf(
      decoder,
      ( valueMax ) => { progressReceiver.setValueMax( valueMax.valuePercentage, valueMax.maxPercentage ); }, // Report progress to UI.
      delayMilliseconds
    ).then(r => {
      progressReceiver.informDone(r); // Inform UI progress done.
      if ( r.toString() != testCase.result.toString() )
        throw Error( `[${i}]`
          + ` Skip ${testCase.skipLineCount} lines.`
          + ` suspendByteCount=${testCase.suspendByteCount}.`
          + ` ${testCase.note} [${r}] != [${testCase.result}]` );
    });

    testPromiseAll.push( testPromise );
  }

  Promise.all(testPromiseAll).then(values => {
    console.log("Base64 decode testing... Done.");
  });
}
*/
