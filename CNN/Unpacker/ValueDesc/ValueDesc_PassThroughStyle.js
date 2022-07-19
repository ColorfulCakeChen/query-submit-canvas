export { PassThroughStyle };

import { Int } from "./ValueDesc_Base.js";

/**
 * Describe convolution pass-through style parameter's id, range, name.
 *
 *
 * Convert number value into integer between [ 0, 1 ] representing operation:
 *   - 0: PASS_THROUGH_STYLE_FILTER_1_BIAS_0 (depthwise, pointwise)
 *   - 1: PASS_THROUGH_STYLE_FILTER_0_BIAS_1 (squeeze-and-excitation)
 *
 */
class PassThroughStyle extends Int {

  constructor() {
    super( 0, 1,
      {
        PASS_THROUGH_STYLE_FILTER_1_BIAS_0: 0,
        PASS_THROUGH_STYLE_FILTER_0_BIAS_1: 1,
      },

      {
        PASS_THROUGH_STYLE_FILTER_1_BIAS_0: new PassThroughStyle.Info( 0, 1, 0 ),
        PASS_THROUGH_STYLE_FILTER_0_BIAS_1: new PassThroughStyle.Info( 1, 0, 1 ),
      }
    );

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
 */
PassThroughStyle.Info = class {

  constructor( nPassThroughStyleId, filterValue, biasValue ) {
    this.nPassThroughStyleId = nPassThroughStyleId;
    this.filterValue = filterValue;
    this.biasValue = biasValue;
  }
}

/** The only one ValueDesc.PassThroughStyle instance. */
PassThroughStyle.Singleton = new PassThroughStyle;
