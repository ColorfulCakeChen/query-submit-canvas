export { ActivationFunction };

import { Int } from "./ValueDesc_Base.js";
import * as Weights from "./Weights.js";
import * as FloatValue from "./FloatValue.js";

/**
 * Describe activation function parameter's id, range, name.
 *
 * For inputDomainLinear,
 *   - RELU6 is linear between[ 0, 6 ].
 *   - SIGMOID is alomost linear between[ -0.125, +0.125 ].
 *   - TANH is almost linear between[ -0.125, +0.125 ].
 *   - COS is almost linear between[ -( ( PI / 2 ) + 0.025 ), -( ( PI / 2 ) - 0.025 ) ].
 *   - SIN is almost linear between[ -0.025, +0.025 ].
 *   - RELU is linear between[ 0, 6 ].
 */
class ActivationFunction extends Int {

  constructor() {
    // Note:
    //   - NONE: Beware. It easily results in infinity value because it does not have upper bound.
    //   - RELU: Beware. It easily results in infinity value because it does not have upper bound.
    //   - SOFTPLUS: Avoid. Backend WASM does not support it.

//!!! (2021/12/09 Remarked) Use ActivationFunction.Info
//     super( 0, 6,
//       [ "NONE",  "RELU6",  "SIGMOID",  "TANH",  "COS",  "SIN",  "RELU" ], //  "SOFTPLUS" ],
//       [   null, tf.relu6, tf.sigmoid, tf.tanh, tf.cos, tf.sin, tf.relu ]  // tf.softplus ]
//     );

    super( 0, 6,
      [ "NONE",  "RELU6",  "SIGMOID",  "TANH",  "COS",  "SIN",  "RELU" ], //  "SOFTPLUS" ],

      [
        new ActivationFunction.Info( 0, null, null, null ),

        new ActivationFunction.Info( 1, tf.relu6,
          new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ) ),

        new ActivationFunction.Info( 2, tf.sigmoid,
          new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( 0, 1 ) ),

        new ActivationFunction.Info( 3, tf.tanh,
          new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( -1, +1 ) ),

        new ActivationFunction.Info( 4, tf.cos,
          new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.025 ), -( ( Math.PI / 2 ) - 0.025 ) ), new FloatValue.Bounds( -1, +1 ) ),

        new ActivationFunction.Info( 5, tf.sin,
          new FloatValue.Bounds( -0.025, +0.025 ), new FloatValue.Bounds( -1, +1 ) ),

        // Note: The input linear domain and output range of RELU are [ 0, +INF ].
        //       However, for PointDepthPoint, using Weights.Base.ValueBounds.upper as upper bound should be sufficient.
        new ActivationFunction.Info( 6, tf.relu,
          new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ), new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ) ),

        //new ActivationFunction.Info( 7, tf.softplus,
        //  new Base( 0, 6 ), Weights.Base.ValueBounds ),

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
 *   The activation function. (e.g. tf.relu6, tf.sigmoid, tf.tanh, tf.cos, tf.sin, tf.relu)
 *
 * @member {FloatValue.Bounds} inputDomainLinear
 *   The input value lower and upper bounds of the activation function for keeping the mapping from input to output almost linear. In
 * general speaking, an activation function is non-linear in the whole domain. However, inside this special part of the domain, it looks
 * almost like a linear function.
 *
 * @member {FloatValue.Bounds} outputRange
 *   The output value lower and upper bounds of the activation function.
 */
ActivationFunction.Info = class {
  constructor( nActivationId, pfn, inputDomainLinear, outputRange ) {
    this.nActivationId = nActivationId;
    this.pfn = pfn;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRange = outputRange;
  }
}

/** The only one ValueDesc.ActivationFunction instance. */
ActivationFunction.Singleton = new ActivationFunction;
