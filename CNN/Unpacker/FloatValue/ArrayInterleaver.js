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
   * @param {Array} fromArray   The source array. It will not be modified. It is the source of copying.
   * @param {number} fromIndex  The copying will begin at fromArray[ fromIndex ].
   * @param {Array} toArray     The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number} toIndex    The writing will begin at toArray[ toIndex ].
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
   * Rearrange array elements so that it undo the .interleave_asGrouptTwo_from_to().
   *   - Only ( groupCount == 2 ) is supported.
   *
   * The fromArray and toArray can not be an overlapped array.
   *   - They could be different array. Or,
   *   - Thay could be the same array but fromArray[ fromIndex ] to fromArray[ fromIndex + ( 2 * elementCountHalf ) - 1 ] and
   *       toArray[ toIndex ] to toArray[ toIndex + ( 2 * elementCountHalf ) - 1 ] can not overlapped.
   *
   * @param {Array} fromArray   The source array. It will not be modified. It is the source of copying.
   * @param {number} fromIndex  The copying will begin at fromArray[ fromIndex ].
   * @param {Array} toArray     The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number} toIndex    The writing will begin at toArray[ toIndex ].
   *
   * @param {number} elementCountHalf
   *   There will be ( 2 * elementCountHalf ) elements copied from fromArray[ fromIndex ] to toArray[ toIndex ] but in a re-arranged
   * interleaved-undo order.
   *
   */
  static interleave_asGrouptTwo_from_to_undo( fromArray, fromIndex, toArray, toIndex, elementCountHalf ) {
    for ( let i = 0, from = fromIndex, to = toIndex; i < elementCountHalf; ++i, from += 2, ++to ) {
      toArray[ to ] = fromArray[ from ];
      toArray[ to + elementCountHalf ] = fromArray[ from + 1 ];
    }
  }

  /**
   * Rearrange array elements by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn        The array to be re-arranged.
   * @param {number} indexBegin    Re-arrange the arrayIn from which element.
   * @param {number} elementCount  How many elements (begin at indexBegin) will be interleaved. It must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_inPlace( arrayIn, indexBegin, elementCount, arrayTemp ) {

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
    return arrayIn;
  }


  /**
   * Rearrange array elements along the last 2nd axis by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number[]} shape   The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   */
  static interleave_asGrouptTwo_alongLast2ndAxis_from_to( fromArray, toArray, ...shape ) {
    if ( shape.length < 2 ) {
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLast2ndAxis_from_to(): `
        + `shape.length ( ${shape.length} ) should be at least 2.`
      );
    }

    let elementCount = 1;
    for ( let i = 0; i < shape.length; ++i ) {
      elementCount *= shape[ i ];
    }

    if ( elementCount != fromArray.length ) {
      let shapeString = shape.join( " * " );
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLast2ndAxis_from_to(): `
        + `shape ( ${shapeString} ) = ${elementCount} `
        + `should be the same as input array length ( ${fromArray.length} ).`
      );
    }

    let last2ndAxisId = shape.length - 2;
    let last2ndAxisLength = shape[ last2ndAxisId ];
    if ( ( last2ndAxisLength % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLast2ndAxis_from_to(): `
        + `shape's last 2nd axis length ( ${last2ndAxisLength} ) must be even (i.e. divisible by 2).`
      );

    let lastAxisId = shape.length - 1;
    let lastAxisLength = shape[ lastAxisId ];

    toArray.length = elementCount;
    let elementCountHalf = ( elementCount / 2 );

    let fromIndex1 = 0, toIndex1 = 0;
    let fromIndex2, toIndex2;
    for ( let y = 0; y < last2ndAxisLength; y += 2 ) {
      fromIndex2 = fromIndex1 + elementCountHalf;
      toIndex2 = toIndex1 + lastAxisLength;

      for ( let i = 0; i < lastAxisLength; ++i ) {
        toArray[ toIndex1 + i ] = fromArray[ fromIndex1 + i ];
        toArray[ toIndex2 + i ] = fromArray[ fromIndex2 + i ];
      }

      fromIndex1 += lastAxisLength;
      toIndex1 = ( toIndex2 + lastAxisLength )
    }
  }

  /**
   * Rearrange array elements along the last 2nd axis by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn   The array to be re-arranged. It is an 1D array but represents a 2D array.
   * @param {number[]} shape  The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongLast2ndAxis_inPlace( arrayIn, height, width, arrayTemp ) {

    arrayTemp.length = arrayIn.length;
    for ( let i = 0; i < arrayIn.length; ++i ) { // Copy the elements to be re-arrange.
      arrayTemp[ i ] = arrayIn[ i ];
    }

    ArrayInterleaver.interleave_asGrouptTwo_alongLast2ndAxis_from_to( arrayTemp, arrayIn, height, width );
    return arrayIn;
  }


  /**
   * Rearrange array elements along the last axis by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {Function} pfnInterleaver  The interleaving function (i.e. interleave_asGrouptTwo_from_to or interleave_asGrouptTwo_from_to_undo ).
   * @param {number[]} shape   The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   */
  static interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver( fromArray, toArray, pfnInterleaver, ...shape ) {
    if ( shape.length < 1 ) {
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver(): `
        + `shape.length ( ${shape.length} ) should be at least 1.`
      );
    }

    let elementCount = 1;
    for ( let i = 0; i < shape.length; ++i ) {
      elementCount *= shape[ i ];
    }

    if ( elementCount != fromArray.length ) {
      let shapeString = shape.join( " * " );
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver(): `
        + `shape ( ${shapeString} ) = ${elementCount} `
        + `should be the same as input array length ( ${fromArray.length} ).`
      );
    }

    let lastAxisId = shape.length - 1;
    let lastAxisLength = shape[ lastAxisId ];
    if ( ( lastAxisLength % 2 ) != 0 )
      throw Error( `ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver(): `
        + `shape's last axis length ( ${lastAxisLength} ) must be even (i.e. divisible by 2).`
      );

    toArray.length = elementCount;
    let lastAxisLengthHalf = ( lastAxisLength / 2 );
    for ( let i = 0; i < elementCount; i += lastAxisLength ) {
      pfnInterleaver( fromArray, i, toArray, i, lastAxisLengthHalf );
    }
  }

  /**
   * Rearrange array elements along the last axis by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number[]} shape   The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   */
  static interleave_asGrouptTwo_alongLastAxis_from_to( fromArray, toArray, ...shape ) {
    ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver(
      fromArray, toArray, ArrayInterleaver.interleave_asGrouptTwo_from_to, ...shape );
  }

  /**
   * Rearrange array elements along the last axis by interleaving.
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} arrayIn   The array to be re-arranged. It is an 1D array but represents a N-dimension array.
   * @param {number[]} shape  The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements (from arrayIn) temporarily. Providing this array could reduce memory
   * re-allocation and improve performance.
   *
   * @return {Array}
   *   Retrun the (modified) arrayIn itself.
   */
  static interleave_asGrouptTwo_alongLastAxis_inPlace( arrayIn, arrayTemp, ...shape ) {

    arrayTemp.length = arrayIn.length;
    for ( let i = 0; i < arrayIn.length; ++i ) { // Copy the elements to be re-arrange.
      arrayTemp[ i ] = arrayIn[ i ];
    }

    ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to( arrayTemp, arrayIn, ...shape );
    return arrayIn;
  }

  /**
   * Rearrange array elements along the last axis so that it undo the .interleave_asGrouptTwo_alongLastAxis_from_to().
   *   - Only ( groupCount == 2 ) is supported.
   *
   * @param {Array} fromArray  The source array. It will not be modified. It is the source of copying.
   * @param {Array} toArray    The destination array. It will be modified (i.e. filled data copied from fromArray).
   * @param {number[]} shape   The virtual N-dimension array's shape (e.g. [ width ] or [ height, width ] or [ height, width, depth ].
   */
  static interleave_asGrouptTwo_alongLastAxis_from_to_undo( fromArray, toArray, ...shape ) {
    ArrayInterleaver.interleave_asGrouptTwo_alongLastAxis_from_to_pfnInterleaver(
      fromArray, toArray, ArrayInterleaver.interleave_asGrouptTwo_from_to_undo, ...shape );
  }

}
