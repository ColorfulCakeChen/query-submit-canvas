export { ActivationFunction };

import { Int } from "./ValueDesc_Base.js";
import * as FloatValue from "../FloatValue.js";

/**
 * Describe activation function parameter's id, range, name.
 *
 * The activation function ActivationFunction.Info.pfn( x ) is almost linear
 * when x is inside inputDomainLinear. Its output is outputRangeLinear.
 *
 *   - CLIP_BY_VALUE_N2_P2( [ -2, +2 ] ) = [ -2, +2 ]
 *   - CLIP_BY_VALUE_N3_P3( [ -3, +3 ] ) = [ -3, +3 ]
 *   - RELU6( [ 0, 6 ] ) = [ 0, 6 ]
 *   - TANH ( [ -0.005, +0.005 ] ) = [ -0.005, +0.005]
 *   - SIN  ( [ -0.005, +0.005 ] ) = [ -0.005, +0.005]
 *   - COS  ( [ -( ( PI / 2 ) + 0.005 ), -( ( PI / 2 ) - 0.005 ) ] )
 *       = [ -0.005, +0.005 ]
 *   - SIGMOID ( [ -0.125, +0.125 ] ) = [ +0.468, +0.532 ]
 *   - RELU ( 0, +Infinity ) = [ 0, +Infinity ]
 *   - SOFTPLUS ( +5, +Infinity ) = [ +5, +Infinity ]
 *
 *
 * Note:
 *   - NONE: Beware. It easily results in infinity value because it has no
 *       upper bound.
 *   - RELU: Beware. It easily results in infinity value because it has no
 *       upper bound.
 *   - SOFTPLUS: Avoid. Backend WASM does not support it.
 *   - ERF: Avoid. Backend WASM does not support it.
 *
 *   - CLIP_BY_VALUE, TANH, SIN, ERF are good if pass-through by only scale
 *       (i.e. without translate) is needed. Because the output range of them
 *       includes both negative value and positive value near the origin point.
 *       (On the other hand, RELU, RELU6 are not good for this purpose.)
 *
 *
 *
 * Q1: Since activation by clipByValue() is enough, why not just using
 *       saturated integer for convolution?
 * A1: Although saturated integer could achieve clipByValue automatically
 *       without activation function (i.e. less computation time). It has some
 *       disadvantages:
 *
 *      - It can not escape saturation (i.e. escape activation) by scaling.
 *          Because that needs multiply a number less than one which can not be
 *          represented by integer (i.e. floatig-point number is required).
 *
 *      - It may not be saturated (i.e. activated) by bias. When the input
 *          value is the minimum value (e.g. -255), adding a bias (even if
 *          adding the maximum value 255) can not saturate it to maximum value
 *          (e.g. +255).
 *
 * On the other hand, floating-point number has already been similar to a kind
 * of saturated number (i.e. maximum is saturated to +Infinity, and minimum is
 * saturated to -Infinity).
 *
 *
 *
 * Q2: Why use CLIP_BY_VALUE_N2_P2 instead of CLIP_BY_VALUE_N3_P3?
 * A2: To reduce floating-point accumulated error.
 *
 * CLIP_BY_VALUE_N3_P3:
 *
 *   - Advantage: It has larger inputDomainLinear so that activation-escaping
 *       could use a larger scale. This reduces floating-point truncation
 *       error.
 *
 *   - Disadvantage: Its activated value (i.e. 3) seems harder to become any
 *       other value by a floating-point finite scaling. This increases the
 *       floating-point accumulated error. For example, in order to let 3
 *       become 100, a scale 33.333... should be used. However, 33.3 can not be
 *       represented by a finite floating-point number.
 *
 * CLIP_BY_VALUE_N2_P2:
 *
 *   - Disadvantage: It has smaller inputDomainLinear [ -2, +2 ] (than
 *       CLIP_BY_VALUE_N3_P3 [ -3, +3 ]) so that activation-escaping needs use
 *       a smaller scale. This increases floating-point truncation error.
 *       Fortunately, if a just enough input value bounds is used (e.g. for
 *       RGBA image, uses 2^8 (instead of 2^24) as every channel's input value
 *       bounds), this issue could be less problematic.
 *
 *   - Advantage: Its activated value (i.e. 2) is easier to become any other
 *       value by a floating-point finite scaling. This reduces the
 *       floating-point accumulated error. In this point of view, not only 2,
 *       any powers of two (i.e. 0.25, 0.5, 1, 2, 4, 8, ..., 64, 128, ...) is
 *       good enough for this task.
 *
 *
 */
class ActivationFunction extends Int {

  constructor() {

    //!!! (2022/07/05 Remarked) For speed-up testing.
    //super( 0, 8,

    super( 0, 1,
      {
        NONE : new ActivationFunction.Info( 0, "NONE", null, null, null, null, null ),

        CLIP_BY_VALUE_N2_P2: new ActivationFunction.Info( 1, "CLIP_BY_VALUE_N2_P2",

          ActivationFunction.clipByValue_Negative2_Positive2,
          ActivationFunction.reference_clipByValue_Negative2_Positive2,
          new FloatValue.Bounds( -2, +2 ), new FloatValue.Bounds( -2, +2 ),
          new FloatValue.Bounds( -2, +2 ) ),

          //!!! (2022/08/04 Remarked) Try small range whether reduceing accumulated error.
          // ActivationFunction.clipByValue_Negative8_Positive8,
          // ActivationFunction.reference_clipByValue_Negative8_Positive8,
          // new FloatValue.Bounds( -8, +8 ), new FloatValue.Bounds( -8, +8 ),
          // new FloatValue.Bounds( -8, +8 ) ),

          // ActivationFunction.clipByValue_Negative4_Positive4,
          // ActivationFunction.reference_clipByValue_Negative4_Positive4,
          // new FloatValue.Bounds( -4, +4 ), new FloatValue.Bounds( -4, +4 ),
          // new FloatValue.Bounds( -4, +4 ) ),

//!!! (2022/07/05 Remarked) For speed-up testing.
/*
        CLIP_BY_VALUE_N3_P3: new ActivationFunction.Info( 2, "CLIP_BY_VALUE_N3_P3",
          ActivationFunction.clipByValue_Negative3_Positive3,
          ActivationFunction.reference_clipByValue_Negative3_Positive3,
          new FloatValue.Bounds( -3, +3 ), new FloatValue.Bounds( -3, +3 ),
          new FloatValue.Bounds( -3, +3 ) ),

        TANH: new ActivationFunction.Info( 3, "TANH",
          tf.tanh, ActivationFunction.reference_tanh,
          new FloatValue.Bounds( -1, +1 ), new FloatValue.Bounds( -0.005, +0.005 ),
          new FloatValue.Bounds( -0.005, +0.005 ) ),

        SIN: new ActivationFunction.Info( 4, "SIN",
          tf.sin, ActivationFunction.reference_sin,
          new FloatValue.Bounds( -1, +1 ), new FloatValue.Bounds( -0.005, +0.005 ),
          new FloatValue.Bounds( -0.005, +0.005 ) ),

        RELU6: new ActivationFunction.Info( 5, "RELU6",
          tf.relu6, ActivationFunction.reference_relu6,
          new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ),
          new FloatValue.Bounds( 0, 6 ) ),

        COS: new ActivationFunction.Info( 6, "COS",
          tf.cos, ActivationFunction.reference_cos,
          new FloatValue.Bounds( -1, +1 ),
          new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.005 ), -( ( Math.PI / 2 ) - 0.005 ) ),
          new FloatValue.Bounds( -0.005, +0.005 ) ),

        SIGMOID: new ActivationFunction.Info( 7, "SIGMOID",
          tf.sigmoid, ActivationFunction.reference_sigmoid,
          new FloatValue.Bounds( 0, 1 ), new FloatValue.Bounds( -0.125, +0.125 ),
          new FloatValue.Bounds( +0.468, +0.532 ) ),

        // (2021/12/09)
        // The input linear domain and output range of RELU are [ 0, +Infinity ]. However, it is not so friendly to interact with Infinity
        // because the results may be Infinity or even NaN. This is more obvious for scale-translate into linear domain in PointDepthPoint.
        // So, the RELU is excluded from the activation function list.
        //
        // (2022/01/11)
        // However, if the BoundsArraySet.afterActivation is calculate by .clamp_byXxx() (not by set_byXxx()), the Infinity bounds is
        // not a problem.
        RELU: new ActivationFunction.Info( 8, "RELU",
          tf.relu, ActivationFunction.reference_relu,
          new FloatValue.Bounds( 0, +Infinity ), new FloatValue.Bounds( 0, +Infinity ),
          new FloatValue.Bounds( 0, +Infinity ) ),

        //SOFTPLUS: new ActivationFunction.Info( 9, "SOFTPLUS",
        //  tf.softplus, ActivationFunction.reference_softplus,
        //  new FloatValue.Bounds( 0, +Infinity ),
        //  new FloatValue.Bounds( +5, +Infinity ),
        //  new FloatValue.Bounds( +5, +Infinity ) ),
*/
      }
    );

  }

  /**   */
  static reference_clipByValue_lowerBound_upperBound( x, lowerBound, upperBound ) {
    x = Math.fround( x );
    lowerBound = Math.fround( lowerBound );
    upperBound = Math.fround( upperBound );
    if ( x < lowerBound )
      return lowerBound;
    else if ( x > upperBound )
      return upperBound;
    return x;
  }


  /** */
  static clipByValue_Negative16_Positive16( x ) { return tf.clipByValue( x, -16, +16 ); }
  static reference_clipByValue_Negative16_Positive16( x ) {
    return ActivationFunction.reference_clipByValue_lowerBound_upperBound( x, -16, +16 );
  }

  /** */
  static clipByValue_Negative8_Positive8( x ) { return tf.clipByValue( x, -8, +8 ); }
  static reference_clipByValue_Negative8_Positive8( x ) {
    return ActivationFunction.reference_clipByValue_lowerBound_upperBound( x, -8, +8 );
  }

  /** */
  static clipByValue_Negative4_Positive4( x ) { return tf.clipByValue( x, -4, +4 ); }
  static reference_clipByValue_Negative4_Positive4( x ) {
    return ActivationFunction.reference_clipByValue_lowerBound_upperBound( x, -4, +4 );
  }

  /**
   * This non-linear function has the a little smaller range (i.e. 5) than RELU6 (i.e. 7), but has both negative and positive value
   * around zero point.
   */
  static clipByValue_Negative2_Positive2( x ) { return tf.clipByValue( x, -2, +2 ); }
  static reference_clipByValue_Negative2_Positive2( x ) {
    return ActivationFunction.reference_clipByValue_lowerBound_upperBound( x, -2, +2 );
  }

  /**
   * This non-linear function has the same range (i.e. 7) as RELU6, but has both negative and positive value around zero point.
   */
  static clipByValue_Negative3_Positive3( x ) { return tf.clipByValue( x, -3, +3 ); }
  static reference_clipByValue_Negative3_Positive3( x ) {
    return ActivationFunction.reference_clipByValue_lowerBound_upperBound( x, -3, +3 );
  }

  static reference_tanh( x ) { return Math.fround( Math.tanh( Math.fround( x ) ) ); }
  static reference_sin( x )  { return Math.fround( Math.sin( Math.fround( x ) ) );  }
  static reference_cos( x )  { return Math.fround( Math.cos( Math.fround( x ) ) );  }

  static reference_relu6( x ) {
    x = Math.fround( x );
    if ( x <= 0 )
      return 0;
    else if ( x >= +6 )
      return +6;
    return x;
  }

  static reference_relu( x ) {
    x = Math.fround( x );
    if ( x <= 0 )
      return 0;
    return x;
  }

  static reference_sigmoid( x ) {
    return Math.fround( 1 / Math.fround( 1 + Math.fround( Math.exp( Math.fround( -x ) ) ) ) );
  }

  static reference_softplus( x ) {
    return Math.fround( Math.log( Math.fround( 1 + Math.fround( Math.exp( Math.fround( x ) ) ) ) ) );
  }

}

/**
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {Function} pfn
 *   The activation function by tensorflow.js (e.g. tf.relu6, tf.tanh, tf.sin, tf.cos,
 * tf.sigmoid, tf.relu).
 *
 * @member {Function} pfnReference
 *   The activation function by CPU. It is used by NumberImage.Base for comparing
 * correctness.
 *
 * @member {FloatValue.Bounds} outputRange
 *   The output value lower and upper bounds of the activation function for the whole
 * input domain.
 *
 * @member {FloatValue.Bounds} inputDomainLinear
 *   The input value lower and upper bounds of the activation function for keeping the
 * mapping from input to output almost linear. In general speaking, an activation
 * function is non-linear in the whole domain. However, inside this special part of
 * the domain, it looks almost like a linear function.
 *
 * @member {FloatValue.Bounds} outputRangeLinear
 *   The activation function's output range when its input is in domain
 * this.inputDomainLinear.
 */
ActivationFunction.Info = class ActivationFunction_Info extends Int.Info {
  constructor(
    nActivationId, nameForMessage, pfn, pfnReference,
    outputRange, inputDomainLinear, outputRangeLinear
  ) {

    super( nActivationId, nameForMessage );
    this.pfn = pfn;
    this.pfnReference = pfnReference;
    this.outputRange = outputRange;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRangeLinear = outputRangeLinear;
  }
}

/** The only one ValueDesc.ActivationFunction instance. */
ActivationFunction.Singleton = new ActivationFunction;
