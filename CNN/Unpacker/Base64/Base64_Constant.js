export { CoderBitCount };
export { CodeCount };
export { ValueDecodedMax };
export { EncodeTable_Uint6_to_Char };
export { EncodeTable_Uint6_to_Uint8 };
export { DecodeTable_CharCodePoint_to_Uint6 };


/**
 * The bit count could be encoded by a Base64 character.
 *
 * It always is 6 (representing an unsigned integer (uint6)).
 */
const CoderBitCount = 6;


/** How many codes used in BASE64 encoding. It always is 64. */
const CodeCount = 64;

/** The maximum Base64 decoded value. It always is 63. */
const ValueDecodedMax = ( CodeCount - 1 );


const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Mapping table for encoding Uint6 (i.e. [ 0, 63 ]) to Base64 character. */
const EncodeTable_Uint6_to_Char = [ ...base64String ];

/**
 * Mapping table for encoding Uint6 (i.e. [ 0, 63 ]) to Base64 character's code
 * point (as Uint8).
 */
const EncodeTable_Uint6_to_Uint8 = ( new TextEncoder() ).encode( base64String );

/**
 * Mapping table for decoding Base64 character (code point between [ 0, 255 ])
 * to Uint6 (i.e. [ 0, 63 ]).
 *
 * (Note: Using Array is faster than using Uint8Array.)
 */
const DecodeTable_CharCodePoint_to_Uint6 = new Array( 256 );
{
  // For all non-base64 codes, using value greater than 63 (i.e. impossible
  // base64) for identifying them.
  DecodeTable_CharCodePoint_to_Uint6.fill( 255 );

  // For all legal base64 codes, using value between [ 0, 63 ].
  {
    for ( let i = 0; i < EncodeTable_Uint6_to_Char.length; ++i ) {
      let char = EncodeTable_Uint6_to_Char[ i ]
      let charCodePoint = char.codePointAt( 0 );
      DecodeTable_CharCodePoint_to_Uint6[ charCodePoint ] = i;
    }

    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    DecodeTable_CharCodePoint_to_Uint6[ "-".charCodeAt( 0 ) ] = 62;
    DecodeTable_CharCodePoint_to_Uint6[ "_".charCodeAt( 0 ) ] = 63;
  }
}
