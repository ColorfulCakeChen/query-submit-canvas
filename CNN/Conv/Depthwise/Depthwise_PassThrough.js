export { PassThrough_FiltersArray_BiasesArray };
export { PassThrough_FiltersArray_BiasesArray_Root };
export { PassThrough_FiltersArray_BiasesArray_Bag };
export { PassThrough };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * A depthwise convolution and bias which just pass the input to output.
 *
 * It is usually used in passing the higher half channels of the input to output (for achieving ShuffleNetV2_ByMopbileNetV1's body/tail).
 *
 * Note1: Although depthwise (and pointwise) convolution could be past-through, the activation function will destroy the past-through
 * result. Using Pointwise_FiltersArray_BiasesArray may be better to handle this issue.
 *
 * Note2: If both effectFilterValue and surroundingFilterValue are the same as ( 1 / ( filterHeight * filter Width ) ), the result filter
 * will have the same effect as average pooling.
 *
 *
 *
 * @member {number} effectFilterValue
 *   The value used as the effect value of the pass-through depthwise convolution filter. Default is 1. If there will be no activation
 * function after this pass-through operation, value 1 is enough. However, if there wiil be an activation function, this past-through
 * result might be destroyed by the activation function. In order to alleviate this issue, a non-one filter value should be used. For
 * example, if every input value's range is [ 0,255 ] and RELU6 will be used as activation function, using 0.015625 (= 1 / 64 ) as
 * filterValue is appropriate because input values will be shrinked from [ 0, 255 ] into [ 0, 3.984375 ] which will still be kept
 * linear by RELU6.
 *
 * @member {number} surroundingFilterValue
 *   The value used as the surrounding value of the pass-through depthwise convolution filter. Default is 0. 
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
let PassThrough_FiltersArray_BiasesArray
  = ( ParentClass = Object ) => class PassThrough_FiltersArray_BiasesArray extends PadInfoCalculator( ParentClass ) {

  /**
   * Used as default Depthwise.PassThrough_FiltersArray_BiasesArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.PassThrough_FiltersArray_BiasesArray.Pool",
    PassThrough_FiltersArray_BiasesArray, PassThrough_FiltersArray_BiasesArray.setAsConstructor );

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, effectFilterValue = 1, surroundingFilterValue = 0, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
    PassThrough_FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      bBias, effectFilterValue, surroundingFilterValue, biasValue );
  }

  /** @override */
  static setAsConstructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, effectFilterValue = 1, surroundingFilterValue = 0, biasValue = 0 ) {

    super.setAsConstructor( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
    PassThrough_FiltersArray_BiasesArray.setAsConstructor_self.call( this,
      bBias, effectFilterValue, surroundingFilterValue, biasValue );
    return this;
  }

  /** @override */
  static setAsConstructor_self( bBias, effectFilterValue = 1, surroundingFilterValue = 0, biasValue = 0 ) {
    this.bBias = bBias;
    this.effectFilterValue = effectFilterValue;
    this.surroundingFilterValue = surroundingFilterValue;
    this.biasValue = biasValue;

    this.filtersShape = Recyclable.Array.Pool.get_or_create_by( 4 );
    this.filtersShape[ 0 ] = this.filterHeight;
    this.filtersShape[ 1 ] = this.filterWidth;
    this.filtersShape[ 2 ] = this.inputChannelCount;
    this.filtersShape[ 3 ] = this.channelMultiplier;

    PassThrough_FiltersArray_BiasesArray.generate_PassThrough_FiltersArray.call( this, effectFilterValue, surroundingFilterValue );

    if ( this.bBias ) {
      this.biasesShape = Recyclable.Array.Pool.get_or_create_by( 3 );
      this.biasesShape[ 0 ] = 1;
      this.biasesShape[ 1 ] = 1;
      this.biasesShape[ 2 ] = this.outputChannelCount;

      this.biasesArray = Recyclable.Array.Pool.get_or_create_by( this.outputChannelCount );
      this.biasesArray.fill( biasValue );
    }
  }

  /** @override */
  disposeResources() {
    if ( this.biasesArray ) {
      this.biasesArray.disposeResources_and_recycleToPool();
      this.biasesArray = null;
    }

    if ( this.biasesShape ) {
      this.biasesShape.disposeResources_and_recycleToPool();
      this.biasesShape = null;
    }

    if ( this.filtersArray ) {
      this.filtersArray.disposeResources_and_recycleToPool();
      this.filtersArray = null;
    }

    if ( this.filtersShape ) {
      this.filtersShape.disposeResources_and_recycleToPool();
      this.filtersShape = null;
    }
    super.disposeResources();
  }

  /**
   * Determine the following properties:
   *   - this.filtersArray
   *
   * It is an number array representing the depthwise convolution filters which could pass the input to output unchangely.
   *
   * If both effectFilterValue and otherFilterValue are the same as ( 1 / ( filterHeight * filter Width ) ), the result filter
   * will have the same effect as average pooling.
   *
   *
   * @param {number} effectFilterValue
   *   The filter value used for the effect input pixel of the depthwise convolution. For pass-through, it is usually 1.
   * Note: It is not always just at center of filter according to the filter shape and paddding.
   *
   * @param {number} surroundingFilterValue
   *   The filter value used for the surrounding input pixel of the depthwise convolution. For pass-through, it is usually 0.
   *
   */
  static generate_PassThrough_FiltersArray( effectFilterValue, surroundingFilterValue ) {

    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === this.AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === this.AvgMax_Or_ChannelMultiplier ) ) {

      if ( this.filtersArray ) {
        this.filtersArray.disposeResources_and_recycleToPool();
        this.filtersArray = null;
      }

      return; // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    }

    // Make up a depthwise convolution filter.
    this.filtersArray = Recyclable.Array.Pool.get_or_create_by(
      this.filterHeight * this.filterWidth * this.inputChannelCount * this.channelMultiplier );

    // There is only one position (inside the effect depthwise filter) uses effectFilterValue.
    // All other positions of the filter should be surroundingFilterValue.
    //
    let oneEffectFilterY = this.padHeightTop;
    let oneEffectFilterX = this.padWidthLeft;

    // Note: Unfortunately, this may not work for ( dilation > 1 ) because the non-zero-filter-value might be just at the dilation
    //       position which does not exist in a filter. So, only ( dilation == 1 ) is supported.


    let filterIndex = 0; // The index in the filter weights array.

    for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
      for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

        for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
          for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

            // The filter's dilation part can not be manipulated. (They are always zero.)
            if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
              continue;

            for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

              for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

                if ( ( effectFilterY == oneEffectFilterY ) && ( effectFilterX == oneEffectFilterX ) ) {
                  this.filtersArray[ filterIndex ] = effectFilterValue;
                } else {
                  this.filtersArray[ filterIndex ] = surroundingFilterValue;
                }

                ++filterIndex;
              }
            }
          }
        }
      }
    }
  }

}


/**
 * Almost the same as Depthwise.PassThrough_FiltersArray_BiasesArray class except its parent class is fixed to Object. In other words,
 * caller can not specify the parent class of Depthwise.PassThrough_FiltersArray_BiasesArray_Root (so it is named "Root" which can not
 * have parent class).
 */
class PassThrough_FiltersArray_BiasesArray_Root extends PassThrough_FiltersArray_BiasesArray() {
}


/**
 * A pool for PassThrough_FiltersArray_BiasesArray with various parameters. It could reduce re-creating them of same parameters again
 * and again to improve performance.
 *
 */
class PassThrough_FiltersArray_BiasesArray_Bag extends MultiLayerMap.Base {

  /**
   * Used as default Depthwise.PassThrough_FiltersArray_BiasesArray_Bag provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.PassThrough_FiltersArray_BiasesArray_Bag.Pool",
    PassThrough_FiltersArray_BiasesArray_Bag, PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor );

  /**
   */
  constructor() {
    super();
    PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    PassThrough_FiltersArray_BiasesArray_Bag.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** Release all channel shufflers and their tf.tensor.
   * @override
   */
  disposeResources() {
    this.clear();
    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let aPassThrough_FiltersArray_BiasesArray of this.values() ) {
      aPassThrough_FiltersArray_BiasesArray.disposeResources_and_recycleToPool();
    }
    super.clear();
  }

  /**
   *
   */
  get_by_PassThroughStyleId(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nPassThroughStyleId ) {

//!!! ...unfinished... (2022/05/26) effectFilterValue, surroundingFilterValue ???

    const thePassThroughStyleInfo = ValueDesc.PassThroughStyle.Singleton.getInfoById( nPassThroughStyleId );
    return this.get_by_effectFilterValue_surroundingFilterValue_biasValue(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, thePassThroughStyleInfo.filterValue, 0, thePassThroughStyleInfo.biasValue );
  }

  /**
   *
   */
  get_by_effectFilterValue_surroundingFilterValue_biasValue(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, effectFilterValue = 1, surroundingFilterValue = 0, biasValue = 0 ) {

    return this.get_or_create_by_arguments1_etc( PassThrough_FiltersArray_BiasesArray_Bag.create_by,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, effectFilterValue, surroundingFilterValue, biasValue );
  }

  /** */
  static create_by(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, effectFilterValue, surroundingFilterValue, biasValue ) {

    return new PassThrough_FiltersArray_BiasesArray_Root(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, effectFilterValue, surroundingFilterValue, biasValue );
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
class PassThrough extends PassThrough_FiltersArray_BiasesArray( TwoTensors.filtersTensor4d_biasesTensor3d() ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, effectFilterValue = 1, surroundingFilterValue = 0, biasValue = 0 ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, effectFilterValue, surroundingFilterValue, biasValue );

    this.filtersTensor4d = tf.tensor4d( this.filtersArray, this.filtersShape );

    if ( this.bBias ) {
      this.biasesTensor3d = tf.tensor3d( this.biasesArray, this.biasesShape );
    }

    this.bInitOk = true;
  }

}


