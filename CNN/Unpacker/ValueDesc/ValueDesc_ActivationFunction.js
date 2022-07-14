export { ActivationFunction };

import { Int } from "./ValueDesc_Base.js";
import * as Weights from "../Weights.js";
import * as FloatValue from "../FloatValue.js";

/**
 * Describe activation function parameter's id, range, name.
 *
 * The activation function ActivationFunction.Info.pfn( x ) is almost linear when x is inside inputDomainLinear. Its output is
 * outputRangeLinear.
 *
 *   - CLIP_BY_VALUE_N2_P2( [ -2, +2 ] ) = [ -2, +2 ]
 *   - CLIP_BY_VALUE_N3_P3( [ -3, +3 ] ) = [ -3, +3 ]
 *   - RELU6( [ 0, 6 ] ) = [ 0, 6 ]
 *   - TANH ( [ -0.005, +0.005 ] ) = [ -0.005, +0.005]
 *   - SIN  ( [ -0.005, +0.005 ] ) = [ -0.005, +0.005]
 *   - COS  ( [ -( ( PI / 2 ) + 0.005 ), -( ( PI / 2 ) - 0.005 ) ] ) =  [ -0.005, +0.005 ]
 *   - SIGMOID ( [ -0.125, +0.125 ] ) = [ +0.468, +0.532 ]
 *   - RELU ( 0, +Infinity ) = [ 0, +Infinity ]
 *   - SOFTPLUS ( +5, +Infinity ) = [ +5, +Infinity ]
 *
 *
 * Note:
 *   - NONE: Beware. It easily results in infinity value because it does not have upper bound.
 *   - RELU: Beware. It easily results in infinity value because it does not have upper bound.
 *   - SOFTPLUS: Avoid. Backend WASM does not support it.
 *   - ERF: Avoid. Backend WASM does not support it.
 *

//!!! ...unfinished... (2022/07/14)
// Could [ -2, +2 ] be better than [ -3, +3 ]? Does two's power reduce floating-point accumulated error (after ShuffleNetV2_byMobileNetV2
// pass-through by scaling and un-scaling repeately)?

//!!! ...unfinished... (2022/01/11)
// What about: (tf.clipByValue() is also supported by WASM)
//   - tf.clipByValue( -1, +1 )?
//   - tf.clipByValue( -2, +2 )?
//   - tf.clipByValue( -3, +3 )?
//   - tf.clipByValue( -64, +64 )?
//   - tf.clipByValue( -128, +128 )?

 *   - CLIP_BY_VALUE, TANH, SIN, ERF are good if pass-through by only scale (i.e. without translate) is needed. Because the output
 *       range of them includes both negative value and positive value near the origin point. (On the other hand, RELU, RELU6 are
 *       not good for this purpose.)
 *
 *
 *
 * Q1: Since activation by clipByValue() is enough, why not just using saturated integer for convolution?
 * A1: Although saturated integer could achieve clipByValue automatically without activation function (i.e. less computation time).
 *     It has some disadvantages:
 *
 *      - It can not escape saturation (i.e. escape activation) by scaling. The reason is that needs multiply a number less
 *         than one which can not be represented by integer (i.e. floatig-point number is required).
 *
 *      - It may not be saturated (i.e. activated) by bias. When the input value is the minimum value (e.g. -255), adding a
 *         bias (even if adding the maximum value 255) can not saturate it to maximum value (e.g. +255).
 *
 * On the other hand, floating-point number has already been similar to a kind of saturated number (i.e. maximum is saturated to
 * +Infinity, and minimum is saturated to -Infinity).
 *
 *
 *
 * Q2: Why use CLIP_BY_VALUE_N2_P2 instead of CLIP_BY_VALUE_N3_P3?
 * A2: To reduce floating-point accumulated error.
 *
 * CLIP_BY_VALUE_N3_P3:
 *
 *   - Advantage: It has larger inputDomainLinear so that activation-escaping could use a larger scale. This reduces floating-point
 *       truncation error.
 *
 *   - Disadvantage: Its activated value (i.e. 3) seems harder to become any other value by a floating-point finite scaling.
 *       This increases the floating-point accumulated error. For example, in order to let 3 become 100, a scale 33.333...
 *       should be used. However, 33.3 can not be represented by a finite floating-point number.
 *
 * CLIP_BY_VALUE_N2_P2:
 *
 *   - Disadvantage: It has smaller inputDomainLinear [ -2, +2 ] (than CLIP_BY_VALUE_N3_P3 [ -3, +3 ]) so that activation-escaping
 *       needs use a smaller scale. This increases floating-point truncation error.
 *
 *   - Advantage: Its activated value (i.e. 2) is easier to become any other value by a floating-point finite scaling.
 *       This reduces the floating-point accumulated error.
 *
 *
 */
class ActivationFunction extends Int {

  constructor() {

//!!! (2022/07/05 Remarked) For speed-up testing.
//    super( 0, 8,
//      [ "NONE",  "CLIP_BY_VALUE_N2_P2", "CLIP_BY_VALUE_N3_P3", "TANH",  "SIN", "RELU6",  "COS",  "SIGMOID", "RELU" ], //  "SOFTPLUS" ],

    super( 0, 1,
      [ "NONE",  "CLIP_BY_VALUE_N2_P2" ],

      [
        new ActivationFunction.Info( 0, null, null, null, null, null ),

        new ActivationFunction.Info( 1, ActivationFunction.clipByValue_Negative2_Positive2,
          ActivationFunction.reference_clipByValue_Negative2_Positive2,
          new FloatValue.Bounds( -2, +2 ), new FloatValue.Bounds( -2, +2 ), new FloatValue.Bounds( -2, +2 ) ),

//!!! (2022/07/05 Remarked) For speed-up testing.
/*
        new ActivationFunction.Info( 2, ActivationFunction.clipByValue_Negative3_Positive3,
          ActivationFunction.reference_clipByValue_Negative3_Positive3,
          new FloatValue.Bounds( -3, +3 ), new FloatValue.Bounds( -3, +3 ), new FloatValue.Bounds( -3, +3 ) ),

        new ActivationFunction.Info( 3, tf.tanh, ActivationFunction.reference_tanh,
          new FloatValue.Bounds( -1, +1 ), new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 4, tf.sin, ActivationFunction.reference_sin,
          new FloatValue.Bounds( -1, +1 ), new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 5, tf.relu6, ActivationFunction.reference_relu6,
          new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ) ),

        new ActivationFunction.Info( 6, tf.cos, ActivationFunction.reference_cos,
          new FloatValue.Bounds( -1, +1 ),
          new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.005 ), -( ( Math.PI / 2 ) - 0.005 ) ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 7, tf.sigmoid, ActivationFunction.reference_sigmoid,
          new FloatValue.Bounds( 0, 1 ), new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( +0.468, +0.532 ) ),

        // (2021/12/09)
        // The input linear domain and output range of RELU are [ 0, +Infinity ]. However, it is not so friendly to interact with Infinity
        // because the results may be Infinity or even NaN. This is more obvious for scale-translate into linear domain in PointDepthPoint.
        // So, the RELU is excluded from the activation function list.
        //
        // (2022/01/11)
        // However, if the BoundsArraySet.afterActivation is calculate by .clamp_byXxx() (not by set_byXxx()), the Infinity bounds is
        // not a problem.
        new ActivationFunction.Info( 8, tf.relu, ActivationFunction.reference_relu,
          new FloatValue.Bounds( 0, +Infinity ), new FloatValue.Bounds( 0, +Infinity ), new FloatValue.Bounds( 0, +Infinity ) ),

        //new ActivationFunction.Info( 9, tf.softplus, ActivationFunction.reference_softplus,
        //  new FloatValue.Bounds( 0, +Infinity ),
        //  new FloatValue.Bounds( +5, +Infinity ), new FloatValue.Bounds( +5, +Infinity ) ),
*/
      ]
    );

  }

  /**
   * This non-linear function has the a little smaller range (i.e. 5) than RELU6 (i.e. 7), but has both negative and positive value
   * around zero point.
   */
  static clipByValue_Negative2_Positive2( x ) {
    return tf.clipByValue( x, -2, +2 );
  }

  static reference_clipByValue_Negative2_Positive2( x ) {
    if ( x <= -2 )
      return -2;
    else if ( x >= +2 )
      return +2;
    return x;
  }

  /**
   * This non-linear function has the same range (i.e. 7) as RELU6, but has both negative and positive value around zero point.
   */
  static clipByValue_Negative3_Positive3( x ) {
    return tf.clipByValue( x, -3, +3 );
  }

  static reference_clipByValue_Negative3_Positive3( x ) {
    if ( x <= -3 )
      return -3;
    else if ( x >= +3 )
      return +3;
    return x;
  }

  static reference_tanh( x ) { return Math.tanh( x ); }
  static reference_sin( x )  { return Math.sin( x );  }
  static reference_cos( x )  { return Math.cos( x );  }

  static reference_relu6( x ) {
    if ( x <= 0 )
      return 0;
    else if ( x >= +6 )
      return +6;
    return x;
  }

  static reference_relu( x ) {
    if ( x <= 0 )
      return 0;
    return x;
  }

  static reference_sigmoid( x ) {
    return ( 1 / ( 1 + Math.exp( -x ) ) );
  }

  static reference_softplus( x ) {
    return Math.log( 1 + Math.exp( x ) );
  }

  /**
   * Convert activation function id to information object.
   *
   * @param {number} nActivationId
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx. (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {ActivationFunction.Info}
   *   It should be one of ValueDesc.ActivationFunction.Singleton.integerToObjectMap according to the nActivationId.
   */
  getInfoById( nActivationId ) {
    let info = this.integerToObjectMap.get( nActivationId );
    return info;
  }

}

/**
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {Function} pfn
 *   The activation function by tensorflow.js (e.g. tf.relu6, tf.tanh, tf.sin, tf.cos, tf.sigmoid, tf.relu).
 *
 * @member {Function} pfnReference
 *   The activation function by CPU. It is used by NumberImage.Base for comparing correctness.
 *
 * @member {FloatValue.Bounds} outputRange
 *   The output value lower and upper bounds of the activation function for the whole input domain.
 *
 * @member {FloatValue.Bounds} inputDomainLinear
 *   The input value lower and upper bounds of the activation function for keeping the mapping from input to output almost linear. In
 * general speaking, an activation function is non-linear in the whole domain. However, inside this special part of the domain, it looks
 * almost like a linear function.
 *
 * @member {FloatValue.Bounds} outputRangeLinear
 *   The activattion function's output range when its input is in domain this.inputDomainLinear.
 */
ActivationFunction.Info = class {
  constructor( nActivationId, pfn, pfnReference, outputRange, inputDomainLinear, outputRangeLinear ) {
    this.nActivationId = nActivationId;
    this.pfn = pfn;
    this.pfnReference = pfnReference;
    this.outputRange = outputRange;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRangeLinear = outputRangeLinear;
  }
}

/** The only one ValueDesc.ActivationFunction instance. */
ActivationFunction.Singleton = new ActivationFunction;
