export { PassThrough };

import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";


//!!! ...unfinished... (2021/12/07)
// Problem: Although depthwise (and pointwise) convolution could be past-through, the activation function will destroy the past-through result.


//!!! ...unfinished... (2021/12/03) perhaps, provide a pool for DepthwisePassThrough of various size so that needs not regenerate again and again.

/**
 * A depthwise convolution and bias which just pass the input to output.
 *
 * It is usually used in passing the higher half channels of the input to output (for achieving ShuffleNetV2_ByMopbileNetV1's body/tail).
 *
 *
 * @member {number} filterValue
 *   The value used as the pass-through depthwise convolution filter. Default is 1. If there will be no activation function after this
 * pass-through operation, value 1 is enough. However, if there wiil be an activation function, this past-through result might be
 * destroyed by the activation function. In order to alleviate this issue, a non-one filter value should be used. For example, if
 * every input value's range is [ 0,255 ] and RELU6 will be used as activation function, using 0.015625 (= 1 / 64 ) as filterValue is
 * appropriate because input values will be shrinked from [ 0, 255 ] into [ 0, 3.984375 ] which will still be kept linear by RELU6.
 *
 * @member {number} biasValue
 *   The value used as the pass-through bias (used only if ( bBias == true ) ). Default is 0. If there will be no activation function
 * after this pass-through operation, value 0 is enough. However, if there wiil be an activation function, this past-through result
 * might be destroyed by the activation function. In order to alleviate this issue, a non-zero bias value should be used. For example,
 * if every input value's range is [ -2, +2 ] and RELU6 will be used as activation function, using +2 as biasValue is appropriate
 * because input values will be shifted from [ -2, +2 ] into [ 0, 4 ] which will still be kept linear by RELU6.
 *
 * @member {number[]} depthwiseFiltersArray
 *   The depthwise convolution filter which could pass the input to output unchangely.
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
class PassThrough extends PadInfoCalculator {

  /**
   */
  constructor(
    imageInHeight, imageInWidth, imageInDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, bBias,
    filterValue = 1, biasValue = 0 ) {

    super( imageInHeight, imageInWidth, imageInDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );

    this.bBias = bBias;
    this.filterValue = filterValue;
    this.biasValue = biasValue;

    this.depthwiseFiltersArray = this.generate_PassThrough_FiltersArray( filterValue );

    let filtersShape = [ this.filterHeight, this.filterWidth, this.imageInDepth, this.channelMultiplier ];

    // Generate depthwise filters for just pass input to output.
    this.filtersTensor4d = tf.tensor( this.depthwiseFiltersArray, filtersShape );

    // Generate bias for just adding zero. (i.e. equals no bias).
    if ( this.bBias ) {
      let biasesShape =  [ 1, 1, this.imageOutDepth ];
//!!! (2021/12/07 Remarked)
//      this.biasesTensor3d = tf.zero( biasesShape );
      this.biasesTensor3d = tf.fill( biasesShape, biasValue );
    }

    this.bInitOk = true;
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }
  }
}

