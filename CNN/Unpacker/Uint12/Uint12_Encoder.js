export { ToString };

import * as Base64 from "../Base64.js";
import * as Uint12_Constant from "./Uint12_Constant.js";

/**
 *
 * @param {integer} uint12_value
 *   The 12-bits unsigned integer to be encoded to Base64 string. It should be between
 * [ 0, Uint12.Constant.UnsignedMax ].
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits unsigned integer.
 */
function ToString( uint12_value ) {
  let uint6_MSB = ( uint12_value >> Uint12_Constant.MostSignificantBitmaskLShiftCount )
                  & Uint12_Constant.MostSignificantBitmask;

  let uint6_LSB = uint12_value & Uint12_Constant.LeastSignificantBitmask;

  return `${
    Base64.Constant.EncodeTable_Uint6_to_Char[ uint6_MSB ]}${
    Base64.Constant.EncodeTable_Uint6_to_Char[ uint6_LSB ]}`;
}
