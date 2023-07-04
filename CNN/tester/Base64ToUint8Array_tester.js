export { tester };

import * as Base64 from "../Unpacker/Base64.js";
import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

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
    let c = RandTools.getRandomIntInclusive(
      PRINTABLE_ASCII_MIN, PRINTABLE_ASCII_MAX );
    originalArray.push( String.fromCodePoint( c ) );
  }
}

const originalString = originalArray.join("");
const base64EncodedString = btoa( originalString );
const base64DecodedString = atob( base64EncodedString );

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

  // Test skip 3 lines. Test multiple non-base64 codes. (They should be
  // ignored.)
  "qwerty5ASDFG7\n\n\r"
    + base64EncodedString.slice(0, 2) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(2, 7) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(7, 9) + "\n\n\r\r\r\n\r\n"
    + base64EncodedString.slice(9)    + "\n\n\r\r\r\n\r\n",
];

let tEncoder = new TextEncoder();
let tDecoder = new TextDecoder();

//const base64EncodedUint8Array = tDecoder.decode(base64EncodedString);
const base64DecodedUint8Array = tEncoder.encode( base64DecodedString );
const emptyUint8Array = new Uint8Array( 0 );

class TestCase {
  constructor( source_String_or_StringArray,
    skipLineCount, result, suspendByteCount, note ) {

    this.source_String_or_StringArray = source_String_or_StringArray;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.suspendByteCount = suspendByteCount;
    this.note = note;
  }

  toString() {
    let str = ``
      + `skipLineCount=${this.skipLineCount}, `
      + `suspendByteCount=${this.suspendByteCount}, `
      + `${this.note}.`
      ;
    return str;
  }
}

let testCases = [
  new TestCase( [ base64EncodedStrings_extra[ 0] ], 1, emptyUint8Array, undefined, "Empty. Not enough lines." ),

  new TestCase(   base64EncodedStrings_extra[ 0]  , 0, emptyUint8Array,         3, "Empty" ),
  new TestCase( [ base64EncodedStrings_extra[ 1] ], 1, emptyUint8Array,         2, "LF Empty" ),
  new TestCase(   base64EncodedStrings_extra[ 2]  , 1, emptyUint8Array,         5, "CR Empty" ),
  new TestCase( [ base64EncodedStrings_extra[ 3] ], 1, emptyUint8Array, undefined, "CRLF Empty" ),
  new TestCase(   base64EncodedStrings_extra[ 4]  , 2, emptyUint8Array,         5, "LFCR Empty" ),

  new TestCase( [ base64EncodedStrings_extra[ 5] ], 0, base64DecodedUint8Array,        15, "Extra 0 bytes" ),
  new TestCase(   base64EncodedStrings_extra[ 6]  , 0, base64DecodedUint8Array,         7, "Extra 1 bytes" ),
  new TestCase( [ base64EncodedStrings_extra[ 7] ], 0, base64DecodedUint8Array,        17, "Extra 2 bytes" ),
  new TestCase(   base64EncodedStrings_extra[ 8]  , 0, base64DecodedUint8Array,         8, "Extra 3 bytes" ),

  new TestCase( [ base64EncodedStrings_extra[ 9] ], 0, base64DecodedUint8Array,         4, "Extra LF inside" ),
  new TestCase(   base64EncodedStrings_extra[10]  , 0, base64DecodedUint8Array,         3, "Extra CR inside" ),
  new TestCase( [ base64EncodedStrings_extra[11] ], 0, base64DecodedUint8Array,         5, "Extra CRLF inside" ),
  new TestCase(   base64EncodedStrings_extra[12]  , 0, base64DecodedUint8Array,        11, "Extra LFCR inside" ),

  new TestCase( [ "\n"   + base64EncodedString ], 1, base64DecodedUint8Array,         5, "Begin LF" ),
  new TestCase(   "\r"   + base64EncodedString  , 1, base64DecodedUint8Array,         5, "Begin CR" ),
  new TestCase( [ "\r\n" + base64EncodedString ], 1, base64DecodedUint8Array,         5, "Begin CRLF" ),
  new TestCase(   "\n\r" + base64EncodedString  , 2, base64DecodedUint8Array,         5, "Begin LFCR" ),

  new TestCase( [ "qwerty\n"   + base64EncodedString ], 1, base64DecodedUint8Array,         6, "Text LF" ),
  new TestCase(   "qwerty\r"   + base64EncodedString  , 1, base64DecodedUint8Array, undefined, "Text CR" ),
  new TestCase( [ "qwerty\r\n" + base64EncodedString ], 1, base64DecodedUint8Array,      2048, "Text CRLF" ),
  new TestCase(   "qwerty\n\r" + base64EncodedString  , 2, base64DecodedUint8Array,         7, "Text LFCR" ),

  new TestCase( [ base64EncodedStrings_extra[13] ], 3, base64DecodedUint8Array, 8, "Multiple LF and CR inside" ),
];


/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "Base64 decode testing..." );

  // 0. Prepare progressParent for every TestCase.
  for ( let i = 0; i < testCases.length; ++i ) {
    progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  // 1. Run every TestCase.
  for ( let i = 0; i < testCases.length; ++i ) {
    let testCase = testCases[ i ];
    let progressChild = progressParent.children[ i ];

    let decoder
      = Base64.Decoder.Base64Char_StringOrStringArray_to_Uint8Array_generator(
          progressChild,
          testCase.source_String_or_StringArray, tEncoder,
          testCase.skipLineCount, testCase.suspendByteCount );

    let r = yield* decoder;

    if ( r.toString() != testCase.result.toString() )
      throw Error( `Base64ToUint8Array_tester.tester(): `
        + `testCaseIndex=${i}, `
        + `${testCase}. `
        + `Result [${r}] != [${testCase.result}]` );

    if ( 100 != progressChild.valuePercentage )
      throw Error( `Base64ToUint8Array_tester.tester(): `
        + `testCaseIndex=${i}, `
        + `${testCase}. `
        + `Progress (${progressChild.valuePercentage}) should be 100 `
        + `after decoding successfully.` );
  }

  console.log( "Base64 decode testing... Done." );
}
