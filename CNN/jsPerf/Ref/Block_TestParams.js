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
import * as Block from "../../Conv/Block.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of the Block.Params's constructor. That is,
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
 *   The "out" sub-object's data members represent the "should-be" result of Block.Params's extract().
 * That is, it has the above data members except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 */
class Base extends TestParams.Base {

  /**
   *
   */
  constructor() {
   super();

   this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag = new Pointwise.PassThrough_FiltersArray_BiasesArray_Bag();
   this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag = new Depthwise.PassThrough_FiltersArray_BiasesArray_Bag();

   // A pre-allocated ArrayBuffer which could be re-allocated when needed to get Float32Array. (For reducing memory re-allocation.)
   this.Float32Array_ByteOffsetBegin = new NameNumberArrayObject_To_Float32Array.Base();
  }

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.out
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsScattered(
    inputHeight0, inputWidth0,
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    bOutput1Requested,
    bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      inputHeight0, inputWidth0,
      channelCount0_pointwise1Before,
      channelCount1_pointwise1Before,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      bDepthwiseBias, depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor,
      pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
      bOutput1Requested,
      bKeepInputTensor
    };

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightsElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
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
  set_byParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {

    this.generate_depthwisePadInfo();
    this.generate_Filters_Biases();

    // Pack all parameters, filters, biases weights into a (pre-allocated and re-used) Float32Array.
    this.Float32Array_ByteOffsetBegin.setByConcat( Base.paramsNameOrderArray, this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = this.Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = this.Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    return this;
  }

  /**
   */
  generate_depthwisePadInfo() {
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

//!!! (2022/05/26 Remarked) higher-half still can not be pass-through.
//             if (   ( this.out.bDepthwiseBias != false )
//                 || ( this.out.depthwiseActivationId != ValueDesc.ActivationFunction.Singleton.Ids.NONE ) // (0)
//                ) {
//               return false;
//
//             // Only if no bias and no activation, avg/max pooling is possible because undo/do activation-escaping could be ignored.
//             }

            break;
        }
    }

    // (2021/07/20)
    // Note: In backend WASM, when filter width is 1 (note: filter height does not have this issue and could be 1), it seems that
    // tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() will calculate wrongly. In backend CPU and WebGL, this problem does
    // not exist.
    //
    // (2022/05/01)
    // The tensorflow.js team seems not recognize this issue as a problem and will not fix it. So, we need get around it by
    // ourselves testing procedure.
    if ( tf.getBackend() == "wasm" ) {

      // For depthwise1/depthwis2.
      if (   ( this.out.depthwise_AvgMax_Or_ChannelMultiplier != ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) // (0)
          && ( this.out.depthwiseFilterWidth == 1 )
         )
        return false;

      let pointwise2_inputWidth;
      {
        if ( this.out.depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) { // (0)
          pointwise2_inputWidth = this.out.inputWidth0;
        } else {
          this.generate_depthwisePadInfo(); // So that this.out.depthwisePadInfo is usable.
          pointwise2_inputWidth = this.out.depthwisePadInfo.outputWidth;
        }
      }

      // For squeeze-and-excitation.
      //
      // (squeeze is an average pooling. Its filter width is the same as inputWidth (i.e. pointwise2_inputWidth).)
      if (   ( pointwise2_inputWidth == 1 )
          && ( ValueDesc.SqueezeExcitationChannelCountDivisor.hasSqueeze( this.out.nSqueezeExcitationChannelCountDivisor ) )
         )
        return false;
    }

    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    if ( ValueDesc.StridesPad.pad_isValid( this.out.depthwiseStridesPad ) ) {

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

    this.set_byParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
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

    // (2022/04/30 Remarked) For speed up testing by reduce testing space.
    //let depthwiseFilterMaxSize = 5;
    let depthwiseFilterMaxSize = 3;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.valueOutMinMax = {
//!!! (2022/04/28 Temp) For testing large channel count.
//      pointwise1ChannelCount: [ 2, 0 + 3 - 1 ],
      pointwise1ChannelCount: [ 0, 0 + 3 - 1 ],

      pointwise21ChannelCount: [ 1, 1 + 3 - 1 ],

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( undefined )) for speeding up testing.
      Bias: undefined,
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

//       ActivationId: undefined,
//       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      inputHeight0: [ 3, 3 ],
      inputWidth0: [ 4, 5 ],

      channelCount0_pointwise1Before: [
        Block.Params.channelCount0_pointwise1Before.valueDesc.range.min,
        Block.Params.channelCount0_pointwise1Before.valueDesc.range.min + 4 - 1
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

      // (2021/10/06) Note: WASM seems not correct when tf.pool() or tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).
      depthwiseFilterHeight: [ Block.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ Block.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],

      // (2022/05/02) Note: The right-most pixel of depthwise convolution seems wrong when ( strides = 1, pad = "same" ) in backend
      // WebGL of some platforms (e.g. mobile phone Moto e40). But the issue does not exist when ( strides = 2, pad = "same" ) or
      // ( pad = "valid" ) in those platforms.
      //
//      depthwiseStridesPad: undefined,
//!!! (2022/05/01 Temp Remarked) For debug (mobile phone).
      depthwiseStridesPad: [
        Block.Params.depthwiseStridesPad.valueDesc.range.min,
        Block.Params.depthwiseStridesPad.valueDesc.range.max
      ],
//       depthwiseStridesPad: [
// //        ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME, // (1)
//         ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME, // (2)
//         ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME, // (2)
// //        ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID,  // (3)
//       ],

//      bSqueezeExcitationPrefix: undefined,
//      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

      nSqueezeExcitationChannelCountDivisor: [
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
        4
        //ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min + 7 - 1
        //ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.max
      ],

      bOutput1Requested: undefined,
//      bOutput1Requested: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
//      bOutput1Requested: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

//      bKeepInputTensor: undefined,
      bKeepInputTensor: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( Block.Params.inputHeight0,            this.valueOutMinMax.inputHeight0 ),
      new TestParams.ParamDescConfig( Block.Params.inputWidth0,             this.valueOutMinMax.inputWidth0 ),

      new TestParams.ParamDescConfig( Block.Params.pointwise21ChannelCount, this.valueOutMinMax.pointwise21ChannelCount ),
      new TestParams.ParamDescConfig( Block.Params.bPointwise21Bias,        this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( Block.Params.pointwise21ActivationId, this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( Block.Params.bOutput1Requested,       this.valueOutMinMax.bOutput1Requested ),

      new TestParams.ParamDescConfig( Block.Params.bPointwise1Bias,         this.valueOutMinMax.Bias ),

      new TestParams.ParamDescConfig( Block.Params.channelCount0_pointwise1Before,
                                                                            this.valueOutMinMax.channelCount0_pointwise1Before ),

      new TestParams.ParamDescConfig( Block.Params.channelCount1_pointwise1Before,
                                                                            this.valueOutMinMax.channelCount1_pointwise1Before ),

      new TestParams.ParamDescConfig( Block.Params.depthwise_AvgMax_Or_ChannelMultiplier,
                                                                            this.valueOutMinMax.depthwise_AvgMax_Or_ChannelMultiplier ),

      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterHeight,   this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterWidth,    this.valueOutMinMax.depthwiseFilterWidth ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseStridesPad,     this.valueOutMinMax.depthwiseStridesPad ),
      new TestParams.ParamDescConfig( Block.Params.bDepthwiseBias,          this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseActivationId,   this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( Block.Params.pointwise1ActivationId,  this.valueOutMinMax.ActivationId ),
      new TestParams.ParamDescConfig( Block.Params.pointwise1ChannelCount,  this.valueOutMinMax.pointwise1ChannelCount ),

      new TestParams.ParamDescConfig( Block.Params.bKeepInputTensor,        this.valueOutMinMax.bKeepInputTensor ),

  
      new TestParams.ParamDescConfig( Block.Params.bSqueezeExcitationPrefix,
                                                                            this.valueOutMinMax.bSqueezeExcitationPrefix ),

      new TestParams.ParamDescConfig( Block.Params.nSqueezeExcitationChannelCountDivisor,
                                                                            this.valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

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
    let result = inputImage.clone_byPointwise_NonPassThrough( pointwise1ChannelCount,
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
    let result = inputImage.clone_byPointwise_PassThrough( pointwise1ChannelCount,
      this.out.bPointwise1Bias, this.out.pointwise1ActivationId,
      this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      pointwiseName, parametersDesc );
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
    let result = inputImage.clone_byDepthwise_NonPassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
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
    let result = inputImage.clone_byDepthwise_PassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth, this.out.depthwiseStridesPad,
      this.out.bDepthwiseBias, this.out.depthwiseActivationId,
      this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      depthwiseName, parametersDesc );
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
    let result = inputImage.clone_byDepthwise_NonPassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
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
    let squeezeExcitationOut = inputImage;
    if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
      squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
        this.out.nSqueezeExcitationChannelCountDivisor,
        this.in.paramsNumberArrayObject.pointwise21SEIntermediateFilters,
        this.in.paramsNumberArrayObject.pointwise21SEIntermediateBiases,
        this.in.paramsNumberArrayObject.pointwise21SEExcitationFilters,
        this.in.paramsNumberArrayObject.pointwise21SEExcitationBiases,
        this.out.pointwise21ActivationId,
        `${pointwiseName}_squeezeExcitation`, parametersDesc );

    // Without clone to improve performance.
    }

    let result = squeezeExcitationOut.clone_byPointwise_NonPassThrough( pointwise21ChannelCount,
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
    let squeezeExcitationOut = inputImage;
    if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
      squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
        this.out.nSqueezeExcitationChannelCountDivisor,
        this.in.paramsNumberArrayObject.pointwise212SEIntermediateFilters,
        this.in.paramsNumberArrayObject.pointwise212SEIntermediateBiases,
        this.in.paramsNumberArrayObject.pointwise212SEExcitationFilters,
        this.in.paramsNumberArrayObject.pointwise212SEExcitationBiases,
        this.out.pointwise21ActivationId,
        `${pointwiseName}_squeezeExcitation`, parametersDesc );

    // Without clone to improve performance.
    }

    let result = squeezeExcitationOut.clone_byPointwise_NonPassThrough( pointwise21ChannelCount,
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
    let squeezeExcitationOut = inputImage;
    if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
      squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_PassThrough(
        this.out.nSqueezeExcitationChannelCountDivisor,
        this.out.pointwise21ActivationId,
        this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
        `${pointwiseName}_squeezeExcitation`, parametersDesc );

    // Without clone to improve performance.
    }

    let result = inputImage.clone_byPointwise_PassThrough( pointwise21ChannelCount,
      this.out.bPointwise21Bias, this.out.pointwise21ActivationId,
      this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      pointwiseName, parametersDesc );
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
    let squeezeExcitationOut = inputImage;
    if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
      squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
        this.out.nSqueezeExcitationChannelCountDivisor,
        this.in.paramsNumberArrayObject.pointwise22SEIntermediateFilters,
        this.in.paramsNumberArrayObject.pointwise22SEIntermediateBiases,
        this.in.paramsNumberArrayObject.pointwise22SEExcitationFilters,
        this.in.paramsNumberArrayObject.pointwise22SEExcitationBiases,
        this.out.pointwise21ActivationId, // (Note: Not pointwise22ActivationId)
        `${pointwiseName}_squeezeExcitation`, parametersDesc );

    // Without clone to improve performance.
    }

    let result = inputImage.clone_byPointwise_NonPassThrough( pointwise22ChannelCount,
      this.in.paramsNumberArrayObject.pointwise22Filters, this.out.bPointwise21Bias, // (Note: Not bPointwise22Bias)
      this.in.paramsNumberArrayObject.pointwise22Biases, this.out.pointwise21ActivationId, // (Note: Not pointwise22ActivationId)
      pointwiseName, parametersDesc );
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
    let squeezeExcitationOut = inputImage;
    if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
      squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
        this.out.nSqueezeExcitationChannelCountDivisor,
        this.in.paramsNumberArrayObject.pointwise222SEIntermediateFilters,
        this.in.paramsNumberArrayObject.pointwise222SEIntermediateBiases,
        this.in.paramsNumberArrayObject.pointwise222SEExcitationFilters,
        this.in.paramsNumberArrayObject.pointwise222SEExcitationBiases,
        this.out.pointwise21ActivationId, // (Note: Not pointwise22ActivationId)
        `${pointwiseName}_squeezeExcitation`, parametersDesc );

    // Without clone to improve performance.
    }

    let result = inputImage.clone_byPointwise_NonPassThrough( pointwise22ChannelCount,
      this.in.paramsNumberArrayObject.pointwise222Filters, this.out.bPointwise21Bias, // (Note: Not bPointwise22Bias)
      this.in.paramsNumberArrayObject.pointwise222Biases, this.out.pointwise21ActivationId, // (Note: Not pointwise22ActivationId)
      pointwiseName, parametersDesc );
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
   * Fill an object's property as a number array.
   * Similar to Base.ensure_object_property_numberArray_length_filled(). But the property will be a shared number array. Its value
   * may be shared with other caller.
   *
   * This may have better performance because of number array re-using (instead of re-generating).
   *
   *
   * @param {object} io_object     The object to be checked and modified.
   * @param {string} propertyName  The property io_object[ propertyName ] will be ensured as a number array.
   * @param {number} elementCount  The property io_object[ propertyName ].length will be ensured as elementCount.
   */
  fill_object_property_numberArray( io_object, propertyName, elementCount ) {

    //!!! (2022/05/23 Remarked)
    //Base.ensure_object_property_numberArray_length_filled( io_object, propertyName,
    //  elementCount, Base.weightsRandomOffset.min, Base.weightsRandomOffset.max );

    super.ensure_object_property_numberArray_length_existed( io_object, propertyName,
      elementCount, Base.weightsRandomOffset.min, Base.weightsRandomOffset.max );
  }

  /**
   * @member {number} nSqueezeExcitationChannelCountDivisor
   *   An integer represents the channel count divisor for squeeze-and-excitation's intermediate pointwise convolution channel count.
   * (Please see also SqueezeExcitation.Base.nSqueezeExcitationChannelCountDivisor explanation.)
   *
   * @param {number} inputChannelCount
   *   The channel count of the squeeze-and-excitation's input.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of the squeeze-and-excitation.
   *
   * @param {string} propertyNamePrefix
   *   The name prefix of the result property in the o_numberArrayObject.
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * four properties may be set: "xxxSEIntermediateFilters", "xxxSEIntermediateBiases", "xxxSEExcitationFilters",
   * "xxxSEExcitationBiases". The "xxx" is the propertyNamePrefix.
   *
   * @return {number}
   *   Return the outputChannelCount of this squeeze-and-excitation operation.
   */
  generate_squeezeExcitation_filters_biases(
    nSqueezeExcitationChannelCountDivisor,

//!!! (2022/05/29 Remarked)
//    inputChannelCount, outputChannelCount, nActivationId, propertyNamePrefix, io_numberArrayObject ) {

//!!! ...unfinished... (2022/05/29)
    inputChannelCount,
    outputChannelCount_lowerHalf, outputChannelCount_higherHalf,
    nActivationId,
    propertyNamePrefix_lowerHalf, propertyNamePrefix_higherHalf, io_numberArrayObject ) {

    // 0.
    let bSqueeze, bIntermediate, bExcitation;
    {
      if ( nSqueezeExcitationChannelCountDivisor <= 0 ) {
        switch ( nSqueezeExcitationChannelCountDivisor ) {
          case ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE: // (-2)
            bSqueeze = false; bIntermediate = false; bExcitation = false; break;

          case ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION: // (-1)
            bSqueeze = false; bIntermediate = false; bExcitation = true; break;

          case ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION: // (0)
            bSqueeze = true; bIntermediate = false; bExcitation = true; break;

          default:
            tf.util.assert( false,
              `Block_TestParams.Base.generate_squeezeExcitation_filters_biases(): `
                + `unknown nSqueezeExcitationChannelCountDivisor ( ${nSqueezeExcitationChannelCountDivisor} ) value.` );
            break;
        }
      } else {
        bSqueeze = true; bIntermediate = true; bExcitation = true;
      }
    }

    // 1. squeeze depthwise convolution.
    let squeeze_inputChannelCount = inputChannelCount;
    let squeeze_outputChannelCount = inputChannelCount;

//!!! ...unfinished... (2022/05/29)
// if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
// should generate lower half and highe half intermediate pointwise convolution in sequence.
// and then generate lower half and highe half excitation pointwise convolution in sequence.

    // 2. intermediate pointwise convolution.
    let intermediate_inputChannelCount = squeeze_outputChannelCount;
    let intermediate_outputChannelCount;
    let intermediate_bBias;
    {
      const SEIntermediatePropertyNamePrefix = `${propertyNamePrefix}SEIntermediate`;

      if ( bIntermediate ) {
        intermediate_outputChannelCount = Math.ceil( intermediate_inputChannelCount / nSqueezeExcitationChannelCountDivisor );

        // If intermediatePointwise has no activation, it could be no bias because the next operation's (i.e. excitationPointwise)
        // bias will achieve it.
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          intermediate_bBias = false;
        } else {
          intermediate_bBias = true;
        }
      } else {
        intermediate_outputChannelCount = intermediate_inputChannelCount;
        intermediate_bBias = false;
      }

      this.generate_pointwise_filters_biases(
        inputChannelCount,
        ( bIntermediate ) ? intermediate_outputChannelCount : 0,
        intermediate_bBias,
        SEIntermediatePropertyNamePrefix, io_numberArrayObject );
    }

    // 3. excitation pointwise convolution.
    let excitation_inputChannelCount = intermediate_outputChannelCount;
    let excitation_outputChannelCount = inputChannelCount;
    let excitation_bBias = true; // Always bBias
    {
      const SEExcitationPropertyNamePrefix = `${propertyNamePrefix}SEExcitation`;

      this.generate_pointwise_filters_biases(
        intermediate_outputChannelCount,
        ( bExcitation ) ? excitation_outputChannelCount : 0,
        excitation_bBias,
        SEExcitationPropertyNamePrefix, io_numberArrayObject );
    }

    // 4.
    if ( bExcitation )
      return excitation_outputChannelCount;
    else
      return 0; // no squeeze-and-excitation.
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
   * @param {string} propertyNamePrefix
   *   The name prefix of the result object. For example, if ( resultPrefixName == "xxx" ), the key names of returned object's
   * numberArrayMap will be "xxxFilters", "xxxBiases".
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * two properties may be set: "xxxFilters", "xxxBiases". The "xxx" is the propertyNamePrefix.
   *
   * @return {number}
   *   Return the outputChannelCount of this pointwise operation.
   */
  generate_pointwise_filters_biases( inputChannelCount, outputChannelCount, bBias, propertyNamePrefix, io_numberArrayObject ) {

    // If this pointwise operation does not exist, default outputChannelCount will be inputChannelCount.
    let result_outputChannelCount = inputChannelCount;

    const filtersPropertyName = `${propertyNamePrefix}Filters`;
    const biasesPropertyName = `${propertyNamePrefix}Biases`;

    if ( outputChannelCount > 0 ) {
      result_outputChannelCount = outputChannelCount;

      let filtersWeightsCount = inputChannelCount * outputChannelCount;
      this.fill_object_property_numberArray( io_numberArrayObject, filtersPropertyName, filtersWeightsCount );

      if ( bBias ) {
        let biasesWeightsCount = result_outputChannelCount;
        this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, biasesWeightsCount );
      } else {
        this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, 0 );
      }

    } else { // No pointwise convolution.
      this.fill_object_property_numberArray( io_numberArrayObject, filtersPropertyName, 0 );
      this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, 0 );
    }

    return result_outputChannelCount;
  }

  /**
   * @param {number} inputChannelCount
   *   The channel count of the depthwise convolution's input.
   *
   * @param {boolean} bBias
   *   If true, the returned array will contain a number array as the bias' weight values. If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ),
   * this will be ignored.
   *
   * @param {string} propertyNamePrefix
   *   The name prefix of the result object. For example, if ( resultPrefixName == "xxx" ), the key names of returned object's
   * numberArrayMap will be "xxxFilters", "xxxBiases".
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * two properties may be set: "xxxFilters", "xxxBiases". The "xxx" is the propertyNamePrefix.
   *
   * @return {number}
   *   Return the outputChannelCount of this depthwise operation.
   */
  generate_depthwise_filters_biases(
    inputChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bBias,
    propertyNamePrefix, io_numberArrayObject ) {

    // If this depthwise operation does not exist, default outputChannelCount will be inputChannelCount.
    let result_outputChannelCount = inputChannelCount;

    const filtersPropertyName = `${propertyNamePrefix}Filters`;
    const biasesPropertyName = `${propertyNamePrefix}Biases`;

    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      result_outputChannelCount = inputChannelCount * depthwise_AvgMax_Or_ChannelMultiplier;

      let filtersWeightsCount = result_outputChannelCount * ( depthwiseFilterHeight * depthwiseFilterWidth );
      this.fill_object_property_numberArray( io_numberArrayObject, filtersPropertyName, filtersWeightsCount );

    } else {
      // Note: if AVG or MAX pooling, this property will be empty array.
      this.fill_object_property_numberArray( io_numberArrayObject, filtersPropertyName, 0 );
    }

    if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
      if ( bBias ) {
        let biasesWeightsCount = result_outputChannelCount;
        this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, biasesWeightsCount );
      } else { // No bias.
        this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, 0 );
      }
    } else { // No depthwise convolution, no avg pooling, no max pooling.
      this.fill_object_property_numberArray( io_numberArrayObject, biasesPropertyName, 0 );
    }

    return result_outputChannelCount;
  }

  /**
   *
   * @param {Block_TestParams.Base} this
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
    // The reason is that Block will only extract filters and biases weights of the above parameters twice in this case.
    //
    if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
      this.doubleParamValue( Block.Params.pointwise21ChannelCount );

    // In ShuffleNetV2_ByMobileNetV1's body/tail:
    //   - channelCount0_pointwise1Before, pointwise21ChannelCount.
    //     - Double them in paramsAll and io_paramsNumberArrayObject (if existed).
    //   -  pointwise1ChannelCount.
    //     - Adjust it in paramsAll and io_paramsNumberArrayObject (if existed).
    //   - But use original the above parameters to generate filters weights.
    //
    // The reason is that Block will only extract filters weights of half the above parameters in this case.
    //
    } else if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
      this.doubleParamValue( Block.Params.channelCount0_pointwise1Before );

      if ( pointwise1ChannelCount_original == 0 ) {
        // When the output channel count is not specified, keep it zero.

      } else {
        let outputChannelCount_lowerHalf_pointwise1 = pointwise1ChannelCount_original;

        // Because input0's channel count has been doubled (in the above), the higher half is just the same as the original input0's channel count.
        let inputChannelCount_higherHalf_pointwise1 = channelCount0_pointwise1Before_original;

        let pointwise1ChannelCount_enlarged = outputChannelCount_lowerHalf_pointwise1 + inputChannelCount_higherHalf_pointwise1;
        this.modifyParamValue( Block.Params.pointwise1ChannelCount, pointwise1ChannelCount_enlarged );
      }

      this.doubleParamValue( Block.Params.pointwise21ChannelCount );
    }

    // Pointwise1
    let pointwise1_resultOutputChannelCount = this.generate_pointwise_filters_biases( channelCount0_pointwise1Before_original,
      pointwise1ChannelCount_original, paramsAll.bPointwise1Bias, "pointwise1", io_paramsNumberArrayObject );

    // Depthwise1
    let depthwise1_resultOutputChannelCount = this.generate_depthwise_filters_biases( pointwise1_resultOutputChannelCount,
      paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
      paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias, "depthwise1", io_paramsNumberArrayObject );

    // Depthwise2
    let depthwise2_resultOutputChannelCount;
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
          depthwise2_inputChannelCount = pointwise1_resultOutputChannelCount;
        }

        depthwise2_resultOutputChannelCount = this.generate_depthwise_filters_biases( depthwise2_inputChannelCount,
          paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
          paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias, "depthwise2", io_paramsNumberArrayObject );

      // no depthwise2.
      } else {
        this.generate_depthwise_filters_biases( null, 0, null, null, null, null, "depthwise2", io_paramsNumberArrayObject );
      }
    }

    // Concat
    let pointwise2_inputChannelCount = depthwise1_resultOutputChannelCount;
    {
      if (   ( this.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) // (-2) (ShuffleNetV2's head (simplified))
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
         ) {
        pointwise2_inputChannelCount += depthwise2_resultOutputChannelCount; // Add the channel count of the branch of the first input image.

      // (> 0) Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_XXX  (simplified ShuffleNetV2's tail)
      } else if ( paramsAll.channelCount1_pointwise1Before > 0 ) {
        pointwise2_inputChannelCount += paramsAll.channelCount1_pointwise1Before; // Add the channel count of the second input image.
      }
    }

    // Pointwise21's squeeze-and-excitation
    {
//!!! ...unfinished... (2022/05/29) lower half and higher half
//
// Problem: In ShuffleNetV2 and ShuffleNetV2_byMobileNetV1, the squeeze-and-excitation and pointwise2 are extracted in different order.
//
// Possible Solution: Separate class Pointwise_SameWhenPassThrough_PrefixSqueezeExcitation. No matter squeeze-and-excitation is
// prefix or postfix pointwise2, the SqueezeExcitation21 and SqueezeExcitation212 should be extracted in sequence (i.e. both before
// or both after pointwise2 together).
//

      let pointwise21_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor,
        pointwise2_inputChannelCount, paramsAll.pointwise21ActivationId, "pointwise21", io_paramsNumberArrayObject );

      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise212_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor,
          pointwise2_inputChannelCount, paramsAll.pointwise21ActivationId, "pointwise212", io_paramsNumberArrayObject );

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        let pointwise212_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
          ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE,
          0, paramsAll.pointwise21ActivationId, "pointwise212", io_paramsNumberArrayObject );
      }
    }

    // Pointwise21
    {
      let pointwise21_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise21ChannelCount_original, paramsAll.bPointwise21Bias, "pointwise21", io_paramsNumberArrayObject );

      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise212_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          pointwise21ChannelCount_original, paramsAll.bPointwise21Bias, "pointwise212", io_paramsNumberArrayObject );

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        let pointwise212_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          0, paramsAll.bPointwise21Bias, "pointwise212", io_paramsNumberArrayObject );
      }
    }

    // Pointwise22's Preparation.
    let pointwise22ChannelCount, bPointwise22Bias, nPointwise22ActivationId;
    {
      // In (-3) (ShuffleNetV2's body/tail) and (-4) (-5) (ShuffleNetV2_ByMobileNetV1), there is always no pointwise22.
      if (   ( this.channelCount1_pointwise1Before__is__TWO_INPUTS_CONCAT_POINTWISE21_INPUT1() ) // (-3) (ShuffleNetV2's body/tail)
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
          || ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
         ) {
        pointwise22ChannelCount = 0;

      // Otherwise, if output1 is requested, pointwise22's output channel count is the same as pointwise21's.
      } else if ( paramsAll.bOutput1Requested ) {

        pointwise22ChannelCount = pointwise21ChannelCount_original;
      }

      // pointwise22's bias flag and activation function should always be the same as pointwise21's.
      bPointwise22Bias = paramsAll.bPointwise21Bias;
      nPointwise22ActivationId = paramsAll.pointwise21ActivationId; // pointwise22's activation function should always be the same as pointwise21's.
    }

    // Pointwise22's squeeze-and-excitation
    {
      let pointwise22_squeezeExcitation_inputChannelCount;
      if ( pointwise22ChannelCount > 0 ) // Only if pointwise22 exists, its squeeze-and-excitation exists.
        pointwise22_squeezeExcitation_inputChannelCount = pointwise22ChannelCount;
      else
        pointwise22_squeezeExcitation_inputChannelCount = 0; // So that related filters and biases array will be cleared.

      let pointwise22_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor,
        pointwise22_squeezeExcitation_inputChannelCount, nPointwise22ActivationId, "pointwise22", io_paramsNumberArrayObject );

      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise222_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor,
          pointwise22_squeezeExcitation_inputChannelCount, nPointwise22ActivationId, "pointwise222", io_paramsNumberArrayObject );

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        let pointwise222_squeezeExcitation_resultOutputChannelCount = this.generate_squeezeExcitation_filters_biases(
          ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE,
          0, nPointwise22ActivationId, "pointwise222", io_paramsNumberArrayObject );
      }
    }

    // Pointwise22
    {
      let pointwise22_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise22ChannelCount, bPointwise22Bias, "pointwise22", io_paramsNumberArrayObject );

      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        let pointwise222_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          pointwise22ChannelCount, bPointwise22Bias, "pointwise222", io_paramsNumberArrayObject );

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        let pointwise222_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          0, bPointwise22Bias, "pointwise222", io_paramsNumberArrayObject );
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


//!!! (2021/07/20 Temp Remarked) Fixed to non-random to simplify debug.
Base.weightsRandomOffset = { min: -100, max: +100 };
// Base.weightsRandomOffset = { min: -0, max: +0 };


/**
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Block.initer().
 */
Base.paramsNameOrderArray = [
  Block.Params.inputHeight0.paramName,
  Block.Params.inputWidth0.paramName,
  Block.Params.channelCount0_pointwise1Before.paramName,
  Block.Params.channelCount1_pointwise1Before.paramName,
  Block.Params.pointwise1ChannelCount.paramName,
  Block.Params.bPointwise1Bias.paramName,
  Block.Params.pointwise1ActivationId.paramName,
  Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.paramName,
  Block.Params.depthwiseFilterHeight.paramName,
  Block.Params.depthwiseFilterWidth.paramName,
  Block.Params.depthwiseStridesPad.paramName,
  Block.Params.bDepthwiseBias.paramName,
  Block.Params.depthwiseActivationId.paramName,
  Block.Params.nSqueezeExcitationChannelCountDivisor.paramName,
  Block.Params.bSqueezeExcitationPrefix.paramName,
  Block.Params.pointwise21ChannelCount.paramName,
  Block.Params.bPointwise21Bias.paramName,
  Block.Params.pointwise21ActivationId.paramName,
  Block.Params.bOutput1Requested.paramName,

  Block.Params.bKeepInputTensor.paramName,
  
  "pointwise1Filters",
  "pointwise1Biases",

  "depthwise1Filters",
  "depthwise1Biases",

  "depthwise2Filters",
  "depthwise2Biases",

  "pointwise21SEIntermediateFilters", // pointwise21's squeeze-and-excitation's intermediate pointwise
  "pointwise21SEIntermediateBiases",
  "pointwise21SEExcitationFilters",   // pointwise21's squeeze-and-excitation's excitation pointwise
  "pointwise21SEExcitationBiases",

  "pointwise21Filters",
  "pointwise21Biases",

  "pointwise212SEIntermediateFilters", // pointwise212's squeeze-and-excitation's intermediate pointwise
  "pointwise212SEIntermediateBiases",
  "pointwise212SEExcitationFilters",   // pointwise212's squeeze-and-excitation's excitation pointwise
  "pointwise212SEExcitationBiases",

  "pointwise212Filters",
  "pointwise212Biases",

  "pointwise22SEIntermediateFilters", // pointwise22's squeeze-and-excitation's intermediate pointwise
  "pointwise22SEIntermediateBiases",
  "pointwise22SEExcitationFilters",   // pointwise22's squeeze-and-excitation's excitation pointwise
  "pointwise22SEExcitationBiases",

  "pointwise22Filters",
  "pointwise22Biases",

  "pointwise222SEIntermediateFilters", // pointwise222's squeeze-and-excitation's intermediate pointwise
  "pointwise222SEIntermediateBiases",
  "pointwise222SEExcitationFilters",   // pointwise222's squeeze-and-excitation's excitation pointwise
  "pointwise222SEExcitationBiases",

  "pointwise222Filters",
  "pointwise222Biases",
];
