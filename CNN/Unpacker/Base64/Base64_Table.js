export { Encode_Uint6_to_Char };
export { Decode_CharCodePoint_to_Uint6 };

const base64String = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Mapping table for encoding Uint6 (i.e. [ 0, 63 ]) to Base64 character. */
const Encode_Uint6_to_Char = [ ...base64String ];

/**
 * Mapping table for decoding Base64 character (code point between [ 0, 255 ])
 * to Uint6 (i.e. [ 0, 63 ]).
 *
 * (Note: Using Array is faster than using Uint8Array.)
 */
const Decode_CharCodePoint_to_Uint6 = new Array( 256 );
{
  // For all non-base64 codes, using value greater than 63 (i.e. impossible base64)
  // for identifying them.
  Decode_CharCodePoint_to_Uint6.fill( 255 );

  // For all legal base64 codes, using value between [ 0, 63 ].
  {
    for ( let i = 0; i < Encode_Uint6_to_Char.length; ++i ) {
      let char = Encode_Uint6_to_Char[ i ]
      let charCodePoint = char.codePointAt( 0 );
      Decode_CharCodePoint_to_Uint6[ charCodePoint ] = i;
    }

    // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications
    Decode_CharCodePoint_to_Uint6[ "-".charCodeAt( 0 ) ] = 62;
    Decode_CharCodePoint_to_Uint6[ "_".charCodeAt( 0 ) ] = 63;
  }
}
