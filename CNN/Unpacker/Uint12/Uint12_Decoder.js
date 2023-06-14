export { from_Base64_DecodedValue_Two };
export { from_Base64Char_CodePoint_Two };
export { from_String };

import * as Base64 from "../Base64.js";
import * as Uint12_Constant from "./Uint12_Constant.js";

/**
 * 
 * Convert two Base64 decoded values to a 12-bits unsigned integer.
 *
 * @param {integer} base64_decodedValue_0
 *   A Base64 decoded value (i.e. integer between [ 0, 63 ]). It represents the
 * most-significant bits.
 *
 * @param {integer} base64_decodedValue_1
 *   A Base64 decoded value (i.e. integer between [ 0, 63 ]). It represents the
 * least-significant bits.
 *
 * @return {integer}
 *   An uint12 (12-bits unsigned integer) value decoded from the
 * base64_decodedValue_0 and base64_decodedValue_1.
 */
function from_Base64_DecodedValue_Two(
  base64_decodedValue_0, base64_decodedValue_1 ) {

  return (
      ( base64_decodedValue_0
          << Uint12_Constant.CoderMostSignificantBitmaskLShiftCount )
    | ( base64_decodedValue_1 )
  );
}

/**
 * 
 * Convert two Base64 encoded characters to a 12-bits unsigned integer.
 *
 * @param {integer} base64Char_codePoint_0
 *   A BASE64 encoded value (as a charcater's code point). It represents the
 * most-significant bits.
 *
 * @param {integer} base64Char_codePoint_1
 *   A BASE64 encoded value (as a charcater's code point). It represents the
 * least-significant bits.
 *
 * @return {integer}
 *   An uint12 (12-bits unsigned integer) value decoded from the
 * base64Char_codePoint_0 and base64Char_codePoint_1.
 */
function from_Base64Char_CodePoint_Two(
  base64Char_codePoint_0, base64Char_codePoint_1 ) {

  const DecodeTable_CharCodePoint_to_Uint6
    = Base64.Constant.DecodeTable_CharCodePoint_to_Uint6;

  return from_Base64_DecodedValue_Two(
    DecodeTable_CharCodePoint_to_Uint6[ base64Char_codePoint_0 ],
    DecodeTable_CharCodePoint_to_Uint6[ base64Char_codePoint_1 ]
  );
}

/**
 *
 * It will call Uint12.Decoder.from_Base64Char_CodePoint_Two().
 *
 * @param {string} base64String
 *   A BASE64 encoded string (with two charcaters). It represents a BASE64
 * encoded uint12 (12-bits unsigned integer).
 *
 * @return {integer}
 *   An uint12 (12-bits unsigned integer) value decoded from the base64String.
 */
function from_String( base64String ) {
  return from_Base64Char_CodePoint_Two(
    base64String.codePointAt( 0 ), base64String.codePointAt( 1 ) );
}
