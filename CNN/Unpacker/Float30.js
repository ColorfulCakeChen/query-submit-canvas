

/**
 * This is a scheme for encoding a floating-point number by 5 Base64 (i.e.
 * Uint6 [ 0, 63 ]) characters.
 *
 * Because 30 bits (= 5 * 6 bits ) are used to representing a floating-point
 * number, so called float30.
 *
 *   - The first 4 Base64 characters represents significand.
 *   - The last Base64 character represents exponent.
 *
 *
 *
 *
 */


//!!! ...unfinished... (2022/12/03)


//const use_significand_fraction_digit_count = ???;

/**
 * The digit count of exponent value when encode/decode 30-bits floating-point
 * number to/from Base64 string. It always is 1.
 */
const coder_exponent_digit_count = 1;

/**
 * The offset for exponent (of BASE64 encoded floating-point number) becoming
 * signed integer between [ -32, +31 ]. It always is 32 (=BASE64_CODE_COUNT()/2).
 */
const coder_exponent_offset_to_sign = 64 / 2;



//!!! ...unfinished... (2022/12/03)

/**
 * The digit count of significand value when encode/decode 30-bits floating-point
 * number to/from Base64 string. It always is 4.
 */
const coder_significand_digit_count = 4;

/**
 * The maximum representable significand value when encode/decode 30-bits
 * floating-point number to/from Base64 string. It always is 16777215.
 * (= ( 64 ** 4 ) - 1 )
 */
const coder_significand_unsigned_max = ( 64 ** coder_significand_digit_count ) - 1;

/**
 * The offset value for significand value becoming signed value when encode/decode
 * 30-bits floating-point number to/from Base64 string. It always is 8388608.
 */
const coder_significand_offset_to_sign = Math.ceil( coder_significand_unsigned_max / 2 );

