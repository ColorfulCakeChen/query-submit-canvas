export { ArrayInterleaver };

/**
 *
 */
class ArrayInterleaver {

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
  static interleave_asGrouptTwo( arrayIn, indexBegin, elementCount, arrayTemp = [] ) {

    tf.util.assert( ( ( elementCount % 2 ) == 0 ),
      `ArrayInterleaver.interleave_byGrouptTwo(): `
        + `elementCount ( ${elementCount} ) must be even (i.e. divisible by 2).`
    );

    // Copy the elements to be re-arrange.
    arrayTemp.length = elementCount;
    for ( let i = 0; i < elementCount; ++i ) {
      arrayTemp[ i ] = arrayIn[ indexBegin + i ];
    }

    // Interleave the elements order.
    let elementCountHalf = Math.floor( elementCount / 2 );
    for ( let i = 0, toIndex = indexBegin; i < elementCountHalf; ++i, toIndex += 2 ) {
      arrayIn[ toIndex     ] = arrayTemp[ i ];
      arrayIn[ toIndex + 1 ] = arrayTemp[ i + elementCountHalf ];
    }

    return arrayIn;
  }

}
