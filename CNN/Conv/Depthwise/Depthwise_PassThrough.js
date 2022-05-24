export { PassThrough_FiltersArray_BiasesArray };
export { PassThrough_FiltersArray_BiasesArray_Bag };
export { PassThrough };

import * as TwoTensors from "../../util/TwoTensors.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * A depthwise convolution and bias which just pass the input to output.
 *
 * It is usually used in passing the higher half channels of the input to output (for achieving ShuffleNetV2_ByMopbileNetV1's body/tail).
 *
 * Note: Although depthwise (and pointwise) convolution could be past-through, the activation function will destroy the past-through
 * result. Using Pointwise_FiltersArray_BiasesArray may be better to handle this issue.
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
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue = 1, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );

    this.bBias = bBias;
    this.filterValue = filterValue;
    this.biasValue = biasValue;

    this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.channelMultiplier ];
    this.filtersArray = this.generate_PassThrough_FiltersArray( filterValue );

    if ( this.bBias ) {
      this.biasesShape =  [ 1, 1, this.outputChannelCount ];
      this.biasesArray = new Array( this.outputChannelCount );
      this.biasesArray.fill( biasValue );
    }

  }

}


/**
 * A pool for PassThrough_FiltersArray_BiasesArray with various parameters. It could reduce re-creating them of same parameters again
 * and again to improve performance.
 *
 */
class PassThrough_FiltersArray_BiasesArray_Bag extends MultiLayerMap.Base {

  //constructor() {
  //  super();
  //}

  /**
   *
   */
  get_by_PassThroughStyleId(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    nPassThroughStyleId ) {

    const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfoById( nPassThroughStyleId );
    return this.get_by_filterValue_biasValue(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      thePassThroughStyleInfo.filterValue, thePassThroughStyleInfo.biasValue );
  }

  /**
   *
   */
  get_by_filterValue_biasValue(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue = 1, biasValue = 0 ) {

    return this.get_or_create_by_arguments1_etc( PassThrough_FiltersArray_BiasesArray_Bag.create_by,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, filterValue, biasValue );
  }

  /** */
  static create_by(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue, biasValue ) {

    return new ( PassThrough_FiltersArray_BiasesArray() )(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, filterValue, biasValue );
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
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, filterValue = 1, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, filterValue, biasValue );

    this.filtersTensor4d = tf.tensor4d( this.filtersArray, this.filtersShape );

    if ( this.bBias ) {
      this.biasesTensor3d = tf.tensor3d( this.biasesArray, this.biasesShape );
    }

    this.bInitOk = true;
  }

}

