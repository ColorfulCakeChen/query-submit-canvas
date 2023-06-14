export { ByBitCount };
export { ByBitCount_LShift };

/** 
 *
 * @param {integer} bitCount
 *   The bit count of the all one bitmask. It should be between [ 1, 48 ].
 *
 * @return {integer}
 *   An unsigned integer whose least significant bitCount bits are all 1.
 */
function ByBitCount( bitCount ) {
  return ( ( 2 ** bitCount ) - 1 );
}

/**
 *
 * @param {integer} bitCount
 *   The bit count of the all one bitmask. It should be between [ 1, 48 ].
 *
 * @param {integer} leftShiftCount
 *   The left shift count of the bitmask. Its value (after left shifted) should
 * be between [ 0, ( 2 ** 48 ) - 1 ].
 *
 * @return {integer}
 *   An unsigned integer whose bits at position [ leftShiftCount,
 * leftShiftCount + bitCount ] from least significant bit are all 1.
 */
function ByBitCount_LShift( bitCount, leftShiftCount ) {
  return ( ByBitCount( bitCount ) << leftShiftCount );
}
