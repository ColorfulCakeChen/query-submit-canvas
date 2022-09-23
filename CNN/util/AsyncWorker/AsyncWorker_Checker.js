export { isTransferred };

/**
 *
 * @param {any} objectToBeChecked
 *   - If it is ArrayBuffer or ImageData or Int32Array or Float32Array or array of them:
 *     - If the length of the ArrayBuffer or ImageData or Int32Array or Float32Array
 *         is zero, return true.
 *     - Otherwise (i.e. transferable object has not been transferred), return false.
 *   - Otherwise (i.e. not transferable object), return true.
 */
function ArrayBuffer_ImageData_Int32Array_Float32Array_isTransferred(
  objectToBeChecked ) {

  // 0. If array, check elements recursively.
  if ( objectToBeChecked instanceof Array ) {
    for ( let i = 0; i < objectToBeChecked.length; ++i ) {
      let bSubOk = ArrayBuffer_ImageData_Int32Array_Float32Array_isTransferred(
        objectToBeChecked[ i ] );
      if ( !bSubOk )
        return false;
    }

  } else if ( objectToBeChecked instanceof ArrayBuffer ) {
    if ( objectToBeChecked.byteLength != 0 )
      return false;

  } else if ( objectToBeChecked instanceof ImageData ) {
    if ( objectToBeChecked.data.length != 0 )
      return false;

  } else if (   ( objectToBeChecked instanceof Int32Array )
             || ( objectToBeChecked instanceof Float32Array )
             //|| ( objectToBeChecked instanceof Uint8Array )
            ) {
    if ( objectToBeChecked.data.length != 0 )
      return false;

  } else {

    return true;
  }
  
  return true;
}

