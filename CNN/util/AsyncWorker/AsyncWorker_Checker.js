export { ImageData_ArrayBuffer_TypedArray_isTransferred };

/**
 *
 * @param {any} objectToBeChecked
 *   - If it is ( ImageData or ArrayBuffer or TypedArray ) or array of them:
 *     - If the length of the ( ImageData or ArrayBuffer or TypedArray )
 *         is zero, return true.
 *     - Otherwise (i.e. transferable object has not been transferred), return
 *         false.
 *   - Otherwise (i.e. not transferable object), return true.
 */
function ImageData_ArrayBuffer_TypedArray_isTransferred( objectToBeChecked ) {

  // 0. If array, check elements recursively.
  if ( objectToBeChecked instanceof Array ) {
    for ( let i = 0; i < objectToBeChecked.length; ++i ) {
      let bElementOk
        = ImageData_ArrayBuffer_TypedArray_isTransferred( objectToBeChecked[ i ] );
      if ( !bElementOk )
        return false;
    }

  // 1.
  } else if ( objectToBeChecked instanceof ImageData ) {
    if ( objectToBeChecked.data.length != 0 )
      return false;

  // 2. ArrayBuffer or TypedArray. (Note: They all have .byteLength)
  } else if (   ( objectToBeChecked instanceof Object )
             && ( objectToBeChecked.byteLength != undefined )
            ) {
    if ( objectToBeChecked.byteLength != 0 )
      return false;
  }

  // Note: For non-transferable object, always return true.
  return true;
}

