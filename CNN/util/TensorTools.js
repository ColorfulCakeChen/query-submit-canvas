export { Comparator, Asserter_Tensor_NumberArray };

/**
 *
 */
class Comparator {

  /** @return Return true, if two array of tensor are equal by value. */
  static isTensorArrayEqual( tensorArray1, tensorArray2 ) {

    if ( tensorArray1 === tensorArray2 )
      return true;

    if ( tensorArray1 == null || tensorArray2 == null )
      return false;

    if ( tensorArray1.length !== tensorArray2.length )
      return false;

    for ( let i = 0; i < tensorArray1.length; ++i ) {  // Compare every element of each tensor.
      let allElementEqual = tf.tidy( "TensorTools.Comparator.isTensorArrayEqual", () => {
        let everyElementEqualTensor1d = tensorArray1[ i ].equal( tensorArray2[ i ] );
        let allElementEqualTensor1d = everyElementEqualTensor1d.all();
        return allElementEqualTensor1d.arraySync(); // 0: false. 1: true.
      });

      if ( !allElementEqual )
        return false;
    }

    return true;
  }

}


/**
 * Assert a tensor whether equals to a number array.
 */
class Asserter_Tensor_NumberArray {

  /**
   *
   *
   * @param {number} acceptableDifferenceRate
   *   How many difference (in ratio) between the tensor and numberArray (per element) is acceptable. Because floating-point
   * accumulated error of float32 (GPU) and float64 (CPU) is different, a little difference should be allowed. Otherwise,
   * the comparison may hardly to pass this check. Default is 0.4 (i.e. 40% difference is allowed).
   */
  constructor( acceptableDifferenceRate = 0.4 ) {
    this.acceptableDifferenceRate = acceptableDifferenceRate;
    this.comparator = Asserter_Tensor_NumberArray.ElementComparator.bind( this );
  }

  /**
   *
   * @param {tf.tensor} tensor
   *   The tf.tensor to be checked.
   *
   * @param {number[]} numberArray
   *   The number to be compared against tensor's data.
   *
   * @param {string} prefixMsg
   *   The text to be displayed at the beginning when comparison failed.
   *
   * @param {string} tensorName
   *   The text to be displayed for the tensor when comparison failed.
   *
   * @param {string} numberArrayName
   *   The text to be displayed for the numberArray when comparison failed.
   *
   * @param {string} postfixMsg
   *   The text to be displayed at the tail when comparison failed.
   */
  assert( tensor, numberArray, prefixMsg, tensorName, numberArrayName, postfixMsg ) {

    let tensorDataArray = null;
    if ( tensor ) {
      tensorDataArray = tensor.dataSync();
    }

    // Check both null or non-null.
    tf.util.assert( ( tensorDataArray == null ) == ( numberArray == null ),
      `${prefixMsg} ${tensorName} ( ${tensorDataArray} ) and ${numberArrayName} ( ${numberArray} ) should be both null or non-null. ${postfixMsg}` );

    if ( !tensorDataArray )
      return; // Since null, no element need to be compared futher.

    // Check both length.
    tf.util.assert( tensorDataArray.length == numberArray.length,
    `${prefixMsg} ${tensorName} length ( ${tensorDataArray.length} ) should be ( ${numberArray.length} ). ${postfixMsg}` );

    this.numberArray = numberArray; // For ElementComparator() to access.

    // Check both elements.
    //
    // Note: Array.every() seems faster than for-loop.
    tf.util.assert( tensorDataArray.every( this.comparator ),
      `${prefixMsg} ${tensorName}[ ${this.elementIndex} ] `
        + `( ${tensorDataArray[ this.elementIndex ]} ) should be ( ${numberArray[ this.elementIndex ]} ) `
        + `( ${tensorDataArray} ) should be ( ${numberArray} ). `
        + `${postfixMsg}` );

//!!! (2021/08/10 Remarked) Old Codes.
//         `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
//           +`( ${outputArray} ) should be ( ${outputArrayRef} ). `
//           + `${parametersDescription}` );

  }

  /**
   * @param {Asserter_Tensor_NumberArray} this
   *   - The this.numberArray[] and this.acceptableDifferenceRate will be read by this method.
   *   - The this.elementIndex will be set by this method.
   */
  static ElementComparator( value, index ) {

    let valueRef = this.numberArray[ this.elementIndex = index ];
    let delta = Math.abs( value - valueRef );

    let valueAbs = Math.abs( value );
    let valueRefAbs = Math.abs( valueRef );

    // Ratio to the smaller one.
    //
    // When one of two compared values is zero, it will always be failed if compare to the larger value (got 100% delteRate).
    let deltaRateBase = Math.min( valueAbs, valueRefAbs );

    let deltaRate;
    if ( deltaRateBase > 0 ) // Avoid divided by zero.
      deltaRate = delta / deltaRateBase; // Using ratio so that the difference will not to large even if value is large.
    else
      deltaRate = delta;

    if ( deltaRate <= this.acceptableDifferenceRate )
      return true;
    return false;
  }

}
