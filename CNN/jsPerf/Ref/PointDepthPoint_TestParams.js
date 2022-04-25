export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as NameNumberArrayObject_To_Float32Array from "../../util/NameNumberArrayObject_To_Float32Array.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";
import * as TestParams from "./TestParams.js";
import * as NumberImage from "./NumberImage.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as PointDepthPoint from "../../Conv/PointDepthPoint.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of the PointDepthPoint.Params's constructor. That is,
 * it has the following data members: channelCount0_pointwise1Before, channelCount1_pointwise1Before, pointwise1ChannelCount,
 * bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth,
 * depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
 * bOutput1Requested, bKeepInputTensor. It also has the following properties:
 *   - paramsNumberArrayObject
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *
 * @member {object} io_paramsNumberArrayObject
 *   An object. It is a map from a string name (e.g. parameter name) to a number array. The name should be one of
 * Base.paramsNameOrderArray[] elements.
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of PointDepthPoint.Params's extract().
 * That is, it has the above data members except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 */
class Base extends TestParams.Base {

  /**
   *
   */
  //constructor() {
  //  super();
  //}

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.out
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsScattered(
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    bOutput1Requested,
    bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      channelCount0_pointwise1Before,
      channelCount1_pointwise1Before,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
      pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
      bOutput1Requested,
      bKeepInputTensor
    };

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightsElementOffsetBegin = 0;
    return this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {object} this.out
   *   An object which has the following data members: channelCount0_pointwise1Before, channelCount1_pointwise1Before, pointwise1ChannelCount,
   * bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth,
   * depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
   * bOutput1Requested, bKeepInputTensor. And depthwisePadInfo.
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightsElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {

    this.generate_Filters_Biases();

    let Float32Array_ByteOffsetBegin = new NameNumberArrayObject_To_Float32Array.Base();
    Float32Array_ByteOffsetBegin.setByConcat( Base.paramsNameOrderArray, this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    if ( !this.out.depthwisePadInfo ) {
      this.out.depthwisePadInfo = new ( Depthwise.PadInfoCalculator() )(
        this.out.inputHeight0, this.out.inputWidth0, this.out.channelCount0_pointwise1Before, 
        this.out.depthwise_AvgMax_Or_ChannelMultiplier, this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth,
        this.out.depthwiseStridesPad );
    } else { // Re-using (instead of re-creating) may improve runtime speed.
      this.out.depthwisePadInfo.set(
        this.out.inputHeight0, this.out.inputWidth0, this.out.channelCount0_pointwise1Before, 
        this.out.depthwise_AvgMax_Or_ChannelMultiplier, this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth,
        this.out.depthwiseStridesPad );
    }

    return this;
  }

  /**
   * @override
   */
  onYield_isLegal() {

    // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {

      if ( this.out.pointwise1ChannelCount > 0 ) {

        // depthwise2 (processing input0) must have the same input channel count as depthwise1 (processing pointwise1 result).
        // So that the results of depthwise1 and depthwise2 both have the same output channel count.
        if ( this.out.channelCount0_pointwise1Before != this.out.pointwise1ChannelCount )
          return false;

      // For ( pointwise1ChannelCount > 0 ), pointwise1 result is just the input0 itself (i.e. always the same).
      }

    // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    } else if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) {

      // The input and output channel count must be the same. Otherwise, the concat2-split-shuffle could not operate properly.
      if ( this.out.channelCount0_pointwise1Before != this.out.pointwise21ChannelCount )
        return false;
    }

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    switch ( this.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:

        switch ( this.out.channelCount1_pointwise1Before ) { // bHigherHalfDifferent
          case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4) (ShuffleNetV2_ByMobileNetV1's head)
          case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH: // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
            return false;
            break;
        }
    }

    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    if ( 0 == this.out.depthwiseStridesPad ) {

      if (   ( this.out.depthwiseFilterHeight > this.out.inputHeight0 )
          || ( this.out.depthwiseFilterWidth  > this.out.inputWidth0  ) )
        return false;

    // Otherwise, when pad is "same", it should test more filter size.
    }

    return true;
  }
  
  /**
   * @override
   */
  onYield_before() {
    // For testing not start at the offset 0.
    let weightsElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }

  /**
   * @override
   */
  onYield_after() {
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    let depthwiseFilterMaxSize = 5;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.valueOutMinMax = {
      pointwise1ChannelCount: [ 0, 0 + 3 - 1 ],
      pointwise21ChannelCount: [ 1, 1 + 3 - 1 ],

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( undefined )) for speeding up testing.
//      Bias: undefined,
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

//      ActivationId: undefined,
//       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      inputHeight0: [ 3, 3 ],
      inputWidth0: [ 4, 5 ],

      channelCount0_pointwise1Before: [
        PointDepthPoint.Params.channelCount0_pointwise1Before.valueDesc.range.min,
        PointDepthPoint.Params.channelCount0_pointwise1Before.valueDesc.range.min + 4 - 1
      ],

      // Test all named values plus two more un-named values.
      channelCount1_pointwise1Before: [
        ValueDesc.channelCount1_pointwise1Before.Singleton.range.min,
        ValueDesc.channelCount1_pointwise1Before.Singleton.range.min
          + ValueDesc.channelCount1_pointwise1Before.Singleton.integerToNameMap.size + 2 - 1
      ],

      depthwise_AvgMax_Or_ChannelMultiplier: [
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.min,
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.min + 5 - 1
      ],

      // (2021/10/06) Note: WASM seems not correct when ( depthwiseFilterHeight == 1 ) and ( depthwiseFilterWidth == 1 ).
      depthwiseFilterHeight: [ PointDepthPoint.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ PointDepthPoint.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],

//      depthwiseStridesPad: undefined,
      depthwiseStridesPad: [
        PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.min,
        PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.max
      ],

//      bOutput1Requested: undefined,
      bOutput1Requested: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

      bKeepInputTensor: undefined,
//      bKeepInputTensor: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( PointDepthPoint.Params.inputHeight0,            this.valueOutMinMax.inputHeight0 ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.inputWidth0,             this.valueOutMinMax.inputWidth0 ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ChannelCount, this.valueOutMinMax.pointwise21ChannelCount ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise21Bias,        this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ActivationId, this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bOutput1Requested,       this.valueOutMinMax.bOutput1Requested ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise1Bias,         this.valueOutMinMax.Bias ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.channelCount0_pointwise1Before,
                                                                                      this.valueOutMinMax.channelCount0_pointwise1Before ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.channelCount1_pointwise1Before,
                                                                                      this.valueOutMinMax.channelCount1_pointwise1Before ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier,
                                                                                      this.valueOutMinMax.depthwise_AvgMax_Or_ChannelMultiplier ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseFilterHeight,   this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseFilterWidth,    this.valueOutMinMax.depthwiseFilterWidth ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseStridesPad,     this.valueOutMinMax.depthwiseStridesPad ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bDepthwiseBias,          this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseActivationId,   this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ActivationId,  this.valueOutMinMax.ActivationId ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ChannelCount,  this.valueOutMinMax.pointwise1ChannelCount ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bKeepInputTensor,        this.valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {number} pointwise1ChannelCount The output channel count of the pointwise1 convolution.
   * @param {string} pointwiseName          A string for debug message of the pointwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise1 convolution, bias and activation.
   */
  use_pointwise1( inputImage, pointwise1ChannelCount, pointwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_pointwise( pointwise1ChannelCount,
      this.in.paramsNumberArrayObject.pointwise1Filters, this.out.bPointwise1Bias,
      this.in.paramsNumberArrayObject.pointwise1Biases, this.out.pointwise1ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {number} pointwise1ChannelCount The output channel count of this pointwise1 pass-through convolution.
   * @param {string} pointwiseName          A string for debug message of the pointwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise1 convolution, bias and activation.
   */
  use_pointwise1_PassThrough( inputImage, pointwise1ChannelCount, pointwiseName, parametersDesc ) {
    let pointwisePassThrough = new ( Pointwise.PassThrough_FiltersArray_BiasesArray() )(
      inputImage.depth, pointwise1ChannelCount, 0, this.out.bPointwise1Bias, 1, 0 );

//!!! ...unfinished... (2022/04/25) How to let NumberImage.cloneBy_Xxx() fill imageOut's boundsArraySet.bPassThrough[] to true?

    let result = inputImage.cloneBy_pointwise( pointwise1ChannelCount,
      pointwisePassThrough.filtersArray, this.out.bPointwise1Bias,
      pointwisePassThrough.biasesArray, this.out.pointwise1ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise1 convolution, bias and activation.
   */
  use_depthwise1( inputImage, depthwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_depthwise( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth, this.out.depthwiseStridesPad,
      this.in.paramsNumberArrayObject.depthwise1Filters, this.out.bDepthwiseBias,
      this.in.paramsNumberArrayObject.depthwise1Biases, this.out.depthwiseActivationId, depthwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise1 convolution, bias and activation.
   */
  use_depthwise1_PassThrough( inputImage, depthwiseName, parametersDesc ) {

    let depthwisePassThrough = new ( Depthwise.PassThrough_FiltersArray_BiasesArray() )( inputImage.height, inputImage.width, inputImage.depth,
      this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth, this.out.depthwiseStridesPad,
      this.out.bDepthwiseBias, 1, 0 );

//!!! ...unfinished... (2022/04/25) How to let NumberImage.cloneBy_Xxx() fill imageOut's boundsArraySet.bPassThrough[] to true?

    let result = inputImage.cloneBy_depthwise( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth, this.out.depthwiseStridesPad,
      depthwisePassThrough.filtersArray, this.out.bDepthwiseBias,
      depthwisePassThrough.biasesArray, this.out.depthwiseActivationId, depthwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise2 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise2 convolution, bias and activation.
   */
  use_depthwise2( inputImage, depthwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_depthwise( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth, this.out.depthwiseStridesPad,
      this.in.paramsNumberArrayObject.depthwise2Filters, this.out.bDepthwiseBias,
      this.in.paramsNumberArrayObject.depthwise2Biases, this.out.depthwiseActivationId, depthwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise21ChannelCount The output channel count of the pointwise21 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise21 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise21 convolution, bias and activation.
   */
  use_pointwise21( inputImage, pointwise21ChannelCount, pointwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_pointwise( pointwise21ChannelCount,
      this.in.paramsNumberArrayObject.pointwise21Filters, this.out.bPointwise21Bias,
      this.in.paramsNumberArrayObject.pointwise21Biases, this.out.pointwise21ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * Pointwise212 uses the same channel count, bias flag and activation function as Pointwise21 (i.e. pointwise21ChannelCount, bPointwise21Bias
   * and pointwise21ActivationId), but uses different filters and biases weights (i.e. pointwise212Filters and pointwise212Biases)
   *
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise21ChannelCount The output channel count of the pointwise212 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise212 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise212 convolution, bias and activation.
   */
  use_pointwise212( inputImage, pointwise21ChannelCount, pointwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_pointwise( pointwise21ChannelCount,
      this.in.paramsNumberArrayObject.pointwise212Filters, this.out.bPointwise21Bias,
      this.in.paramsNumberArrayObject.pointwise212Biases, this.out.pointwise21ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise21ChannelCount The output channel count of this pointwise21 pass-through convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise1 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise21 pass-through convolution and bias.
   */
  use_pointwise21_PassThrough( inputImage, pointwise21ChannelCount, pointwiseName, parametersDesc ) {
    let pointwisePassThrough = new ( Pointwise.PassThrough_FiltersArray_BiasesArray() )(
      inputImage.depth, pointwise21ChannelCount, 0, this.out.bPointwise21Bias, 1, 0 );

//!!! ...unfinished... (2022/04/25) How to let NumberImage.cloneBy_Xxx() fill imageOut's boundsArraySet.bPassThrough[] to true?

    let result = inputImage.cloneBy_pointwise( pointwise21ChannelCount,
      pointwisePassThrough.filtersArray, this.out.bPointwise21Bias,
      pointwisePassThrough.biasesArray, this.out.pointwise21ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise22ChannelCount The output channel count of the pointwise22 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise22 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise22 convolution, bias and activation.
   */
  use_pointwise22( inputImage, pointwise22ChannelCount, pointwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_pointwise( pointwise22ChannelCount,
      this.in.paramsNumberArrayObject.pointwise22Filters, this.out.bPointwise22Bias,
      this.in.paramsNumberArrayObject.pointwise22Biases, this.out.pointwise22ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /**
   * Pointwise222 uses the same channel count, bias flag and activation function as Pointwise22 (i.e. pointwise22ChannelCount, bPointwise22Bias
   * and pointwise22ActivationId), but uses different filters and biases weights (i.e. pointwise222Filters and pointwise222Biases)
   *
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise22ChannelCount The output channel count of the pointwise222 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise222 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise222 convolution, bias and activation.
   */
  use_pointwise222( inputImage, pointwise22ChannelCount, pointwiseName, parametersDesc ) {
    let result = inputImage.cloneBy_pointwise( pointwise22ChannelCount,
      this.in.paramsNumberArrayObject.pointwise222Filters, this.out.bPointwise22Bias,
      this.in.paramsNumberArrayObject.pointwise222Biases, this.out.pointwise22ActivationId, pointwiseName, parametersDesc );
    return result;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (-4) (ShuffleNetV2_ByMobileNetV1's head). */
  channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (-5) (ShuffleNetV2_ByMobileNetV1's body/tail). */
  channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (-3) (ShuffleNetV2's body/tail). */
  channelCount1_pointwise1Before__is__TWO_INPUTS_CONCAT_POINTWISE21_INPUT1() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head)
   * (simplified)). */
  channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (-1) (MobileNetV2). */
  channelCount1_pointwise1Before__is__ONE_INPUT_ADD_TO_OUTPUT() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is ( 0) (MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2)). */
  channelCount1_pointwise1Before__is__ONE_INPUT() {
    if ( this.out.channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.channelCount1_pointwise1Before is (> 0) (TWO_INPUTS_XXX). */
  channelCount1_pointwise1Before__is__TWO_INPUTS() {
    if ( this.out.channelCount1_pointwise1Before > 0 )
      return true;
    return false;
  }

  /**
   * @return {number[]}
   *   Return a number array.
   */
  static generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax ) {
//!!! (2021/07/20 Temp Remarked) Fix to non-random to simplify debug.
    return RandTools.generate_numberArray( elementCount, randomOffsetMin, randomOffsetMax );
//    return RandTools.generate_numberArray( elementCount, 0, 0 );
  }

  /**
   * @param {number} inputChannelCount
   *   The channel count of the pointwise convolution's input.
   *
   * @param {number} outputChannelCount
   *   The channel count of the pointwise convolution's output. If ( outputChannelCount <= 0 ), means this pointwise convolution does not exist.
   *
   * @param {boolean} bBias
   *   If true, the returned array will contain a number array as the bias' weight values. If ( outputChannelCount <= 0 ), this will be ignored.
   *
   * @return {object}
   *   Return an object { outputChannelCount, numberArrayArray }. The outputChannelCount is the channel count of this pointwise operation.
   * The numberArrayArray is an array. Its every element is a number array. At most, numberArrayArray will contain two number array and
   * look like [ pointwiseFiltersArray, pointwiseBiasesArray ]. But it may also be no element (i.e. an empty array).
   */
  static generate_pointwise_filters_biases( inputChannelCount, outputChannelCount, bBias ) {
    let result = {
      outputChannelCount: inputChannelCount, // If this pointwise operation does not exist, default outputChannelCount will be inputChannelCount.
      numberArrayArray: []
    };

    if ( outputChannelCount > 0 ) {
      result.outputChannelCount = outputChannelCount;

      let filtersWeightsRandomOffset = { min: -100, max: +100 };
      let filtersWeightsCount = inputChannelCount * outputChannelCount;
      let filtersArray = Base.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray[ 0 ] = filtersArray;

      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = Base.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray[ 1 ] = biasesArray;
      }
    }

    return result;
  }

  /**
   * @param {number} inputChannelCount
   *   The channel count of the depthwise convolution's input.
   *
   * @param {boolean} bBias
   *   If true, the returned array will contain a number array as the bias' weight values. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ),
   * this will be ignored.
   *
   * @return {object}
   *   Return an object { outputChannelCount, numberArrayArray }. The outputChannelCount is the channel count of this depthwise operation.
   * The numberArrayArray is an array. Its every element is a number array. At most, numberArrayArray will contain two number array and
   * look like [ depthwiseFiltersArray, depthwiseBiasesArray ]. But it may also be no element (i.e. an empty array).
   */
  static generate_depthwise_filters_biases(
    inputChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bBias ) {

    let result = {
      outputChannelCount: inputChannelCount, // If this depthwise operation does not exist, default outputChannelCount will be inputChannelCount.
      numberArrayArray: []
    };

    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      result.outputChannelCount = inputChannelCount * depthwise_AvgMax_Or_ChannelMultiplier;

      let filtersWeightsRandomOffset = { min: -100, max: +100 };
      let filtersWeightsCount = result.outputChannelCount * ( depthwiseFilterHeight * depthwiseFilterWidth );
      let filtersArray = Base.generate_numberArray( filtersWeightsCount, filtersWeightsRandomOffset.min, filtersWeightsRandomOffset.max );
      result.numberArrayArray[ 0 ] = filtersArray; // Note: if AVG or MAX pooling, depthwise.numberArrayArray[ 0 ] will be undefined.
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
      if ( bBias ) {
        let biasesWeightsRandomOffset = { min: -100, max: +100 };
        let biasesWeightsCount = result.outputChannelCount;
        let biasesArray = Base.generate_numberArray( biasesWeightsCount, biasesWeightsRandomOffset.min, biasesWeightsRandomOffset.max );
        result.numberArrayArray[ 1 ] = biasesArray;
      }
    }

    return result;
  }

  /**
   *
   * @param {PointDepthPoint_TestParams.Base} this
   *   The TestParam object to be referenced (and modified).
   *
   */
  generate_Filters_Biases() {

    let paramsAll = this.out;
    let io_paramsNumberArrayObject = this.in.paramsNumberArrayObject;

    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use similar calculation logic:
    //    ONE_INPUT_HALF_THROUGH                   // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    //    TWO_INPUTS_CONCAT_POINTWISE21_INPUT1     // (-3) (ShuffleNetV2's body/tail)
    //
    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use similar calculation logic:
    //    ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    //    ONE_INPUT_TWO_DEPTHWISE                  // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))


    let channelCount0_pointwise1Before_original = paramsAll.channelCount0_pointwise1Before;
    let pointwise1ChannelCount_original = paramsAll.pointwise1ChannelCount;
    let pointwise21ChannelCount_original = paramsAll.pointwise21ChannelCount;

    // In ShuffleNetV2_ByMobileNetV1's head:
    //   - pointwise21ChannelCount.
    //     - Double it in paramsAll and io_paramsNumberArrayObject (if existed).
    //   - Use original the above parameters twice to generate filters and biases weights.
    //     - pointwise21 and pointwise212
    //
    // The reason is that PointDepthPoint will only extract filters and biases weights of the above parameters twice in this case.
    //
    if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
      this.doubleParamValue( PointDepthPoint.Params.pointwise21ChannelCount );

    // In ShuffleNetV2_ByMobileNetV1's body/tail:
    //   - channelCount0_pointwise1Before, pointwise21ChannelCount.
    //     - Double them in paramsAll and io_paramsNumberArrayObject (if existed).
    //   -  pointwise1ChannelCount.
    //     - Adjust it in paramsAll and io_paramsNumberArrayObject (if existed).
    //   - But use original the above parameters to generate filters weights.
    //
    // The reason is that PointDepthPoint will only extract filters weights of half the above parameters in this case.
    //
    } else if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
      this.doubleParamValue( PointDepthPoint.Params.channelCount0_pointwise1Before );

      if ( pointwise1ChannelCount_original == 0 ) {
        // When the output channel count is not specified, keep it zero.

      } else {
        let outputChannelCount_lowerHalf_pointwise1 = pointwise1ChannelCount_original;

        // Because input0's channel count has been doubled (in the above), the higher half is just the same as the original input0's channel count.
        let inputChannelCount_higherHalf_pointwise1 = channelCount0_pointwise1Before_original;

        let pointwise1ChannelCount_enlarged = outputChannelCount_lowerHalf_pointwise1 + inputChannelCount_higherHalf_pointwise1;
        this.modifyParamValue( PointDepthPoint.Params.pointwise1ChannelCount, pointwise1ChannelCount_enlarged );
      }

      this.doubleParamValue( PointDepthPoint.Params.pointwise21ChannelCount );
    }

    // Pointwise1
    let pointwise1 = Base.generate_pointwise_filters_biases( channelCount0_pointwise1Before_original,
      pointwise1ChannelCount_original, paramsAll.bPointwise1Bias );

    io_paramsNumberArrayObject.pointwise1Filters = pointwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.pointwise1Biases =  pointwise1.numberArrayArray[ 1 ];

    // Depthwise1
    let depthwise1 = Base.generate_depthwise_filters_biases( pointwise1.outputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
      paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

    io_paramsNumberArrayObject.depthwise1Filters = depthwise1.numberArrayArray[ 0 ];
    io_paramsNumberArrayObject.depthwise1Biases =  depthwise1.numberArrayArray[ 1 ];

    // Depthwise2
    let depthwise2;
    {
      // In ShuffleNetV2's head.
      if (   ( this.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) // (-2) (ShuffleNetV2's head (simplified))
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
         ) {

        let depthwise2_inputChannelCount;

        if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) { // (-2) (ShuffleNetV2's head (simplified))
          depthwise2_inputChannelCount = paramsAll.channelCount0_pointwise1Before; // Use input0.

        // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        //
        // Use pointwise1.outputChannelCount as input1ChannelCount so that it has the same structure of depthwise1 and pointwise21.
        //
        } else if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {
          depthwise2_inputChannelCount = pointwise1.outputChannelCount;
        }

        depthwise2 = Base.generate_depthwise_filters_biases( depthwise2_inputChannelCount,
          paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
          paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias );

        io_paramsNumberArrayObject.depthwise2Filters = depthwise2.numberArrayArray[ 0 ];
        io_paramsNumberArrayObject.depthwise2Biases =  depthwise2.numberArrayArray[ 1 ];

      // no depthwise2.
      } else {
        io_paramsNumberArrayObject.depthwise2Filters = io_paramsNumberArrayObject.depthwise2Biases = undefined;
      }
    }

    // Concat
    let pointwise2_inputChannelCount = depthwise1.outputChannelCount;
    {
      if (   ( this.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) // (-2) (ShuffleNetV2's head (simplified))
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
         ) {
        pointwise2_inputChannelCount += depthwise2.outputChannelCount; // Add the channel count of the branch of the first input image.


      // (> 0) Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_XXX  (simplified ShuffleNetV2's tail)
      } else if ( paramsAll.channelCount1_pointwise1Before > 0 ) {
        pointwise2_inputChannelCount += paramsAll.channelCount1_pointwise1Before; // Add the channel count of the second input image.
      }
    }

    // Pointwise21
    {    
      let pointwise21 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise21ChannelCount_original, paramsAll.bPointwise21Bias );

      io_paramsNumberArrayObject.pointwise21Filters = pointwise21.numberArrayArray[ 0 ];
      io_paramsNumberArrayObject.pointwise21Biases =  pointwise21.numberArrayArray[ 1 ];

      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise212 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          pointwise21ChannelCount_original, paramsAll.bPointwise21Bias );

        io_paramsNumberArrayObject.pointwise212Filters = pointwise212.numberArrayArray[ 0 ];
        io_paramsNumberArrayObject.pointwise212Biases =  pointwise212.numberArrayArray[ 1 ];

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        io_paramsNumberArrayObject.pointwise212Filters = io_paramsNumberArrayObject.pointwise212Biases = undefined;
      }
    }

    // Pointwise22
    {
      let pointwise22ChannelCount;

      // In ShuffleNetV2's body/tail, there is always no pointwise22.
      if (   ( this.channelCount1_pointwise1Before__is__TWO_INPUTS_CONCAT_POINTWISE21_INPUT1() ) // (-3) (ShuffleNetV2's body/tail)
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
         ) {
        pointwise22ChannelCount = 0;

      // Otherwise, if output1 is requested, pointwise22's output channel count is the same as pointwise21's.
      } else if ( paramsAll.bOutput1Requested ) {

        pointwise22ChannelCount = pointwise21ChannelCount_original;
      }

      let bPointwise22Bias = paramsAll.bPointwise21Bias; // pointwise22's bias flag should always be the same as pointwise21's.

      let pointwise22 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise22ChannelCount, bPointwise22Bias );

      io_paramsNumberArrayObject.pointwise22Filters = pointwise22.numberArrayArray[ 0 ];
      io_paramsNumberArrayObject.pointwise22Biases =  pointwise22.numberArrayArray[ 1 ];
      
      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise222 = Base.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          pointwise22ChannelCount, bPointwise22Bias );

        io_paramsNumberArrayObject.pointwise222Filters = pointwise222.numberArrayArray[ 0 ];
        io_paramsNumberArrayObject.pointwise222Biases =  pointwise222.numberArrayArray[ 1 ];

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        io_paramsNumberArrayObject.pointwise222Filters = io_paramsNumberArrayObject.pointwise222Biases = undefined;
      }

    }
  }

  /**
   *
   * @param {ParamDesc.Xxx} paramDesc
   *   The parameter to be doubled.
   */
  doubleParamValue( paramDesc ) {
    let paramName = paramDesc.paramName;

    let outValue_original = this.out[ paramName ];
    if ( outValue_original == undefined )
      return; // The parameter does not exist. No need to modify it.

    let outValue_doubled = outValue_original * 2;
    this.modifyParamValue( paramDesc, outValue_doubled );
  }

}

/**
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of PointDepthPoint.initer().
 */
Base.paramsNameOrderArray = [
  PointDepthPoint.Params.inputHeight0.paramName,
  PointDepthPoint.Params.inputWidth0.paramName,
  PointDepthPoint.Params.channelCount0_pointwise1Before.paramName,
  PointDepthPoint.Params.channelCount1_pointwise1Before.paramName,
  PointDepthPoint.Params.pointwise1ChannelCount.paramName,
  PointDepthPoint.Params.bPointwise1Bias.paramName,
  PointDepthPoint.Params.pointwise1ActivationId.paramName,
  PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.paramName,
  PointDepthPoint.Params.depthwiseFilterHeight.paramName,
  PointDepthPoint.Params.depthwiseFilterWidth.paramName,
  PointDepthPoint.Params.depthwiseStridesPad.paramName,
  PointDepthPoint.Params.bDepthwiseBias.paramName,
  PointDepthPoint.Params.depthwiseActivationId.paramName,
  PointDepthPoint.Params.pointwise21ChannelCount.paramName,
  PointDepthPoint.Params.bPointwise21Bias.paramName,
  PointDepthPoint.Params.pointwise21ActivationId.paramName,
  PointDepthPoint.Params.bOutput1Requested.paramName,

  PointDepthPoint.Params.bKeepInputTensor.paramName,
  
  "pointwise1Filters",
  "pointwise1Biases",

  "depthwise1Filters",
  "depthwise1Biases",

  "depthwise2Filters",
  "depthwise2Biases",

  "pointwise21Filters",
  "pointwise21Biases",

  "pointwise212Filters",
  "pointwise212Biases",

  "pointwise22Filters",
  "pointwise22Biases",

  "pointwise222Filters",
  "pointwise222Biases",
];
