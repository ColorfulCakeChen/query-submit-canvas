export { ToStrinFromString };

import * as Base64 from "../Base64.js";
import * as Uint12_Constant from "./Uint12_Constant.js";


/**
 * 
 * Convert two Base64 encoded characters to a 12-bits unsigned integer.
 *
 * @param {integer} base64_uint6_0
 *   A BASE64 encoded value (as a charcater). It represents the most-significant digit.
 *
 * @param {integer} base64_uint6_1
 *   A BASE64 encoded value (as a charcater). It represents the least-significant digit.
 *
 * @return {integer}
 *   An uint12 (12-bits unsigned integer) value decoded from the base64_uint6_0 and
 * base64_uint6_1.
 */
function From_Base64Char_Two( base64_uint6_0, base64_uint6_1 ) {

BITOR(
  BITLSHIFT(
    BASE64_CHAR_TO_UINT6(
      base64_char_0,base64_decode_table,
      base64_decode_table_value_offset),
    uint12_coder_most_significant_bitmask_lshift_count
  ),
  BASE64_CHAR_TO_UINT6(
    base64_char_1,base64_decode_table,
    base64_decode_table_value_offset
  )
)
}


/**
 *
 * @param {string} base64_string
 *   A BASE64 encoded string (with two charcaters). It represents a BASE64 encoded
 * uint12 (12-bits unsigned integer).
 *
 * @return {integer}
 *   An uint12 (12-bits unsigned integer) value decoded from the base64_string.
 */
function FromString( base64_string ) {
  return From_Base64Char_Two(
    base64_string.codePointAt( 0 ), base64_string.codePointAt( 1 ) );
}
