export { ActivationFunction };

import { Int } from "./ValueDesc_Base.js";
import * as Weights from "../Weights.js";
import * as FloatValue from "../FloatValue.js";

/**
 * Describe activation function parameter's id, range, name.
 *
 * For inputDomainLinear,
 *   - RELU6 is linear between[ 0, 6 ].
 *   - TANH is almost linear between[ -0.005, +0.005 ].
 *   - SIN is almost linear between[ -0.005, +0.005 ].
 *   - COS is almost linear between[ -( ( PI / 2 ) + 0.005 ), -( ( PI / 2 ) - 0.005 ) ].
 *   - SIGMOID is alomost linear between[ -0.125, +0.125 ].
 *   - RELU is linear between[ 0, +Infinity ].
 */
class ActivationFunction extends Int {

  constructor() {

    // Note:
    //   - NONE: Beware. It easily results in infinity value because it does not have upper bound.
    //   - RELU: Beware. It easily results in infinity value because it does not have upper bound.
    //   - SOFTPLUS: Avoid. Backend WASM does not support it.
    //   - ERF: Avoid. Backend WASM does not support it.
    //
    //   - TANH, SIN, ERF are good if pass-through by only scale (i.e. without translate) is needed. Because the output range of
    //       them includes both negative and positive near the origin point. (On the other hand, RELU, RELU6 are not good for this
    //       purpose.)

    super( 0, 5,
      [ "NONE",  "RELU6",  "TANH",  "SIN",  "COS",  "SIGMOID" ], // "RELU" ], //  "SOFTPLUS" ],

      [
        new ActivationFunction.Info( 0, null, null, null ),

        new ActivationFunction.Info( 1, tf.relu6,
          new FloatValue.Bounds( 0, 6 ), new FloatValue.Bounds( 0, 6 ) ),

        new ActivationFunction.Info( 2, tf.tanh,
          new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -1, +1 ) ),

        new ActivationFunction.Info( 3, tf.sin,
          new FloatValue.Bounds( -0.005, +0.005 ), new FloatValue.Bounds( -1, +1 ) ),

        new ActivationFunction.Info( 4, tf.cos,
          new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.005 ), -( ( Math.PI / 2 ) - 0.005 ) ), new FloatValue.Bounds( -1, +1 ) ),

        new ActivationFunction.Info( 5, tf.sigmoid,
          new FloatValue.Bounds( -0.125, +0.125 ), new FloatValue.Bounds( 0, 1 ) ),

        // (2021/12/09 Remarked)
        //
        // The input linear domain and output range of RELU are [ 0, +Infinity ]. However, it is not so friendly to interact with Infinity
        // because the results may be Infinity or even NaN. This is more obvious for scale-translate into linear domain in PointDepthPoint.
        // So, the RELU is excluded from the activation function list.
        //
        //new ActivationFunction.Info( 6, tf.relu,
        //  //new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ), new FloatValue.Bounds( 0, Weights.Base.ValueBounds.upper ) ),
        //  new FloatValue.Bounds( 0, +Infinity ), new FloatValue.Bounds( 0, +Infinity ) ),

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
 *   The activation function. (e.g. tf.relu6, tf.tanh, tf.sin, tf.cos, tf.sigmoid, tf.relu)
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
