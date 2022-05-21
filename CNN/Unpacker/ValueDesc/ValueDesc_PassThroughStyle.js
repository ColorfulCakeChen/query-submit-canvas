export { PassThroughStyle };

import { Int } from "./ValueDesc_Base.js";

/**
 * Describe convolution pass-through style parameter's id, range, name.
 *
 
//!!! (2022/05/21 Remarked) PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING seems still need activation escaping.
//  * Convert number value into integer between [ 0, 1 ] representing operation:
//  *   - 0: PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING    (depthwise, pointwise)
//  *   - 1: PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING (squeeze-and-excitation)

 *
 * Convert number value into integer between [ 0, 1 ] representing operation:
 *   - 0: PASS_THROUGH_STYLE_FILTER_1_BIAS_0 (depthwise, pointwise)
 *   - 1: PASS_THROUGH_STYLE_FILTER_0_BIAS_1 (squeeze-and-excitation)
 *
 */
class PassThroughStyle extends Int {

  constructor() {
    super( 0, 1,
      [
        "PASS_THROUGH_STYLE_FILTER_1_BIAS_0",
        "PASS_THROUGH_STYLE_FILTER_0_BIAS_1",
      ],

      [
        new PassThroughStyle.Info( 0, 1, 0 ),
        new PassThroughStyle.Info( 1, 0, 1 ),
      ]

//!!! (2022/05/21 Remarked) PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING seems still need activation escaping.
//     super( 0, 1,
//       [
//         "PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING",
//         "PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING",
//       ],
//
//       [
//         new PassThroughStyle.Info( 0, 1, 0,  true ),
//         new PassThroughStyle.Info( 1, 0, 1, false ),
//       ]
    );

  }

  /**
   * Convert pass-through style id to information object.
   *
   * @param {number} nPassThroughStyleId
   *   It should be one of ValueDesc.PassThroughStyle.Singleton.Ids.Xxx.
   *
   * @return {PassThroughStyle.Info}
   *   It should be one of ValueDesc.PassThroughStyle.Singleton.integerToObjectMap according to the nActivationId.
   */
  getInfoById( nPassThroughStyleId ) {
    let info = this.integerToObjectMap.get( nPassThroughStyleId );
    return info;
  }

}

/**
 *
 * @member {number} nPassThroughStyleId
 *   The pass-through style id (ValueDesc.PassThroughStyle.Singleton.Ids.Xxx).
 *
 * @member {number} filterValue
 *   The convolution filter value for the pass-through style.
 *
 * @member {number} biasValue
 *   The convolution bias value for the pass-through style.
 *

//!!! (2022/05/21 Remarked) PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING seems still need activation escaping.
//  * @member {boolean} bActivationEscaping
//  *   If true, the pass-through style will calculate the scale for letting the convolution result could escaping the activation function's
//  * non-linear part when pass-through is necessary.

 */
PassThroughStyle.Info = class {

//!!! (2022/05/21 Remarked) PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING seems still need activation escaping.
//  constructor( nPassThroughStyleId, filterValue, biasValue, bActivationEscaping ) {

  constructor( nPassThroughStyleId, filterValue, biasValue ) {
    this.nPassThroughStyleId = nPassThroughStyleId;
    this.filterValue = filterValue;
    this.biasValue = biasValue;

//!!! (2022/05/21 Remarked) PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING seems still need activation escaping.
//    this.bActivationEscaping = bActivationEscaping;
  }
}

/** The only one ValueDesc.PassThroughStyle instance. */
PassThroughStyle.Singleton = new PassThroughStyle;
