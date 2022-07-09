export { ArrayInterleaver };

/**
 *
 */
class ArrayInterleaver {

  /**
   * Rearrange array elements by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * The fromArray and toArray can not be an overlapped array.
   *   - They could be different array. Or,
   *   - Thay could be the same array but fromArray[ fromIndex ] to fromArray[ fromIndex + ( 2 * elementCountHalf ) - 1 ] and
   *       toArray[ toIndex ] to toArray[ toIndex + ( 2 * elementCountHalf ) - 1 ] can not overlapped.
   *
   * @param {Array} fromArray
   *   The source array. It will not be modified. It is the source of copying.
   *
   * @param {number} fromIndex
   *   The copying will begin at fromArray[ fromIndex ].
   *
   * @param {Array} toArray
   *   The destination array. It will be modified (i.e. filled data copied from fromArray).
   *
   * @param {number} toIndex
   *   The writing will begin at toArray[ toIndex ].
   *
   * @param {number} elementCountHalf
   *   There will be ( 2 * elementCountHalf ) elements copied from fromArray[ fromIndex ] to toArray[ toIndex ] but in a re-arranged
   * interleaved order.
   *
   */
  static interleave_asGrouptTwo_from_to( fromArray, fromIndex, toArray, toIndex, elementCountHalf ) {
    for ( let i = 0, from = fromIndex, to = toIndex; i < elementCountHalf; ++i, ++from, to += 2 ) {
      toArray[ to     ] = fromArray[ from ];
      toArray[ to + 1 ] = fromArray[ from + elementCountHalf ];
    }
  }

  /**
   * Rearrange array elements by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn
   *   The array to be re-arranged.
   *
   * @param {number} indexBegin
   *   Re-arrange the arrayIn from which element.
   *
   * @param {number} elementCount
   *   How many elements (begin at indexBegin) will be interleaved. It must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo( arrayIn, indexBegin, elementCount, arrayTemp ) {

    if ( ( elementCount % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_byGrouptTwo(): `
        + `elementCount ( ${elementCount} ) must be even (i.e. divisible by 2).`
      );

    // Copy the elements to be re-arrange.
    arrayTemp.length = elementCount;
    for ( let i = 0; i < elementCount; ++i ) {
      arrayTemp[ i ] = arrayIn[ indexBegin + i ];
    }

    // Interleave the elements order.
    let elementCountHalf = Math.floor( elementCount / 2 );
    ArrayInterleaver.interleave_asGrouptTwo_from_to( arrayTemp, 0, arrayIn, indexBegin, elementCountHalf );

//!!! (2022/07/09 Remarked) Old Codes.
//     for ( let i = 0, toIndex = indexBegin; i < elementCountHalf; ++i, toIndex += 2 ) {
//       arrayIn[ toIndex     ] = arrayTemp[ i ];
//       arrayIn[ toIndex + 1 ] = arrayTemp[ i + elementCountHalf ];
//     }

    return arrayIn;
  }

  /**
   * Rearrange array elements along height by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number} height    The virtual 2D array's height.
   * @param {number} width     The virtual 2D array's width.
   */
  static interleave_asGrouptTwo_alongHeight_from_to( fromArray, toArray, height, width ) {
    let elementCount = height * width;
    if ( elementCount != fromArray.length )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight_from_to(): `
        + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
        + ` should be the same as input array length ( ${fromArray.length} ).`
      );

    if ( ( height % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight_from_to(): `
        + `height ( ${height} ) must be even (i.e. divisible by 2).`
      );

    toArray.length = elementCount;
    let elementCountHalf = Math.floor( elementCount / 2 );

    let fromIndex2, toIndex2;
    for ( let y = 0, fromIndex1 = 0, toIndex1 = 0; y < height; y += 2, fromIndex1 += width, toIndex1 = ( toIndex2 + width ) ) {
      fromIndex2 = fromIndex1 + elementCountHalf;
      toIndex2 = toIndex1 + width;
      for ( let i = 0; i < width; ++i ) {
        toArray[ toIndex1 + i ] = fromArray[ fromIndex1 + i ];
        toArray[ toIndex2 + i ] = fromArray[ fromIndex2 + i ];
      }
    }
  }

  /**
   * Rearrange array elements along height by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn  The array to be re-arranged. It is an 1D array but represents a 2D array.
   *
   * @param {number} height  The virtual 2D array's height.
   * @param {number} width   The virtual 2D array's width.
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongHeight( arrayIn, height, width, arrayTemp ) {

    // Copy the elements to be re-arrange.
    arrayTemp.length = arrayIn.length;
    for ( let i = 0; i < arrayIn.length; ++i ) {
      arrayTemp[ i ] = arrayIn[ i ];
    }

    ArrayInterleaver.interleave_asGrouptTwo_alongHeight_from_to( arrayTemp, arrayIn, height, width );

//!!! (2022/07/09 Remarked) Old Codes.
//     let elementCount = height * width;
//
//     if ( elementCount != arrayIn.length )
//       throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight(): `
//         + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
//         + ` should be the same as input array length ( ${arrayIn.length} ).`
//       );
//
//     if ( ( height % 2 ) != 0 )
//       throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongHeight(): `
//         + `height ( ${height} ) must be even (i.e. divisible by 2).`
//       );
//
//     // Copy the elements to be re-arrange.
//     arrayTemp.length = elementCount;
//     for ( let i = 0; i < elementCount; ++i ) {
//       arrayTemp[ i ] = arrayIn[ i ];
//     }
//
//     let elementCountHalf = Math.floor( elementCount / 2 );
//
//     // Interleave the elements order.
//     let fromIndex2, toIndex2;
//     for ( let y = 0, fromIndex1 = 0, toIndex1 = 0; y < height; y += 2, fromIndex1 += width, toIndex1 = ( toIndex2 + width ) ) {
//       fromIndex2 = fromIndex1 + elementCountHalf;
//       toIndex2 = toIndex1 + width;
//       for ( let i = 0; i < width; ++i ) {
//         arrayIn[ toIndex1 + i ] = arrayTemp[ fromIndex1 + i ];
//         arrayIn[ toIndex2 + i ] = arrayTemp[ fromIndex2 + i ];
//       }
//     }

    return arrayIn;
  }

  /**
   * Rearrange array elements along width by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number} height    The virtual 2D array's height.
   * @param {number} width     The virtual 2D array's width.
   */
  static interleave_asGrouptTwo_alongWidth_from_to( fromArray, toArray, height, width ) {
    let elementCount = height * width;
    if ( elementCount != fromArray.length )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth_from_to(): `
        + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
        + ` should be the same as input array length ( ${fromArray.length} ).`
      );

    if ( ( width % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth_from_to(): `
        + `width ( ${width} ) must be even (i.e. divisible by 2).`
      );

    toArray.length = elementCount;
    let widthHalf = ( width / 2 );
    for ( let i = 0; i < elementCount; i += width ) {
      ArrayInterleaver.interleave_asGrouptTwo_from_to( fromArray, i, toArray, i, widthHalf );
    }
  }

  /**
   * Rearrange array elements along width by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn  The array to be re-arranged. It is an 1D array but represents a 2D array.
   * @param {number} height  The virtual 2D array's height.
   * @param {number} width   The virtual 2D array's width.
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongWidth( arrayIn, height, width, arrayTemp ) {

    // Copy the elements to be re-arrange.
    arrayTemp.length = arrayIn.length;
    for ( let i = 0; i < arrayIn.length; ++i ) {
      arrayTemp[ i ] = arrayIn[ i ];
    }

    ArrayInterleaver.interleave_asGrouptTwo_alongWidth( arrayTemp, arrayIn, height, width );

//!!! (2022/07/09 Remarked) Old Codes.
//     let elementCount = height * width;
//
//     if ( elementCount != arrayIn.length )
//       throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth(): `
//         + `( height * width ) = ( ${height} * ${width} ) = ${elementCount} `
//         + ` should be the same as input array length ( ${arrayIn.length} ).`
//       );
//
//     if ( ( width % 2 ) != 0 )
//       throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongWidth(): `
//         + `width ( ${width} ) must be even (i.e. divisible by 2).`
//       );
//
//     arrayTemp.length = width;
//     let widthHalf = Math.floor( width / 2 );
//
//     for ( let indexBegin = 0; indexBegin < elementCount; indexBegin += width ) {
//
//       // Copy the elements to be re-arrange.
//       for ( let i = 0; i < width; ++i ) {
//         arrayTemp[ i ] = arrayIn[ indexBegin + i ];
//       }
//
//       ArrayInterleaver.interleave_asGrouptTwo_from_to( arrayTemp, 0, arrayIn, indexBegin, widthHalf );
//
// //!!! (2022/07/09 Remarked) Old Codes.
// //       // Interleave the elements order.
// //       for ( let i = 0, toIndex = indexBegin; i < widthHalf; ++i, toIndex += 2 ) {
// //         arrayIn[ toIndex     ] = arrayTemp[ i ];
// //         arrayIn[ toIndex + 1 ] = arrayTemp[ i + widthHalf ];
// //       }
//     }

    return arrayIn;
  }

  /**
   * Rearrange array elements along depth by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number} height    The virtual 2D array's height.
   * @param {number} width     The virtual 2D array's width.
   * @param {number} depth     The virtual 2D array's depth (i.e. channel count).
   */
  static interleave_asGrouptTwo_alongDepth_from_to( fromArray, toArray, height, width, depth ) {
    let elementCount = height * width * depth;
    if ( elementCount != fromArray.length )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongDepth_from_to(): `
        + `( height * width * depth ) = ( ${height} * ${width} * ${depth} ) = ${elementCount} `
        + ` should be the same as input array length ( ${fromArray.length} ).`
      );

    if ( ( depth % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongDepth_from_to(): `
        + `depth ( ${depth} ) must be even (i.e. divisible by 2).`
      );

    toArray.length = elementCount;
    let depthHalf = ( depth / 2 );
    for ( let i = 0; i < elementCount; i += depth ) {
      ArrayInterleaver.interleave_asGrouptTwo_from_to( fromArray, i, toArray, i, depthHalf );
    }
  }

}
