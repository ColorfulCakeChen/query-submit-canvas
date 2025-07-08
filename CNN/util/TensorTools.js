export { Comparator, Asserter_Equal };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as FloatValue from "../Unpacker/FloatValue.js";

/**
 *
 */
class Comparator {

  /**
   * @return {boolean}
   * Return true, if two arrays of tensors are equal by value.
   */
  static isTensorArrayEqual( tensorArray1, tensorArray2 ) {

    if ( tensorArray1 === tensorArray2 )
      return true;

    if ( tensorArray1 == null || tensorArray2 == null )
      return false;

    if ( tensorArray1.length !== tensorArray2.length )
      return false;

    // Compare every element of each tensor.
    for ( let i = 0; i < tensorArray1.length; ++i ) {
      let allElementEqual = tf.tidy(
        "TensorTools.Comparator.isTensorArrayEqual", () => {

        let everyElementEqualTensor1d
          = tensorArray1[ i ].equal( tensorArray2[ i ] );

        let allElementEqualTensor1d
          = everyElementEqualTensor1d.all();

        return allElementEqualTensor1d.arraySync(); // 0: false. 1: true.
      });

      if ( !allElementEqual )
        return false;
    }

    return true;
  }

  /**
   * @param {tf.tensor3d} aTensor3d
   *   The tensor3d to be verified along every channel.
   *
   * @param {FloatValue.BoundsArray} aBoundsArray
   *   Assert every pixel whether inside aBoundsArray of its channel.
   */
  static assert_Tensor3d_byBoundsArray( aTensor3d, aBoundsArray ) {
    const funcNameInMessage = "assert_Tensor3d_byBoundsArray";

    if ( !aTensor3d )
      throw Error( `TensorTools.Comparator.${funcNameInMessage}(): `
        + `aTensor3d ( ${aTensor3d} ) should not be null or undefined.`
      );

    const shape = aTensor3d.shape;
    if ( !shape )
      throw Error( `TensorTools.Comparator.${funcNameInMessage}(): `
        + `aTensor3d.shape ( ${shape} ) should not be null or undefined.`
      );

    if ( shape.length != 3 )
      throw Error( `TensorTools.Comparator.${funcNameInMessage}(): `
        + `aTensor3d.shape = [ ${shape} ], `
        + `aTensor3d.shape.length ( ${shape.length} ) should be 3.`
      );

    const dataArray = aTensor3d.dataSync();
    if ( !dataArray )
      throw Error( `TensorTools.Comparator.${funcNameInMessage}(): `
        + `Failed to get dataArray ( ${dataArray} )`
        + `from aTensor3d ( ${aTensor3d} ).`
      );

    const [ height, width, depth ] = shape;
    Comparator.assert_NumberArray_byBoundsArray(
      dataArray,
      height, width, depth,
      aBoundsArray
     )
  }

  /**
   * @param {number[]} dataArray
   *   The 1d number array (which will be viewed as an 2d image with dimnsion
   * ( height, width, depth ).
   *
   * @param {number} height
   *   The image height for interpreting dataArray[].
   *
   * @param {number} width
   *   The image width for interpreting dataArray[].
   *
   * @param {number} depth
   *   The image deoth (channels) for interpreting dataArray[].
   *
   * @param {FloatValue.BoundsArray} aBoundsArray
   *   Assert every pixel whether inside aBoundsArray of its channel.
   */
  static assert_NumberArray_byBoundsArray(
    dataArray,
    height, width, depth,
    aBoundsArray ) {

    const funcNameInMessage = "assert_NumberArray_byBoundsArray";

    //!!! (2022/08/12 Temp Added) Temp skip checking for finding out real value.
    //return;

    let pixelValue;
    let i = 0;
    for ( let y = 0; y < height; ++y ) {
      for ( let x = 0; x < width; ++x ) {
        for ( let c = 0; c < depth; ++c, ++i ) {
          pixelValue = dataArray[ i ];
          if ( !( aBoundsArray.is_one_contain_N( c, pixelValue ) ) ) {
            debugger;
            throw Error( `TensorTools.Comparator.${funcNameInMessage}(): `
              + `at ( x, y, c ) = ( ${x}, ${y}, ${c} ), `
              + `.dataArray[ ${i} ] = ( ${pixelValue} ) should be in bounds `
              + `[ ${aBoundsArray.lowers[ c ]}, ${aBoundsArray.uppers[ c ]} ].`
            );
          }
        }
      }
    }
  }

}


/**
 * Assert a tensor whether equals to a number array.
 */
class Asserter_Equal extends Recyclable.Root {

  /**
   * Used as default TensorTools.Asserter_Equal provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "TensorTools.Asserter_Equal.Pool",
    Asserter_Equal );

  /**
   * If ( differenceRate <= acceptableDifferenceRate )
   * or ( difference <= acceptableDifference ), two value are viewed as the
   * same.
   *
   * Because floating-point accumulated error of float32 (GPU) and float64
   * (CPU) is different, a little difference should be allowed. Otherwise, the
   * comparison may hardly to pass this check.
   *
   * @param {number} acceptableDifferenceRate
   *   How many difference (in ratio) between the numberArray and numberArray
   * (per element) is acceptable. Useful for large value. Default is 0.01 (i.e.
   * 1% difference is allowed).
   *
   * @param {number} acceptableDifference
   *   How many difference (in absolute value) between the numberArray and
   * numberArray (per element) is acceptable. Useful for small value. Default
   * is 0.001.
   */
  constructor(
    acceptableDifferenceRate = 0.01, acceptableDifference = 0.001 ) {
    super();
    this.#setAsConstructor_self(
      acceptableDifferenceRate, acceptableDifference );
  }

  /** @override */
  setAsConstructor(
    acceptableDifferenceRate = 0.01, acceptableDifference = 0.001 ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      acceptableDifferenceRate, acceptableDifference );
  }

  /**  */
  #setAsConstructor_self(
    acceptableDifferenceRate = 0.01, acceptableDifference = 0.001 ) {

    this.acceptableDifferenceRate = Math.abs( acceptableDifferenceRate );
    this.acceptableDifference = Math.abs( acceptableDifference );
    this.comparator = Asserter_Equal.ElementComparator.bind( this );

    // Used by assert_Number_Number().
    this.lhsNumberArrayDefault = Recyclable.Array.Pool.get_or_create_by( 1 );
    this.rhsNumberArrayDefault = Recyclable.Array.Pool.get_or_create_by( 1 );
  }

  /** @override */
  disposeResources() {
    this.rhsNumberArrayDefault.disposeResources_and_recycleToPool();
    this.rhsNumberArrayDefault = null;

    this.lhsNumberArrayDefault.disposeResources_and_recycleToPool();
    this.lhsNumberArrayDefault = null;

    super.disposeResources();
  }

  /**
   *
   * @param {number[]} lhsNumberArray
   *   The number array to be checked.
   *
   * @param {number[]} rhsNumberArray
   *   The number array to be compared against lhsNumberArray.
   *
   * @param {Object} prefixMsg
   *   Its .toString() will be displayed at the beginning when comparison
   * failed.
   *
   * @param {Object} lhsNumberArrayName
   *   Its .toString() will be displayed for the lhsNumberArray when comparison
   * failed.
   *
   * @param {Object} rhsNumberArrayName
   *   Its .toString() will be displayed for the rhsNumberArray when comparison
   * failed.
   *
   * @param {Object} postfixMsg
   *   Its .toString() will be displayed at the tail when comparison failed.
   */
  assert_NumberArray_NumberArray(
    lhsNumberArray, rhsNumberArray,
    prefixMsg, lhsNumberArrayName, rhsNumberArrayName, postfixMsg ) {

    // Check both null or non-null.
    if ( ( lhsNumberArray == null ) != ( rhsNumberArray == null ) )
      throw Error( `${prefixMsg} `
        + `${lhsNumberArrayName} ( ${lhsNumberArray} ) `
        + `and ${rhsNumberArrayName} ( ${rhsNumberArray} ) `
        + `should be both null or non-null. ${postfixMsg}` );

    if ( !lhsNumberArray )
      return; // Since null, no element need to be compared futher.

    // Check both length.
    if ( lhsNumberArray.length != rhsNumberArray.length )
      throw Error( `${prefixMsg} `
        + `${lhsNumberArrayName} length ( ${lhsNumberArray.length} ) `
        + `should be ( ${rhsNumberArray.length} ). ${postfixMsg}` );

    this.rhsNumberArray = rhsNumberArray; // For ElementComparator() to access.

    // Check both elements.
    //
    // Note: Array.every() seems faster than for-loop. However, if an element
    //       is empty slot, the element will be skipped (i.e. not checked). So,
    //       use for-loop instead.
    const elementCount = lhsNumberArray.length;
    for ( let i = 0; i < elementCount; ++i ) {
      if ( !( this.comparator( lhsNumberArray[ i ], i ) ) )
        throw Error( `${prefixMsg} `
          + `${lhsNumberArrayName}[ ${this.elementIndex} ] `
          + `( ${lhsNumberArray[ this.elementIndex ]} ) `
          + `should be ( ${rhsNumberArray[ this.elementIndex ]} ). `
          + `[ ${lhsNumberArray} ] should be [ ${rhsNumberArray} ]. `
          + `${postfixMsg}` );
    }
  }

  /**
   *
   * @param {number} lhsNumber
   *   The number to be checked.
   *
   * @param {number} rhsNumber
   *   The number to be compared against lhsNumber.
   *
   * @param {Object} prefixMsg
   *   Its .toString() will be displayed at the beginning when comparison
   * failed.
   *
   * @param {Object} lhsNumberName
   *   Its .toString() will be displayed for the lhsNumber when comparison
   * failed.
   *
   * @param {Object} rhsNumberName
   *   Its .toString() will be displayed for the rhsNumber when comparison
   * failed.
   *
   * @param {Object} postfixMsg
   *   Its .toString() will be displayed at the tail when comparison failed.
   */
  assert_Number_Number(
    lhsNumber, rhsNumber,
    prefixMsg, lhsNumberName, rhsNumberName, postfixMsg ) {

    this.lhsNumberArrayDefault[ 0 ] = lhsNumber;
    this.rhsNumberArrayDefault[ 0 ] = rhsNumber;

    this.assert_NumberArray_NumberArray(
      this.lhsNumberArrayDefault, this.rhsNumberArrayDefault,
      prefixMsg, lhsNumberName, rhsNumberName, postfixMsg );
  }

  /**
   *
   * @param {tf.tensor} tensor
   *   The tf.tensor to be checked.
   *
   * @param {number[]} numberArray
   *   The number to be compared against tensor's data.
   *
   * @param {Object} prefixMsg
   *   Its .toString() will be displayed at the beginning when comparison
   * failed.
   *
   * @param {Object} tensorName
   *   Its .toString() will be displayed for the tensor when comparison
   * failed.
   *
   * @param {Object} numberArrayName
   *   Its .toString() will be displayed for the numberArray when comparison
   * failed.
   *
   * @param {Object} postfixMsg
   *   Its .toString() will be displayed at the tail when comparison failed.
   */
  assert_Tensor_NumberArray( tensor, rhsNumberArray,
    prefixMsg, tensorName, rhsNumberArrayName, postfixMsg ) {

    let tensorDataArray = null;
    if ( tensor ) {
      tensorDataArray = tensor.dataSync();
    }

    this.assert_NumberArray_NumberArray(
      tensorDataArray, rhsNumberArray,
      prefixMsg, tensorName, rhsNumberArrayName, postfixMsg );
  }

  /**
   * @param {Asserter_Tensor_NumberArray} this
   *   - The this.rhsNumberArray[] and this.acceptableDifferenceRate will be
   *       read by this method.
   *   - The this.elementIndex will be set by this method.
   */
  static ElementComparator( value, index ) {

    let valueRef = this.rhsNumberArray[ this.elementIndex = index ];

    // 0. Confirm delta is positive (or zero).
    //
    // Note: Sometimes, value and valueRef have different sign (i.e. one is
    //       positive, the other is negative).
    let delta;
    if ( value > valueRef ) {
      delta = value - valueRef;
    } else {
      delta = valueRef - value;
    }

    // 1. by value difference.
    if ( delta <= this.acceptableDifference )
      return true;

    // 2. by value difference rate.
    {
      let valueAbs = Math.abs( value );
      let valueRefAbs = Math.abs( valueRef );

      // Ratio to the larger one (so that the ratio will be smaller.)
      //
      // Q: Why not compare to smaller one?
      // A: The smaller one may be zero which result in infinity delteRate.
      //    That is worse.
      let deltaRateBase = Math.max( valueAbs, valueRefAbs );

      let deltaRate;
      if ( deltaRateBase > 0 ) // Avoid divided by zero.
        // Using ratio so that the difference will not too large even if value
        // is large.
        deltaRate = delta / deltaRateBase;
      else
        deltaRate = delta;

      if ( deltaRate <= this.acceptableDifferenceRate )
        return true;
    }

    return false;
  }

}
