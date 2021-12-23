export { PassThrough_FiltersArray_BiasesArray, PassThrough };

import * as TwoTensors from "../../util/TwoTensors.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";


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
 * @member {number[]} filtersShape
 *   The shape of the pass-through filters array.
 *
 * @member {number[]} biasesShape
 *   The shape of the pass-through biases array.
 *
 * @member {number[]} filtersArray
 *   The pass-through filters array.
 *
 * @member {number[]} biasesArray
 *   The pass-through biases array.
 *
 * @see PadInfoCalculator
 */
let PassThrough_FiltersArray_BiasesArray = ( Base = Object ) => class extends PadInfoCalculator( Base ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue = 1, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );

    this.bBias = bBias;
    this.filterValue = filterValue;
    this.biasValue = biasValue;

    this.filtersShape = [ this.filterHeight, this.filterWidth, this.imageInDepth, this.channelMultiplier ];
    this.filtersArray = this.generate_PassThrough_FiltersArray( filterValue );

    if ( this.bBias ) {
      this.biasesShape =  [ 1, 1, this.imageOutDepth ];
      this.biasesArray = new Array( this.imageOutDepth );
      this.biasesArray.fill( biasValue );
    }

  }

}


/**
 * A depthwise convolution and bias which just pass the input to output.
 *
 * It is usually used in passing the higher half channels of the input to output (for achieving ShuffleNetV2_ByMopbileNetV1's body/tail).
 *
 *
 * @see PassThrough_FiltersArray_BiasesArray
 * @see PadInfoCalculator
 * @see TwoTensors.filtersTensor4d_biasesTensor3d
 */
class PassThrough extends PassThrough_FiltersArray_BiasesArray( PadInfoCalculator( TwoTensors.filtersTensor4d_biasesTensor3d() ) ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue = 1, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, filterValue, biasValue );

    this.filtersTensor4d = tf.tensor4d( this.filtersArray, this.filtersShape );

    if ( this.bBias ) {
      this.biasesTensor3d = tf.tensor3d( this.biasesArray, this.biasesShape );
    }

    this.bInitOk = true;
  }

}

