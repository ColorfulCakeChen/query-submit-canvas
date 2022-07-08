export { ArrayInterleaver };

/**
 *
 */
class ArrayInterleaver {

  /**
   * Rearrange array elements along width by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn
   *   The array to be re-arranged. It is an 1D array but represents a 2D array.
   *
   * @param {number} height
   *   The virtual 2D array's height.
   *
   * @param {number} width
   *   The virtual 2D array's width.
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongWidth( arrayIn, height, width, arrayTemp = [] ) {

    let elementCount = height * width;

    if ( elementCount != arrayIn.length )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth(): `
        + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
        + ` should be the same as input array length ( ${arrayIn.length} ).`
      );

    if ( ( width % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth(): `
        + `width ( ${width} ) must be even (i.e. divisible by 2).`
      );

    arrayTemp.length = width;
    let widthHalf = Math.floor( width / 2 );

    for ( let indexBegin = 0; indexBegin < elementCount; indexBegin += width ) {

      // Copy the elements to be re-arrange.
      for ( let i = 0; i < width; ++i ) {
        arrayTemp[ i ] = arrayIn[ indexBegin + i ];
      }

      // Interleave the elements order.
      for ( let i = 0, toIndex = indexBegin; i < widthHalf; ++i, toIndex += 2 ) {
        arrayIn[ toIndex     ] = arrayTemp[ i ];
        arrayIn[ toIndex + 1 ] = arrayTemp[ i + widthHalf ];
      }
    }

    return arrayIn;
  }

  /**
   * Rearrange array elements along height by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn
   *   The array to be re-arranged. It is an 1D array but represents a 2D array.
   *
   * @param {number} height
   *   The virtual 2D array's height.
   *
   * @param {number} width
   *   The virtual 2D array's width.
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongHeight( arrayIn, height, width, arrayTemp = [] ) {

    let elementCount = height * width;

    if ( elementCount != arrayIn.length )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight(): `
        + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
        + ` should be the same as input array length ( ${arrayIn.length} ).`
      );

    if ( ( height % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight(): `
        + `height ( ${height} ) must be even (i.e. divisible by 2).`
      );

//!!! ...unfinished... (2022/07/08)
    arrayTemp.length = width???;

    let heightHalf = Math.floor( height / 2 );
    let elementCountHalf = Math.floor( elementCount / 2 );

//!!! ...unfinished... (2022/07/08)
//
//     for ( let indexBegin = 0; indexBegin < elementCount; indexBegin += width ) {
//
//       // Copy the elements to be re-arrange.
//       for ( let i = 0; i < width; ++i ) {
//         arrayTemp[ i ] = arrayIn[ indexBegin + i ];
//       }
//
//     }

//!!! ...unfinished... (2022/07/08)

    // Interleave the elements order.
    let toIndexNext;
    for ( let y = 0, toIndex = 0; y < heightHalf; ++y, toIndex = toIndexNext ) {
      toIndexNext = toIndex + width;

      for ( let i = toIndex; i < toIndexNext; ++i )
        arrayIn[ i ] = arrayTemp[ i ];

      for ( let i = toIndex; i < toIndexNext; ++i )
        arrayIn[ i ] = arrayTemp[ elementCountHalf + i ];
    }

    return arrayIn;
  }


//!!! (2022/07/08 Remarked) Replaced by interleave_asGrouptTwo_alongWidth()
//   /**
//    * Rearrange array elements by interleaving.
//    *   - Only ( groupCount == 2 ) is supported.
//    *
//    * @param {Array} arrayIn
//    *   The array to be re-arranged.
//    *
//    * @param {number} indexBegin
//    *   Re-arrange the arrayIn from which element.
//    *
//    * @param {number} elementCount
//    *   How many elements (begin at indexBegin) will be interleaved. It must be even (i.e. divisible by 2).
//    *
//    * @param {Array} arrayTemp
//    *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
//    * re-allocation and improve performance.
//    *
//    * @return {Array}
//    *   Retrun the (modified) arrayIn itself.
//    */
//   static interleave_asGrouptTwo( arrayIn, indexBegin, elementCount, arrayTemp = [] ) {
//
//     if ( ( elementCount % 2 ) != 0 )
//       throw Error( `ArrayInterleaver.interleave_byGrouptTwo(): `
//         + `elementCount ( ${elementCount} ) must be even (i.e. divisible by 2).`
//       );
//
//     // Copy the elements to be re-arrange.
//     arrayTemp.length = elementCount;
//     for ( let i = 0; i < elementCount; ++i ) {
//       arrayTemp[ i ] = arrayIn[ indexBegin + i ];
//     }
//
//     // Interleave the elements order.
//     let elementCountHalf = Math.floor( elementCount / 2 );
//     for ( let i = 0, toIndex = indexBegin; i < elementCountHalf; ++i, toIndex += 2 ) {
//       arrayIn[ toIndex     ] = arrayTemp[ i ];
//       arrayIn[ toIndex + 1 ] = arrayTemp[ i + elementCountHalf ];
//     }
//
//     return arrayIn;
//   }

}
