export { Average_FiltersArray_BiasesArray };
export { Average_FiltersArray_BiasesArray_Bag };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * A depthwise convolution could average the input and then add bias.
 *
 * It is similar to avarage pooling. But its filter weights could be adjusted (e.g. undoPreviousEscapingScale).
 *
 * @member {number} biasValue
 *   The value used as the pass-through bias (used only if ( bBias == true ) ). Default is 0.
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
let Average_FiltersArray_BiasesArray = ( Base = Object ) => class extends PadInfoCalculator( Base ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );

    this.bBias = bBias;
    this.biasValue = biasValue;

    this.centerfilterValue = this.surroundingfilterValue = ( 1 / ( filterHeight * filterWidth ) );

    this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.channelMultiplier ];
    this.filtersArray = this.generate_Average_FiltersArray( this.centerfilterValue, this.surroundingfilterValue );

    if ( this.bBias ) {
      this.biasesShape =  [ 1, 1, this.outputChannelCount ];
      this.biasesArray = new Array( this.outputChannelCount );
      this.biasesArray.fill( biasValue );
    }

  }

}


/**
 * A pool for Average_FiltersArray_BiasesArray with various parameters. It could reduce re-creating them of same parameters again
 * and again to improve performance.
 *
 */
class Average_FiltersArray_BiasesArray_Bag extends MultiLayerMap.Base {

  /**
   *
   */
  get_by_AverageStyleId(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nAverageStyleId ) {

    const theAverageStyleInfo = ValueDesc.AverageStyle.Singleton.getInfoById( nAverageStyleId );
    return this.get_by_biasValue(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, ???theAverageStyleInfo.filterValue, theAverageStyleInfo.biasValue );
  }

  /**
   *
   */
  get_by_biasValue(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, biasValue = 0 ) {

    return this.get_or_create_by_arguments1_etc( Average_FiltersArray_BiasesArray_Bag.create_by,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, biasValue );
  }

  /** */
  static create_by(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, biasValue ) {

    return new ( Average_FiltersArray_BiasesArray() )(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, biasValue );
  }

}

