export { ActivationFunction };

import { Int } from "./ValueDesc_Base.js";
import * as Weights from "../Weights.js";
import * as FloatValue from "../FloatValue.js";

/**
 * Describe activation function parameter's id, range, name.
 *
 * The activation function ActivationFunction.Info.pfn( x ) is almost linear when x is inside inputDomainLinear. Its output is outputRangeLinear.
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

//!!! ...unfinished... (2022/01/11)
// What about:
//   - tf.clipByValue( -1, +1 )?
//   - tf.clipByValue( -2, +2 )?
//   - tf.clipByValue( -3, +3 )?
//   - tf.clipByValue( -64, +64 )?
//   - tf.clipByValue( -128, +128 )?

 *   - TANH, SIN, ERF are good if pass-through by only scale (i.e. without translate) is needed. Because the output range of
 *       them includes both negative value and positive value near the origin point. (On the other hand, RELU, RELU6 are not
 *       good for this purpose.)
 *
 */
class ActivationFunction extends Int {

  constructor() {

    super( 0, 5,
      [ "NONE",  "RELU6",  "TANH",  "SIN",  "COS",  "SIGMOID" ], // "RELU" ], //  "SOFTPLUS" ],

//!!! ...unfinished... (2022/01/10)
// Add ActivationFunction.Info.outputRangeLinear (the output range for linearDomainLinear).
// When calculating ActivationEscaping bounds array of pass-through part, use it instead of normal info.range.

      [
        new ActivationFunction.Info( 0, null, null, null, null ),

        new ActivationFunction.Info( 1, tf.relu6, new FloatValue.Bounds( 0, 6 ),
          new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ) ),

        new ActivationFunction.Info( 2, tf.tanh, new FloatValue.Bounds( -1, +1 ),
          new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 3, tf.sin, new FloatValue.Bounds( -1, +1 ),
          new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 4, tf.cos, new FloatValue.Bounds( -1, +1 ),
          new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.005 ), -( ( Math.PI / 2 ) - 0.005 ) ), new FloatValue.Bounds( -0.005, +0.005 ) ),

        new ActivationFunction.Info( 5, tf.sigmoid, new FloatValue.Bounds( 0, 1 )
          new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( +0.468, +0.532 ) ),

//!!! ...unfinished... (2022/01/11) Not yet true.
// The BoundsArraySet.afterActivation is calculate by .clamp_byXxx() (not by set_byXxx()). So the Infinity is not a problem.

        // (2021/12/09 Remarked)
        //
        // The input linear domain and output range of RELU are [ 0, +Infinity ]. However, it is not so friendly to interact with Infinity
        // because the results may be Infinity or even NaN. This is more obvious for scale-translate into linear domain in PointDepthPoint.
        // So, the RELU is excluded from the activation function list.
        //
        //new ActivationFunction.Info( 6, tf.relu, new FloatValue.Bounds( 0, +Infinity ),
        //  new FloatValue.Bounds( 0, +Infinity ), new FloatValue.Bounds( 0, +Infinity ) ),

        //new ActivationFunction.Info( 7, tf.softplus, new FloatValue.Bounds( 0, +Infinity ),
        //  new FloatValue.Bounds( +5, +Infinity ), new FloatValue.Bounds( +5, +Infinity ) ),
      ]
    );

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
 *   The activation function. (e.g. tf.relu6, tf.tanh, tf.sin, tf.cos, tf.sigmoid, tf.relu)
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
  constructor( nActivationId, pfn, outputRange, inputDomainLinear, outputRangeLinear ) {
    this.nActivationId = nActivationId;
    this.pfn = pfn;
    this.outputRange = outputRange;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRangeLinear = outputRangeLinear;
  }
}

/** The only one ValueDesc.ActivationFunction instance. */
ActivationFunction.Singleton = new ActivationFunction;
