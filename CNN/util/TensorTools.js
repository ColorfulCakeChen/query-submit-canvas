export { Comparator };

/**
 * An channel shuffler accepts a list of tensor3d with same size (height, width, channel) and outputs a shuffled
 * (re-grouped) list tensor3d.
 *
 * Usually, the output tensor3d list length will be the same as input tensor3d list. Even more, the size of 
 * every output tensor3d will also be the same as input tensor3d. However, the order of the tensor3d's channels
 * (the 3rd dimension) are different.
 *
 * This is the Channel-Shuffle operation of the ShuffleNetV2 neural network.
 *
 *
 *
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from init()'s concatenatedShape and outputGroupCount.
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
 *
 */
class Asserter {
//!!! ...unfinished... (2021/08/10)

  /**
   * Assert a tensor whether equals to the number array.
   *
   * @param {tf.tensor} tensor
   *   The tf.tensor to be checked.
   *
   * @param {number[]} numberArray
   *   The number to be compared against tensor's data.
   *
   * @param {number} acceptableDifferenceRate
   *   How many difference (in ratio) between the tensor and numberArray (per element) is acceptable. Because floating-point
   * accumulated error of float32 (GPU) and float64 (CPU) is different, a little difference should be allowed. Otherwise,
   * the comparison may hardly to pass this check.
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
  static assert_Tensor_NumberArray( tensor, numberArray, acceptableDifferenceRate, prefixMsg, tensorName, numberArrayName, postfixMsg ) {

    let tensorDataArray = null;
    if ( tensor ) {
      tensorDataArray = tensor.dataSync();
    }

    // Checking both null or non-null.
    tf.util.assert( ( tensorDataArray == null ) == ( numberArray == null ),
      `${prefixMsg} ${tensorName} ( ${tensorDataArray} ) and ${numberArrayName} ( ${numberArray} ) should be both null or non-null. ${postfixMsg}` );

    if ( tensorDataArray ) {

      // Checking both length.
      tf.util.assert( tensorDataArray.length == numberArray.length,
      `${prefixMsg} ${tensorName} length ( ${tensorDataArray.length} ) should be ( ${numberArray.length} ). ${postfixMsg}` );

          // Because floating-point accumulated error of float32 (GPU) and float64 (CPU) is different (especially activation function
          // is one of SIGMOID, TANH, SIN, COS), only some digits after decimal are compared. Otherwise, they may not pass this test.
          let elementIndex;
          function ElementComparator( value, index ) {
            let valueRef = outputArrayRef[ elementIndex = index ];
            let delta = Math.abs( value - valueRef );

            let valueAbs = Math.abs( value );
            let valueRefAbs = Math.abs( valueRef );

            // Compare to smaller one.
            //
            // When one of compared values is zero, it will always be failed if compare to the larger value (got 100% delteRate).
            let deltaRateBase = Math.min( valueAbs, valueRefAbs );

            let deltaRate;
            if ( deltaRateBase > 0 ) // Avoid divided by zero.
              deltaRate = delta / deltaRateBase; // Using ratio so that the difference will not to large even if value is large.
            else
              deltaRate = delta;

            if ( deltaRate <= acceptableDifferenceRate )
              return true;
            return false;
          }

          tf.util.assert( outputArray.every( ElementComparator ),
            `PointDepthPoint output${i}[ ${elementIndex} ] ( ${outputArray[ elementIndex ]} ) should be ( ${outputArrayRef[ elementIndex ]} ) `
              +`( ${outputArray} ) should be ( ${outputArrayRef} ). `
              + `${parametersDescription}` );
        }
      }

    }
  }

}
