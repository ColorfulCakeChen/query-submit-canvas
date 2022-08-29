export { isInteger };

/**
 * @param {any} value
 *   A value to be checked.
 *
 * @return {boolean}
 *   - Return true, if valus is an integer.
 *   - Return false, if valus is not an integer. (Return false, even if a integer string.)
 */
function isInteger( value ) {
  let intValue = ( value | 0 ); // Note: Bitwising with zero will generate integer.
  if ( intValue == value )
    return true; // The value is an intger indeed.
  return false;
}
