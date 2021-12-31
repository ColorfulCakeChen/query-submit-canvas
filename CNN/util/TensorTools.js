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

    // Used by assert_Number_Number().
    this.lhsNumberArrayDefault = [ 0 ];
    this.rhsNumberArrayDefault = [ 0 ];
  }

  /**
   *
   * @param {number[]} lhsNumberArray
   *   The number array to be checked.
   *
   * @param {number[]} rhsNumberArray
   *   The number array to be compared against lhsNumberArray.
   *
   * @param {string} prefixMsg
   *   The text to be displayed at the beginning when comparison failed.
   *
   * @param {string} lhsNumberArrayName
   *   The text to be displayed for the lhsNumberArray when comparison failed.
   *
   * @param {string} rhsNumberArrayName
   *   The text to be displayed for the rhsNumberArray when comparison failed.
   *
   * @param {string} postfixMsg
   *   The text to be displayed at the tail when comparison failed.
   */
  assert_NumberArray_NumberArray( lhsNumberArray, rhsNumberArray, prefixMsg, lhsNumberArrayName, rhsNumberArrayName, postfixMsg ) {

    // Check both null or non-null.
    tf.util.assert( ( lhsNumberArray == null ) == ( rhsNumberArray == null ),
      `${prefixMsg} ${lhsNumberArrayName} ( ${lhsNumberArray} ) and ${rhsNumberArrayName} ( ${rhsNumberArray} ) `
        + `should be both null or non-null. ${postfixMsg}` );

    if ( !lhsNumberArray )
      return; // Since null, no element need to be compared futher.

    // Check both length.
    tf.util.assert( lhsNumberArray.length == rhsNumberArray.length,
    `${prefixMsg} ${lhsNumberArrayName} length ( ${lhsNumberArray.length} ) should be ( ${rhsNumberArray.length} ). ${postfixMsg}` );

    this.rhsNumberArray = rhsNumberArray; // For ElementComparator() to access.

    // Check both elements.
    //
    // Note: Array.every() seems faster than for-loop.
    tf.util.assert( lhsNumberArray.every( this.comparator ),
      `${prefixMsg} ${lhsNumberArrayName}[ ${this.elementIndex} ] `
        + `( ${lhsNumberArray[ this.elementIndex ]} ) should be ( ${rhsNumberArray[ this.elementIndex ]} ) `
        + `( ${lhsNumberArray} ) should be ( ${rhsNumberArray} ). `
        + `${postfixMsg}` );

//!!! (2021/08/10 Remarked) Old Codes.
//         `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
//           +`( ${outputArray} ) should be ( ${outputArrayRef} ). `
//           + `${parametersDescription}` );

  }

  /**
   *
   * @param {number} lhsNumber
   *   The number to be checked.
   *
   * @param {number} rhsNumber
   *   The number to be compared against lhsNumber.
   *
   * @param {string} prefixMsg
   *   The text to be displayed at the beginning when comparison failed.
   *
   * @param {string} lhsNumberName
   *   The text to be displayed for the lhsNumber when comparison failed.
   *
   * @param {string} rhsNumberName
   *   The text to be displayed for the rhsNumber when comparison failed.
   *
   * @param {string} postfixMsg
   *   The text to be displayed at the tail when comparison failed.
   */
  assert_Number_Number( lhsNumber, rhsNumber, prefixMsg, lhsNumberName, rhsNumberName, postfixMsg ) {
    this.lhsNumberArrayDefault[ 0 ] = lhsNumber;
    this.rhsNumberArrayDefault[ 0 ] = rhsNumber;

    this.assert_NumberArray_NumberArray(
      this.lhsNumberArrayDefault, this.rhsNumberArrayDefault, prefixMsg, lhsNumberName, rhsNumberName, postfixMsg );
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
  assert_Tensor_NumberArray( tensor, rhsNumberArray, prefixMsg, tensorName, rhsNumberArrayName, postfixMsg ) {

    let tensorDataArray = null;
    if ( tensor ) {
      tensorDataArray = tensor.dataSync();
    }

    this.assert_NumberArray_NumberArray( tensorDataArray, rhsNumberArray, prefixMsg, tensorName, rhsNumberArrayName, postfixMsg );

//!!! (2021/12/31 Remarked) use assert_NumberArray_NumberArray() instead.
//     // Check both null or non-null.
//     tf.util.assert( ( tensorDataArray == null ) == ( numberArray == null ),
//       `${prefixMsg} ${tensorName} ( ${tensorDataArray} ) and ${numberArrayName} ( ${numberArray} ) should be both null or non-null. ${postfixMsg}` );
//
//     if ( !tensorDataArray )
//       return; // Since null, no element need to be compared futher.
//
//     // Check both length.
//     tf.util.assert( tensorDataArray.length == numberArray.length,
//     `${prefixMsg} ${tensorName} length ( ${tensorDataArray.length} ) should be ( ${numberArray.length} ). ${postfixMsg}` );
//
//     this.numberArray = numberArray; // For ElementComparator() to access.
//
//     // Check both elements.
//     //
//     // Note: Array.every() seems faster than for-loop.
//     tf.util.assert( tensorDataArray.every( this.comparator ),
//       `${prefixMsg} ${tensorName}[ ${this.elementIndex} ] `
//         + `( ${tensorDataArray[ this.elementIndex ]} ) should be ( ${numberArray[ this.elementIndex ]} ) `
//         + `( ${tensorDataArray} ) should be ( ${numberArray} ). `
//         + `${postfixMsg}` );
//
// //!!! (2021/08/10 Remarked) Old Codes.
// //         `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
// //           +`( ${outputArray} ) should be ( ${outputArrayRef} ). `
// //           + `${parametersDescription}` );

  }

  /**
   * @param {Asserter_Tensor_NumberArray} this
   *   - The this.rhsNumberArray[] and this.acceptableDifferenceRate will be read by this method.
   *   - The this.elementIndex will be set by this method.
   */
  static ElementComparator( value, index ) {

    let valueRef = this.rhsNumberArray[ this.elementIndex = index ];
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
