export { Base, Root, To };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../FloatValue.js";

/**
 * A base class for extracting and keeping weights. It composes of a Float32Array and a shape. It can
 * be used as CNN (depthwise, pointwise and bias) filter weights.
 *
 * @member {number} elementOffsetBegin
 *   The beginning position (i.e. array index) to extract from inputWeightsArray. If this value is negative, the extraction will
 * fail (i.e. ( bInitOk == false ) ).
 *
 * @member {number} elementOffsetEnd
 *   The ending position (i.e. array index) after extracting from inputWeightsArray. It is not inclusive and can be used as the
 * beginning position of next (another) extraction. It is meaningful only if ( bInitOk == true ).
 *
 * @member {number} elementExtractedCount
 *   How many weights (i.e. elements) will be extracted from inputWeightsArray. It should be a non-negative integer value.
 *
 *     - If too many elements need to be extracted (exceeds the inputWeightsArray.length) or elementExtractedCount is NaN or
 *         elementExtractedCount is negative, the extraction will fail (i.e. ( bInitOk == false ) ).
 *
 * @member {boolean} bInitOk
 *   If .init() success, it will be true.
 */
let Base = ( ParentClass = Object ) => class Base extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Weights.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Base.Pool", Base, Base.setAsConstructor );

  /**
   * Just record the begin and length without checking them. Please call extract() to finish extracting.
   */ 
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    this.bInitOk = undefined;
    this.elementOffsetEnd = undefined;
    this.elementExtractedCount = undefined;
    this.elementOffsetBegin = undefined;
    super.disposeResources();
  }

  /**
   * Determine .elementOffsetEnd according to the inputWeightArray.lnegth, .elementOffsetBegin and .elementExtractedCount.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The underlying weights source array to be extracted from. It will not be kept by this object.
   *
   * @return {boolean} Return false, if extraction failed.
   */ 
  init( inputWeightArray, elementOffsetBegin, elementExtractedCount ) {
    this.elementOffsetBegin = elementOffsetBegin;
    this.elementExtractedCount = elementExtractedCount;
    this.bInitOk = false;

    if ( Number.isNaN( this.elementExtractedCount ) )
      return false;  // Failed, if NaN.

    if ( this.elementExtractedCount < 0 )
      return false;  // Failed, if negative.

    this.elementOffsetEnd = this.elementOffsetBegin + this.elementExtractedCount;
    if ( this.elementOffsetEnd > inputWeightArray.length )
      return false;  // Failed, if out of array index range.

    this.bInitOk = true;
    return true;     // Success.
  }


//!!! (2021/12/98 Remarked) Using bounds [ -2^24, +2^24 ] seems enough.
//   /**
//    * Confirm:
//    *   - Every element is not NaN. (If it is, become 0.)
//    *   - The smallest non-zero Math.abs( element ) is 2^(-24). (i.e. If ( -2^(-24) < element < +2^(-24) ), become 0.)
//    *   - The largest Math.abs( element ) is 2^(+24).
//    *
//    * This is mainly for ensuring PointDepthPoint's output is legal float32:
//    *   - PointDepthPoint is composed of 3 convolutions: pointwise1-depthwise-pointwise2.
//    *   - Suppose every convolution has 4096 (= 2^12) input channels. (The bias is viewed as the last (i.e. 4095th) channels.)
//    *   - Suppose depthwise uses 4x4 (= 2^4) filter for every channel.
//    *   - Suppose every convolution does not have activation function (so that its result is unbounded).
//    *   - If every Math.abs( pointwise1Input ) is restected to 0 or between [ 2^(-24), 2^24 ].
//    *   - If every Math.abs( weight ) of pointwise1, depthwise, pointwise2 is restected to 0 or between [ 2^(-24), 2^24 ].
//    *   - The Math.abs( pointwise1Result ) will be restriced to 0 or between [ 2^(-(24+24)), 2^(24+24+12) ] = [ 2^(-48), 2^60 ].
//    *   - The Math.abs( depthwiseResult  ) will be restriced to 0 or between [ 2^(-(48+24)), 2^(60+24+4)  ] = [ 2^(-72), 2^88 ].
//    *   - The Math.abs( pointwise2Result ) will be restriced to 0 or between [ 2^(-(72+24)), 2^(88+24+12) ] = [ 2^(-96), 2^124 ].
//    *   - So the result is still legal float32 because Math.abs( float32 ) could be either 0 or between [ 2^(-126), 2^126 ].
//    *
//    * The 2^24 as input element should be enough for most situation:
//    *   - Color image: The R, G, B, A channels are 8 bits (2^8) individually.
//    *   - Sound track: 8 bits (2^8), or 16 bits (2^16), or 20 bits (2^20), or 24 bits (2^24). But not 32 bits (2^32)
//    *   - Unicode character code point: 21 bits (2^21).
//    *
//    *
//    * <pre>
//    *              -2^(+24)       -2^(-24)                      +2^(-24)       +2^(+24)
//    *            NEGATIVE_MIN   NEGATIVE_MAX        0         POSITIVE_MIN   POSITIVE_MAX
//    *   --------------|--------------|--------------|--------------|--------------|--------------
//    *
//    * Restricted to:
//    *                 |--------------|00000000000000000000000000000|--------------|
//    * </pre>
//    *
//    *
//    * @param {Float32Array} source
//    *   The source Float32Array.
//    *
//    * @return {Float32Array}
//    *   Return a copy of source. Every element (float32):
//    *     - If ( Number.isNaN( element ) == true ), let it become 0.
//    *     - If ( element != 0 ), Math.abs( element ) will be restricted between [ 2^(-24), 2^24 ].
//    *     - ( Math.sign( element ) * Math.abs( element ) ) will be restricted between [ -2^(24), 2^24 ].
//    */
//   static Float32Array_CloneLegal( sourceArray ) {
//     const POSITIVE_MIN = Math.pow( 2, -24 );
//     const POSITIVE_MAX = Math.pow( 2, +24 );
//     const NEGATIVE_MIN = - POSITIVE_MAX; // - Math.pow( 2, +24 )
//     const NEGATIVE_MAX = - POSITIVE_MIN; // - Math.pow( 2, -24 )
//
//     let resultArray = new Float32Array( sourceArray.length );
//     for ( let i = 0; i < sourceArray.length; ++i ) {
//       let element = sourceArray[ i ];
//
//       let restricted;
//       if ( Number.isNaN( element ) ) {
//         restricted = 0;
//
//       } else if ( element >= POSITIVE_MIN ) {
//         if ( element > POSITIVE_MAX )
//           restricted = POSITIVE_MAX;
//         else
//           restricted = element;
//
//       } else if ( element <= NEGATIVE_MAX ) {
//         if ( element < NEGATIVE_MIN )
//           restricted = NEGATIVE_MIN;
//         else
//           restricted = element;
//
//       } else { // ( NEGATIVE_MAX < element < POSITIVE_MIN ) (Note: Zero is inside.)
//         restricted = 0;
//       }
//
//       resultArray[ i ] = restricted;
//     }
//     return resultArray;
//   }

}


/**
 * Almost the same as Weights.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Weights.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {

  /**
   * Used as default Weights.Root provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Root.Pool", Base, Base.setAsConstructor );

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
 */
Base.ValueBounds = new FloatValue.Bounds( -( 2 ** 24 ), +( 2 ** 24 ) );


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

