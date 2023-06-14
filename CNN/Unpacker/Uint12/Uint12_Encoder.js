export { to_Uint8Array_BigEndian };
export { to_String };

import * as Base64 from "../Base64.js";
import * as Uint12_Constant from "./Uint12_Constant.js";

/**
 *
 * @param {integer} uint12_value
 *   The 12-bits unsigned integer to be encoded to Base64 string. It should be
 * between [ 0, Uint12.Constant.UnsignedMax ].
 *
 * @param {Uint8Array} targetUint8Array
 *   The Uint8Array which will be filled two Base64 encoded characters
 * (representing a 12-bits unsigned integer).
 *
 * @param {integer} targetArrayIndex
 *   The array index of targetUint8Array for filling the result two Base64
 * encoded characters (in big endian order).
 *
 *   - The targetUint8Array[ targetArrayIndex + 0 ] will be filled with the
 *       most significant bits of the uint12_value.
 *
 *   - The targetUint8Array[ targetArrayIndex + 1 ] will be filled with the
 *       least significant bits of the uint12_value.
 *
 */
function to_Uint8Array_BigEndian(
  uint12_value, targetUint8Array, targetArrayIndex ) {

  let uint6_MSB =
    ( uint12_value >> Uint12_Constant.CoderMostSignificantBitmaskLShiftCount )
    & Uint12_Constant.CoderMostSignificantBitmask;

  let uint6_LSB = uint12_value & Uint12_Constant.CoderLeastSignificantBitmask;

  targetUint8Array[ targetArrayIndex ]
    = Base64.Constant.EncodeTable_Uint6_to_Uint8[ uint6_MSB ];

  targetUint8Array[ targetArrayIndex + 1 ]
    = Base64.Constant.EncodeTable_Uint6_to_Uint8[ uint6_LSB ];
}

/**
 *
 * @param {integer} uint12_value
 *   The 12-bits unsigned integer to be encoded to Base64 string. It should be
 * between [ 0, Uint12.Constant.UnsignedMax ].
 *
 * @return {string}
 *   A Base64 encoded string (two characters) representing a 12-bits unsigned
 * integer.
 */
function to_String( uint12_value ) {
  let uint6_MSB =
    ( uint12_value >> Uint12_Constant.CoderMostSignificantBitmaskLShiftCount )
    & Uint12_Constant.CoderMostSignificantBitmask;

  let uint6_LSB = uint12_value & Uint12_Constant.CoderLeastSignificantBitmask;

  return `${
    Base64.Constant.EncodeTable_Uint6_to_Char[ uint6_MSB ]}${
    Base64.Constant.EncodeTable_Uint6_to_Char[ uint6_LSB ]}`;
}
