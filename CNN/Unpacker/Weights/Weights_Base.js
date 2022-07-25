export { Weights_Base as Base, Root, To };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../FloatValue.js";

/**
 * A base class for weights extracting. It composes of a beninning and an ending array index.
 *
 * @member {number} weightElementOffsetBegin
 *   The beginning position (i.e. array index) to extract from inputWeightsArray. If this value is negative, the extraction will
 * fail (i.e. ( bInitOk == false ) ).
 *
 * @member {number} weightElementOffsetEnd
 *   The ending position (i.e. array index) after extracting from inputWeightsArray. It is not inclusive and can be used as the
 * beginning position of next (another) extraction. It is meaningful only if ( bInitOk == true ).
 *
 * @member {number} weightElementExtractedCount
 *   How many weights (i.e. elements) will be extracted from inputWeightsArray. It should be a non-negative integer value.
 *
 *     - If too many elements need to be extracted (exceeds the inputWeightsArray.length) or weightElementExtractedCount is NaN or
 *         weightElementExtractedCount is negative, the extraction will fail (i.e. ( bInitOk == false ) ).
 *
 * @member {boolean} bInitOk
 *   If .init() success, it will be true.
 */
let Weights_Base = ( ParentClass = Object ) => class Weights_Base extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Weights.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Base.Pool", Weights_Base, Weights_Base.setAsConstructor );

  /**
   * Just record the begin and length without checking them. Please call extract() to finish extracting.
   */ 
  constructor( ...restArgs ) {
    super( ...restArgs );
    Weights_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( ...restArgs );
    Weights_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    this.bInitOk = undefined;
    this.weightElementOffsetEnd = undefined;
    this.weightElementExtractedCount = undefined;
    this.weightElementOffsetBegin = undefined;
    super.disposeResources();
  }

  /**
   * Determine .weightElementOffsetEnd according to the inputWeightArray.lnegth, .weightElementOffsetBegin and .weightElementExtractedCount.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The underlying weights source array to be extracted from. It will not be kept by this object.
   *
   * @return {boolean} Return false, if extraction failed.
   */ 
  init( inputWeightArray, weightElementOffsetBegin, weightElementExtractedCount ) {
    this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.weightElementExtractedCount = weightElementExtractedCount;
    this.bInitOk = false;

    if ( Number.isNaN( this.weightElementExtractedCount ) )
      return false;  // Failed, if NaN.

    if ( this.weightElementExtractedCount < 0 )
      return false;  // Failed, if negative.

    this.weightElementOffsetEnd = this.weightElementOffsetBegin + this.weightElementExtractedCount;
    if ( this.weightElementOffsetEnd > inputWeightArray.length )
      return false;  // Failed, if out of array index range.

    this.bInitOk = true;
    return true;     // Success.
  }

}


/**
 * Almost the same as Weights.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Weights.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Weights_Base() {
}


//!!! ...unfinished... (2022/01/10)
/*
 * When ( x < 0.0000001 ), the tf.tanh( x ) will be 0.
 * That is, the precision of tf.tanh() may be 0.0000001 (= 1e-7 ).
 *
 * Consider the ActivationEscaping inputDomainLinear of tanh() is [ -0.005, +0.005 ] simultaneously. The value bounds of result
 * after filter-bias (no matter pointwise or depthwise) should be compatible with [ -0.005, +0.005 ] with precision 0.0000001 (= 1e-7 ).
 *
 * For example,
 *   - [ -0.005, +0.005 ] with precision 0.0000001 (= 1e-7 ).
 *   - [ -0.5, +0.5 ] with precision 0.00001 (= 1e-5 ).
 *   - [ -5, +5 ] with precision 0.0001 (= 1e-4 ).
 *   - [ -50, +50 ] with precision 0.001 (= 1e-3 ).
 *   - [ -500, +500 ] with precision 0.01 (= 1e-2 ).
 *   - [ -5000, +5000 ] with precision 0.1 (= 1e-1 ).
 *   - [ -50000, +50000 ] with precision 1 (= 1e+0 ).
 *   - [ -5e+4, +5e+4 ] with precision 1 (= 1e+0 ).
 *   - [ 0, +100000 ] with precision 1 (= 1e+0 ).
 *   - [ 0, +1e+5 ] with precision 1 (= 1e+0 ).
 *
 *
 *
 *
 *
 * For this reason, the Weights.Base.ValueBounds may be more less than [ -( 2 ** 24 ), +( 2 ** 24 ) ].
 * Perhaps, [ -1, +1 ] is better.?
 *
 */

/**
 * This is mainly for ensuring Block's output is legal float32:
 *   - Block is composed of 3 convolutions: pointwise1-depthwise-pointwise2.
 *   - Suppose every convolution has 4096 (= 2^12) input channels. (The bias is viewed as the last (i.e. 4095th) channels.)
 *   - Suppose depthwise uses 4x4 (= 2^4) filter for every channel.
 *   - Suppose every convolution does not have activation function (so that its result is unbounded).
 *   - If every element of pointwise1Input is bounds to [ -2^24, +2^24 ].
 *   - If every element of weights of pointwise1, depthwise, pointwise2 is bounds to [ -2^24, +2^24 ].
 *   - Every element of pointwise1Result will be bounds to [ -2^(24+24+12), +2^(24+24+12) ] = [ -2^60,  +2^60  ].
 *   - Every element of depthwiseResult  will be bounds to [ -2^(60+24+4),  +2^(60+24+4)  ] = [ -2^88,  +2^88  ].
 *   - Every element of pointwise2Result will be bounds to [ -2^(88+24+12), +2^(88+24+12) ] = [ -2^124, +2^124 ].
 *   - So the result is still legal float32 (which could represent floating-point value between [ -2^126, +2^126 ]).
 *
 * The 2^24 as input element should be enough for most situation:
 *   - Color image: The R, G, B, A channels are 8 bits (2^8) individually.
 *   - Sound track: 8 bits (2^8), or 16 bits (2^16), or 20 bits (2^20), or 24 bits (2^24). But not 32 bits (2^32)
 *   - Unicode character code point: 21 bits (2^21).
 *
 * However, a large value bounds will generate more floating-point accumulated error especially when activation-escaping in
 * ShuffleNetV2_byMobileNetV1. So use a just enough value bounds is better than always 2^24. For example,
 *   - Color image: The R, G, B, A channels should use 8 bits (2^8) as value bounds.
 *   - Sound track: should use 8 bits (2^8), or 16 bits (2^16), or 20 bits (2^20), or 24 bits (2^24).
 *   - Unicode character code point: should use 21 bits (2^21).
 *
 */
Weights_Base.ValueBounds = new FloatValue.Bounds( -( 2 ** 24 ), +( 2 ** 24 ) );


/**
 * Provides static methods for converting weight to parameter.
 */
class To {

  /** @return {number} Return the absolute value of the trucated value (i.e. integer). */
  static IntegerZeroPositive( v ) {
    return Math.abs( Math.trunc( v ) );
  }

  /**
   * @param {any[]} lookUpArray
   *   The value will be converted into an integer between [ 0, lookUpArray.length ). Use it as array index.
   * Return lookUpArray[ index ].
   *
   * @return {any}
   *   Convert number value into an integer between [ 0, lookUpArray.length ). Use it as array index. Return
   * the looked up element value.
   */
  static ArrayElement( value, lookUpArray ) {
    let i = To.IntegerZeroPositive( value ) % lookUpArray.length;
    return lookUpArray[ i ];
  }

}

