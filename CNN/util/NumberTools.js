export { isInteger };

/**
 * @param {any} value
 *   A value to be checked.
 *
 * @return {boolean}
 *   - Return true, if valus is an integer.
 *   - Return false, if valus is not an integer. (Return false, even if an
 *       integer string.)
 */
function isInteger( value ) {
  // Note: Bitwising OR with zero is for converting to integer (even if
  //       it is undefined or null or object).
  const intValue = ( value | 0 );
  if ( intValue == value )
    return true; // The value is an intger indeed.
  return false;
}
