export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as NameNumberArrayObject_To_Float32Array from "../../util/NameNumberArrayObject_To_Float32Array.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
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
 * it has the following data members: input0_height, input0_width, input0_channelCount, nConvBlockTypeId,
 * pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
 * depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise20ChannelCount, bPointwise20Bias,
 * pointwise20ActivationId, bKeepInputTensor. It also has the following properties:
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
    input0_height, input0_width, input0_channelCount,
    nConvBlockType,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias, pointwise20ActivationId,
    bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      input0_height, input0_width, input0_channelCount,
      nConvBlockType,
      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      bDepthwiseBias, depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      pointwise20ChannelCount, bPointwise20Bias, pointwise20ActivationId,
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
   *   An object which has the following data members: input0_height, input0_width, input0_channelCount, nConvBlockType,
   * pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight,
   * depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId, pointwise20ChannelCount, bPointwise20Bias,
   * pointwise20ActivationId, bKeepInputTensor. And depthwisePadInfo.
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightsElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {

    this.generate_out_inferencedParams();
    this.generate_Filters_Biases();

    // Pack all parameters, filters, biases weights into a (pre-allocated and re-used) Float32Array.
    this.Float32Array_ByteOffsetBegin.setByConcat( Base.paramsNameOrderArray, this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = this.Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = this.Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    return this;
  }

  /** Fill this.out.flag according to this.out
   */
  generate_out_inferencedParams() {
    if ( !this.out.inferencedParams ) {
      this.out.inferencedParams = {};
    }
    Block.Params.set_inferencedParams_by.call( this.out.inferencedParams,
      this.out.input0_height, this.out.input0_width, this.out.input0_channelCount,
      this.out.nConvBlockTypeId,
      this.out.pointwise1ChannelCount,
      this.out.depthwise_AvgMax_Or_ChannelMultiplier, this.out.depthwiseFilterHeight, this.out.depthwiseFilterWidth,
      this.out.depthwiseStridesPad, this.out.bDepthwiseBias, this.out.depthwiseActivationId,
      this.out.nSqueezeExcitationChannelCountDivisor, this.out.bSqueezeExcitationPrefix,
      this.out.pointwise20ChannelCount, this.out.bPointwise20Bias,
    );
  }

  /**
   * @override
   */
  onYield_isLegal() {

    let infoConvBlockType = ConvBlockType.Singleton.getInfoById( this.out.nConvBlockTypeId );

//!!! (2022/06/16 Remarked) Now, input1's dimension are inferenced parameters.
//     // (5) (ShuffleNetV2_ByMobileNetV1's head)
//     if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) {
//
//       if ( this.out.pointwise1ChannelCount > 0 ) {
//
//         // depthwise2 (processing input0) must have the same input channel count as depthwise1 (processing pointwise1 result).
//         // So that the results of depthwise1 and depthwise2 both have the same output channel count.
//         if ( this.out.input0_channelCount != this.out.pointwise1ChannelCount )
//           return false;
//
//       // For ( pointwise1ChannelCount > 0 ), pointwise1 result is just the input0 itself (i.e. always the same).
//       }
//
//     // (6 or 7) (ShuffleNetV2_ByMobileNetV1's body/tail)
//     } else if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) {
//
//       // The input and output channel count must be the same. Otherwise, the concat2-shuffle-split could not operate properly.
//       if ( this.out.input0_channelCount != this.out.pointwise20ChannelCount )
//         return false;
//     }

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    switch ( this.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:

        switch ( this.out.nConvBlockTypeId ) { // bHigherHalfDifferent
          case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD: // (5)
          case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY: // (6)
          case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL: // (7)

            // Note: Even if no bias and no activation (although avg/max pooling is possible because undo/do activation-escaping could
            //       be ignored), the higher-half still can not be pass-through.
            //
            return false;
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

      this.generate_out_inferencedParams(); // So that this.out.inferencedParams and .depthwisePadInfo is usable.
      if ( this.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {

        // For depthwise1/depthwis2.
        if ( this.out.depthwiseFilterWidth == 1 )
          return false;

        let pointwise2_inputWidth = this.out.depthwisePadInfo.outputWidth;

        // For squeeze-and-excitation.
        //
        // (squeeze is an average pooling. Its filter width is the same as inputWidth (i.e. pointwise2_inputWidth).)
        if (   ( pointwise2_inputWidth == 1 )
            && ( ValueDesc.SqueezeExcitationChannelCountDivisor.hasSqueeze( this.out.nSqueezeExcitationChannelCountDivisor ) )
           )
          return false;
      }
    }

    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    if ( ValueDesc.StridesPad.pad_isValid( this.out.depthwiseStridesPad ) ) {

      if (   ( this.out.depthwiseFilterHeight > this.out.input0_height )
          || ( this.out.depthwiseFilterWidth  > this.out.input0_width  ) )
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

      pointwise20ChannelCount: [ 1, 1 + 3 - 1 ],

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( undefined )) for speeding up testing.
      Bias: undefined,
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min + 0 ],
//      Bias: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],

//       ActivationId: undefined,
//       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
//       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],
       ActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min + 1, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      input0_height: [ 3, 3 ],
      input0_width: [ 4, 5 ],

      input0_channelCount: [
        Block.Params.input0_channelCount.valueDesc.range.min,
        Block.Params.input0_channelCount.valueDesc.range.min + 4 - 1
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
//      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min ],
//      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.max, ValueDesc.Bool.Singleton.range.max ],

      nSqueezeExcitationChannelCountDivisor: [
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
      ],
//!!! (2022/06/10 Temp Remarked) For speed up debug.
//       nSqueezeExcitationChannelCountDivisor: [
//         ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
//         4
//         //ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min + 7 - 1
//         //ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.max
//       ],

      nConvBlockTypeId: [
        Block.Params.nConvBlockTypeId.valueDesc.range.min,
        Block.Params.nConvBlockTypeId.valueDesc.range.max
      ],

      bKeepInputTensor: undefined,
//      bKeepInputTensor: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( Block.Params.input0_height,           this.valueOutMinMax.input0_height ),
      new TestParams.ParamDescConfig( Block.Params.input0_width,            this.valueOutMinMax.input0_width ),

      new TestParams.ParamDescConfig( Block.Params.pointwise20ChannelCount, this.valueOutMinMax.pointwise20ChannelCount ),
      new TestParams.ParamDescConfig( Block.Params.bPointwise20Bias,        this.valueOutMinMax.Bias ),
      new TestParams.ParamDescConfig( Block.Params.pointwise20ActivationId, this.valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( Block.Params.bPointwise1Bias,         this.valueOutMinMax.Bias ),

      new TestParams.ParamDescConfig( Block.Params.bSqueezeExcitationPrefix,
                                                                            this.valueOutMinMax.bSqueezeExcitationPrefix ),

      new TestParams.ParamDescConfig( Block.Params.nSqueezeExcitationChannelCountDivisor,
                                                                            this.valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

      new TestParams.ParamDescConfig( Block.Params.input0_channelCount,
                                                                            this.valueOutMinMax.input0_channelCount ),

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

      new TestParams.ParamDescConfig( Block.Params.nConvBlockTypeId,        this.valueOutMinMax.nConvBlockTypeId ),

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
   * @param {number} pointwise20ChannelCount The output channel count of the pointwise20 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise20 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise20 convolution, bias and activation.
   */
  use_pointwise20( inputImage, pointwise20ChannelCount, pointwiseName, parametersDesc ) {

    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEExcitationBiases,
          this.out.pointwise20ActivationId,
          `${pointwiseName}_squeezeExcitationPrefix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise20ChannelCount,
      this.in.paramsNumberArrayObject.pointwise20Filters, this.out.bPointwise20Bias,
      this.in.paramsNumberArrayObject.pointwise20Biases, this.out.pointwise20ActivationId, pointwiseName, parametersDesc );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEExcitationBiases,
          this.out.pointwise20ActivationId,
          `${pointwiseName}_squeezeExcitationPostfix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    return squeezeExcitationPostfixOut;
  }

  /**
   * Pointwise202 uses the same channel count, bias flag and activation function as Pointwise20 (i.e. pointwise20ChannelCount, bPointwise20Bias
   * and pointwise20ActivationId), but uses different filters and biases weights (i.e. pointwise202Filters and pointwise202Biases)
   *
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise20ChannelCount The output channel count of the pointwise202 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise202 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise202 convolution, bias and activation.
   */
  use_pointwise202( inputImage, pointwise20ChannelCount, pointwiseName, parametersDesc ) {

    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEExcitationBiases,
          this.out.pointwise20ActivationId,
          `${pointwiseName}_squeezeExcitationPrefix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise20ChannelCount,
      this.in.paramsNumberArrayObject.pointwise202Filters, this.out.bPointwise20Bias,
      this.in.paramsNumberArrayObject.pointwise202Biases, this.out.pointwise20ActivationId, pointwiseName, parametersDesc );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEExcitationBiases,
          this.out.pointwise20ActivationId,
          `${pointwiseName}_squeezeExcitationPostfix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    return squeezeExcitationPostfixOut;
  }

  /**
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise20ChannelCount The output channel count of this pointwise20 pass-through convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise1 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise20 pass-through convolution and bias.
   */
  use_pointwise20_PassThrough( inputImage, pointwise20ChannelCount, pointwiseName, parametersDesc ) {

//!!! (2022/06/08) Since pass-through, the squeeze-and-excitation seems not necessary.
//     let squeezeExcitationOut = inputImage;
//     if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
//       squeezeExcitationOut = inputImage.clone_bySqueezeExcitation_PassThrough(
//         this.out.nSqueezeExcitationChannelCountDivisor,
//         this.out.pointwise20ActivationId,
//         this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
//         `${pointwiseName}_squeezeExcitation`, parametersDesc );
//
//     // Without clone to improve performance.
//     }

    // Note: Since pass-through, the squeeze-and-excitation is not necessary here.

    let result = inputImage.clone_byPointwise_PassThrough( pointwise20ChannelCount,
      this.out.bPointwise20Bias, this.out.pointwise20ActivationId,
      this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      pointwiseName, parametersDesc );
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
    
    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEExcitationBiases,
          this.out.pointwise20ActivationId, // (Note: Not pointwise21ActivationId)
          `${pointwiseName}_squeezeExcitationPrefix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise21ChannelCount,
      this.in.paramsNumberArrayObject.pointwise21Filters, this.out.bPointwise20Bias, // (Note: Not bPointwise21Bias)
      this.in.paramsNumberArrayObject.pointwise21Biases, this.out.pointwise20ActivationId, // (Note: Not pointwise21ActivationId)
      pointwiseName, parametersDesc );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEExcitationBiases,
          this.out.pointwise20ActivationId, // (Note: Not pointwise21ActivationId)
          `${pointwiseName}_squeezeExcitationPostfix`, parametersDesc );
      } // Otherwise, do not clone to improve performance.
    }

    return squeezeExcitationPostfixOut;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (0) (MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2)). */
  nConvBlockTypeId__is__ONE_INPUT() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (1) (MobileNetV2's body/tail). */
  nConvBlockTypeId__is__MOBILE_NET_V2_BODY_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (2) (ShuffleNetV2's head). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (3 or 4) (ShuffleNetV2's body/tail). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY )
      return true;
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (5) (ShuffleNetV2_ByMobileNetV1's head). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (6) (ShuffleNetV2_ByMobileNetV1's body). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (7) (ShuffleNetV2_ByMobileNetV1's tail). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (6 or 7) (ShuffleNetV2_ByMobileNetV1's body/tail). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY )
      return true;
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (8) (ShuffleNetV2_ByPointwise21's head without pointwise1). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1 )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (9) (ShuffleNetV2_ByPointwise21's head). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (10) (ShuffleNetV2_ByPointwise21's body). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (11) (ShuffleNetV2_ByPointwise21's tail). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL )
      return true;
    return false;
  }

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (10 or 11) (ShuffleNetV2_ByPointwise21's body/tail). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY )
      return true;
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL )
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
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of the squeeze-and-excitation.
   *
   * @param {number} inputChannelCount_A
   *   The channel count of the squeeze-and-excitation's input.
   *
   * @param {string} propertyNamePrefix_A
   *   The name prefix of the result property in the o_numberArrayObject. If null, it will not be filled.
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * four properties may be set: "xxxSEIntermediateFilters", "xxxSEIntermediateBiases", "xxxSEExcitationFilters",
   * "xxxSEExcitationBiases". The "xxx" is the propertyNamePrefix.
   *
   * @return {undefined}
   *   Does not return anything.
   */
  generate_squeezeExcitation_filters_biases(
    nSqueezeExcitationChannelCountDivisor, nActivationId,
    inputChannelCount_A, inputChannelCount_B, inputChannelCount_C,
    propertyNamePrefix_A, propertyNamePrefix_B, propertyNamePrefix_C,
    io_numberArrayObject ) {

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
    let squeeze_inputChannelCount_A = inputChannelCount_A;
    let squeeze_outputChannelCount_A = inputChannelCount_A;

    let squeeze_inputChannelCount_B = inputChannelCount_B;
    let squeeze_outputChannelCount_B = inputChannelCount_B;

    let squeeze_inputChannelCount_C = inputChannelCount_C;
    let squeeze_outputChannelCount_C = inputChannelCount_C;

    // 2. intermediate pointwise convolution.
    let intermediate_inputChannelCount_A = squeeze_outputChannelCount_A;
    let intermediate_outputChannelCount_A;

    let intermediate_inputChannelCount_B = squeeze_outputChannelCount_B;
    let intermediate_outputChannelCount_B;

    let intermediate_inputChannelCount_C = squeeze_outputChannelCount_C;
    let intermediate_outputChannelCount_C;

    let intermediate_bBias;
    {
      const SEIntermediatePropertyNamePrefix_A = ( propertyNamePrefix_A ) ? ( `${propertyNamePrefix_A}SEIntermediate` ) : null;
      const SEIntermediatePropertyNamePrefix_B = ( propertyNamePrefix_B ) ? ( `${propertyNamePrefix_B}SEIntermediate` ) : null;
      const SEIntermediatePropertyNamePrefix_C = ( propertyNamePrefix_C ) ? ( `${propertyNamePrefix_C}SEIntermediate` ) : null;

      if ( bIntermediate ) {
        intermediate_outputChannelCount_A = Math.ceil( intermediate_inputChannelCount_A / nSqueezeExcitationChannelCountDivisor );
        intermediate_outputChannelCount_B = Math.ceil( intermediate_inputChannelCount_B / nSqueezeExcitationChannelCountDivisor );
        intermediate_outputChannelCount_C = Math.ceil( intermediate_inputChannelCount_C / nSqueezeExcitationChannelCountDivisor );

        // If intermediatePointwise has no activation, it could be no bias because the next operation's (i.e. excitationPointwise)
        // bias will achieve it.
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          intermediate_bBias = false;
        } else {
          intermediate_bBias = true;
        }
      } else {
        intermediate_outputChannelCount_A = intermediate_inputChannelCount_A;
        intermediate_outputChannelCount_B = intermediate_inputChannelCount_B;
        intermediate_outputChannelCount_C = intermediate_inputChannelCount_C;
        intermediate_bBias = false;
      }

      this.generate_pointwise_filters_biases(
        intermediate_inputChannelCount_A, ( ( bIntermediate ) ? intermediate_outputChannelCount_A : 0 ),
        intermediate_bBias, SEIntermediatePropertyNamePrefix_A, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        intermediate_inputChannelCount_B, ( ( bIntermediate ) ? intermediate_outputChannelCount_B : 0 ),
        intermediate_bBias, SEIntermediatePropertyNamePrefix_B, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        intermediate_inputChannelCount_C, ( ( bIntermediate ) ? intermediate_outputChannelCount_C : 0 ),
        intermediate_bBias, SEIntermediatePropertyNamePrefix_C, io_numberArrayObject );
    }

    // 3. excitation pointwise convolution.
    let excitation_inputChannelCount_A = intermediate_outputChannelCount_A;
    let excitation_outputChannelCount_A = inputChannelCount_A;

    let excitation_inputChannelCount_B = intermediate_outputChannelCount_B;
    let excitation_outputChannelCount_B = inputChannelCount_B;

    let excitation_inputChannelCount_C = intermediate_outputChannelCount_C;
    let excitation_outputChannelCount_C = inputChannelCount_C;

    let excitation_bBias = true; // Always bBias
    {
      const SEExcitationPropertyNamePrefix_A = ( propertyNamePrefix_A ) ? ( `${propertyNamePrefix_A}SEExcitation` ) : null;
      const SEExcitationPropertyNamePrefix_B = ( propertyNamePrefix_B ) ? ( `${propertyNamePrefix_B}SEExcitation` ) : null;
      const SEExcitationPropertyNamePrefix_C = ( propertyNamePrefix_C ) ? ( `${propertyNamePrefix_C}SEExcitation` ) : null;

      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_A, ( ( bExcitation ) ? excitation_outputChannelCount_A : 0 ),
        excitation_bBias, SEExcitationPropertyNamePrefix_A, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_B, ( ( bExcitation ) ? excitation_outputChannelCount_B : 0 ),
        excitation_bBias, SEExcitationPropertyNamePrefix_B, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_C, ( ( bExcitation ) ? excitation_outputChannelCount_C : 0 ),
        excitation_bBias, SEExcitationPropertyNamePrefix_C, io_numberArrayObject );
    }
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
   * numberArrayMap will be "xxxFilters", "xxxBiases". If null, nothing will be filled.
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

    if ( propertyNamePrefix ) {
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
   * numberArrayMap will be "xxxFilters", "xxxBiases". If null, nothing will be filled.
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

    if ( propertyNamePrefix ) {
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
    let inferencedParams = paramsAll.inferencedParams;
    //let depthwisePadInfo = inferencedParams.depthwisePadInfo;

    let io_paramsNumberArrayObject = this.in.paramsNumberArrayObject;

    let infoConvBlockType = ConvBlockType.Singleton.getInfoById( paramsAll.nConvBlockTypeId );


    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_HEAD                    // (2) (ShuffleNetV2's head)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD   // (5) (ShuffleNetV2_ByMobileNetV1's head)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_BODY                    // (3) (ShuffleNetV2's body)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY   // (6) (ShuffleNetV2_ByMobileNetV1's body)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_TAIL                    // (4) (ShuffleNetV2's tail)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL   // (7) (ShuffleNetV2_ByMobileNetV1's tail)


    // 0.
    let input0_channelCount_original = paramsAll.input0_channelCount;
    let pointwise1ChannelCount_original = paramsAll.pointwise1ChannelCount;
    let pointwise20ChannelCount_original = paramsAll.pointwise20ChannelCount;

    // In ShuffleNetV2_ByMobileNetV1's head:
    //   - pointwise20ChannelCount.
    //     - Double it in paramsAll and io_paramsNumberArrayObject (if existed).
    //   - Use original the above parameters twice to generate filters and biases weights.
    //     - pointwise20 and pointwise202
    //
    // The reason is that Block will only extract filters and biases weights of the above parameters twice in this case.
    //
    if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
      this.doubleParamValue( Block.Params.pointwise20ChannelCount );

    // In ShuffleNetV2_ByMobileNetV1's body/tail:
    //   - input0_channelCount, pointwise20ChannelCount.
    //     - Double them in paramsAll and io_paramsNumberArrayObject (if existed).
    //   -  pointwise1ChannelCount.
    //     - Adjust it in paramsAll and io_paramsNumberArrayObject (if existed).
    //   - But use original the above parameters to generate filters weights.
    //
    // The reason is that Block will only extract filters weights of half the above parameters in this case.
    //
    } else if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
      this.doubleParamValue( Block.Params.input0_channelCount );

      if ( pointwise1ChannelCount_original == 0 ) {
        // When the output channel count is not specified, keep it zero.

      } else {
        let outputChannelCount_lowerHalf_pointwise1 = pointwise1ChannelCount_original;

        // Because input0's channel count has been doubled (in the above), the higher half is just the same as the original input0's channel count.
        let inputChannelCount_higherHalf_pointwise1 = input0_channelCount_original;

        let pointwise1ChannelCount_enlarged = outputChannelCount_lowerHalf_pointwise1 + inputChannelCount_higherHalf_pointwise1;
        this.modifyParamValue( Block.Params.pointwise1ChannelCount, pointwise1ChannelCount_enlarged );
      }

      this.doubleParamValue( Block.Params.pointwise20ChannelCount );
    }

    // 1. Pointwise1
    let pointwise1_resultOutputChannelCount = this.generate_pointwise_filters_biases( input0_channelCount_original,
      pointwise1ChannelCount_original, paramsAll.bPointwise1Bias, "pointwise1", io_paramsNumberArrayObject );

    // 2. Depthwise
    let depthwise1_resultOutputChannelCount;
    let depthwise2_resultOutputChannelCount;

    // Depthwise1
    {
      let depthwise1_inputChannelCount = pointwise1_resultOutputChannelCount;

      // Only if depthwise operation is requested and necessary, create them.
      if ( paramsAll.inferencedParams.bDepthwiseRequestedAndNeeded ) {
        depthwise1_resultOutputChannelCount = this.generate_depthwise_filters_biases( depthwise1_inputChannelCount,
          paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
          paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias, "depthwise1", io_paramsNumberArrayObject );
      } else {
        depthwise1_resultOutputChannelCount = depthwise1_inputChannelCount;
        this.generate_depthwise_filters_biases( null, 0, null, null, null, null, "depthwise1", io_paramsNumberArrayObject );
      }
    }

    // Depthwise2
    {
      // In ShuffleNetV2's head.
      if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
         ) {

        let depthwise2_inputChannelCount;

        if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
            || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
           ) {
          depthwise2_inputChannelCount = paramsAll.input0_channelCount; // Use input0.

        // Use pointwise1.outputChannelCount as input1_channelCount so that it has the same structure of depthwise1 and pointwise20.
        //
        } else if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
          depthwise2_inputChannelCount = pointwise1_resultOutputChannelCount;
        }

        // Only if depthwise operation is requested and necessary, create them.
        if ( paramsAll.inferencedParams.bDepthwiseRequestedAndNeeded ) {
          depthwise2_resultOutputChannelCount = this.generate_depthwise_filters_biases( depthwise2_inputChannelCount,
            paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight, paramsAll.depthwiseFilterWidth,
            paramsAll.depthwiseStridesPad, paramsAll.bDepthwiseBias, "depthwise2", io_paramsNumberArrayObject );
        } else {
          depthwise2_resultOutputChannelCount = depthwise2_inputChannelCount;
          this.generate_depthwise_filters_biases( null, 0, null, null, null, null, "depthwise2", io_paramsNumberArrayObject );
        }

      // no depthwise2.
      } else {
        this.generate_depthwise_filters_biases( null, 0, null, null, null, null, "depthwise2", io_paramsNumberArrayObject );
      }
    }

    // 3. Concat

    // 3.1 Pointwise20's Preparation.
    let pointwise20_inputChannelCount = 0, pointwise202_inputChannelCount = 0, pointwise21_inputChannelCount = 0;
    let pointwise20_outputChannelCount = 0, pointwise202_outputChannelCount = 0, pointwise21_outputChannelCount = 0;
//    let pointwise21ChannelCount;
    {
//       pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
//       pointwise202_inputChannelCount = 0;
//       pointwise21_inputChannelCount = 0;

//!!! ...unfinished... (2022/06/16) should half input channel count

      switch ( paramsAll.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL: // ( 0)
        case ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL: // ( 1)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_original;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // ( 2)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise21_inputChannelCount = depthwise2_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_original;
          pointwise21_outputChannelCount = pointwise20ChannelCount_original;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY: // ( 3)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL: // ( 4)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_original;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD: // ( 5)
          pointwise20_inputChannelCount =  depthwise1_resultOutputChannelCount;
          pointwise202_inputChannelCount = depthwise2_resultOutputChannelCount;
          pointwise20_outputChannelCount =  pointwise20ChannelCount_original;
          pointwise202_outputChannelCount = pointwise20ChannelCount_original;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY: // ( 6)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL: // ( 7)
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1: // ( 8)
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD: // ( 9)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount + depthwise2_resultOutputChannelCount;
          pointwise21_inputChannelCount = pointwise20_inputChannelCount;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY: // (10)
          pointwise20_inputChannelCount += inferencedParams.input1_channelCount;
          pointwise21_inputChannelCount = ???;
          pointwise21ChannelCount = pointwise20ChannelCount_original;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL: // (11)
          pointwise20_inputChannelCount += inferencedParams.input1_channelCount;
          break;

        default:
          tf.util.assert( channelShuffler != null, `Block_Reference.Base.calcResult(): `
            + `Block.TestParams.Base.generate_Filters_Biases(): Unknown `
            + `nConvBlockTypeId=`
            + `${ValueDesc.ConvBlockType.Singleton.getStringOf( paramsAll.nConvBlockTypeId )}`
            + `(${paramsAll.nConvBlockTypeId}). `
            + `` );
          break;
      }

!!!
      if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
         ) {
        pointwise2_inputChannelCount += depthwise2_resultOutputChannelCount; // Add the channel count of the branch of the first input image.

      } else if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() ) // (3 or 4)
                 || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) // (6 or 7)
                 || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL() ) // (10 or 11)
                ) {
        pointwise2_inputChannelCount += inferencedParams.input1_channelCount; // Add the channel count of the second input image.
      }
    }

    // 3.2 Pointwise21's Preparation.

//!!! (2022/06/16 Remarked)
//    let pointwise21ChannelCount, bPointwise21Bias, nPointwise21ActivationId;

    let bPointwise21Bias, nPointwise21ActivationId;
    {
//!!! ...unfinished... (2022/06/16)

      if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1() ) // (8)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY() )  // (10)
         ) {
        pointwise21ChannelCount = pointwise20ChannelCount_original;
      } else {
        pointwise21ChannelCount = 0;
      }

      // pointwise21's bias flag and activation function should always be the same as pointwise20's.
      bPointwise21Bias = paramsAll.bPointwise20Bias;
      nPointwise21ActivationId = paramsAll.pointwise20ActivationId;
    }

    // 4. Pointwise2's prefix squeeze-and-excitation
    if ( paramsAll.bSqueezeExcitationPrefix ) {

      // 4.1 Pointwise20's and Pointwise202's prefix squeeze-and-excitation. (Then, never has pointwise21.)
      if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
          pointwise2_inputChannelCount, pointwise2_inputChannelCount, 0,
          "pointwise20Prefix", "pointwise202Prefix", "pointwise21Prefix", io_paramsNumberArrayObject );

      // 4.2 Pointwise20's and Pointwise21's prefix squeeze-and-excitation. (Then, never has pointwise202.)
      } else if ( pointwise21ChannelCount > 0 ) { // Only if pointwise21 exists, its squeeze-and-excitation exists.
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, nPointwise21ActivationId,
          pointwise2_inputChannelCount, 0, pointwise2_inputChannelCount,
          "pointwise20Prefix", "pointwise202Prefix", "pointwise21Prefix", io_paramsNumberArrayObject );

      // 4.3 Pointwise20's prefix squeeze-and-excitation only.
      } else {
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
          pointwise2_inputChannelCount, 0, 0,
          "pointwise20Prefix", "pointwise202Prefix", "pointwise21Prefix", io_paramsNumberArrayObject );
      }
    } else { // 4.4 Clear all prefix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
        0, 0, 0,
        "pointwise20Prefix", "pointwise202Prefix", "pointwise21Prefix", io_paramsNumberArrayObject );
    }

    // 5. Pointwise2

    // 5.1 Pointwise20
    {
      let pointwise20_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise20ChannelCount_original, paramsAll.bPointwise20Bias, "pointwise20", io_paramsNumberArrayObject );

      if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)

//!!! ...unfinished... (2022/06/16) should half input channel count

        let pointwise202_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          pointwise20ChannelCount_original, paramsAll.bPointwise20Bias, "pointwise202", io_paramsNumberArrayObject );

      } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
        let pointwise202_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
          0, paramsAll.bPointwise20Bias, "pointwise202", io_paramsNumberArrayObject );
      }
    }

//!!! ...unfinished... (2022/06/16)

    // 5.2 Pointwise21
    {
      let pointwise21_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
        pointwise21ChannelCount, bPointwise21Bias, "pointwise21", io_paramsNumberArrayObject );

//!!! (2022/06/16 Remarked) There is no pointwise212.
//       if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
//         let pointwise212_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
//           pointwise21ChannelCount, bPointwise21Bias, "pointwise212", io_paramsNumberArrayObject );
//
//       } else { // Clear old them (because TestParams.Base.permuteParamRecursively() does not know them and will not clear them).
//         let pointwise212_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise2_inputChannelCount,
//           0, bPointwise21Bias, "pointwise212", io_paramsNumberArrayObject );
//       }
    }

    // 6. Pointwise2's postfix squeeze-and-excitation

    if ( !paramsAll.bSqueezeExcitationPrefix ) { // i.e. postfix

      // 6.1 Pointwise20's and Pointwise202's postfix squeeze-and-excitation. (Then, never has pointwise21.)
      if ( this.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
          pointwise20ChannelCount_original, pointwise20ChannelCount_original, 0,
          "pointwise20Postfix", "pointwise202Postfix", "pointwise21Postfix", io_paramsNumberArrayObject );

      // 6.2 Pointwise20's and Pointwise21's postfix squeeze-and-excitation. (Then, never has pointwise202.)
      } else if ( pointwise21ChannelCount > 0 ) { // Only if pointwise21 exists, its squeeze-and-excitation exists.
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, nPointwise21ActivationId,
          pointwise20ChannelCount_original, 0, pointwise21ChannelCount,
          "pointwise20Postfix", "pointwise202Postfix", "pointwise21Postfix", io_paramsNumberArrayObject );

      // 6.3 Pointwise20's postfix squeeze-and-excitation only.
      } else {
        this.generate_squeezeExcitation_filters_biases(
          paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
          pointwise20ChannelCount_original, 0, 0,
          "pointwise20Postfix", "pointwise202Postfix", "pointwise21Postfix", io_paramsNumberArrayObject );
      }
    } else { // 6.4 Clear all postfix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.pointwise20ActivationId,
        0, 0, 0,
        "pointwise20Postfix", "pointwise202Postfix", "pointwise21Postfix", io_paramsNumberArrayObject );
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
  Block.Params.input0_height.paramName,
  Block.Params.input0_width.paramName,
  Block.Params.input0_channelCount.paramName,
  Block.Params.nConvBlockTypeId.paramName,
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
  Block.Params.pointwise20ChannelCount.paramName,
  Block.Params.bPointwise20Bias.paramName,
  Block.Params.pointwise20ActivationId.paramName,

  Block.Params.bKeepInputTensor.paramName,
  
  "pointwise1Filters",
  "pointwise1Biases",

  "depthwise1Filters",
  "depthwise1Biases",

  "depthwise2Filters",
  "depthwise2Biases",

  "pointwise20PrefixSEIntermediateFilters",  // pointwise20's prefix squeeze-and-excitation's intermediate pointwise
  "pointwise20PrefixSEIntermediateBiases",

  "pointwise202PrefixSEIntermediateFilters", // pointwise202's prefix squeeze-and-excitation's intermediate pointwise
  "pointwise202PrefixSEIntermediateBiases",

  "pointwise21PrefixSEIntermediateFilters",  // pointwise21's prefix squeeze-and-excitation's intermediate pointwise
  "pointwise21PrefixSEIntermediateBiases",

  "pointwise20PrefixSEExcitationFilters",    // pointwise20's prefix squeeze-and-excitation's excitation pointwise
  "pointwise20PrefixSEExcitationBiases",

  "pointwise202PrefixSEExcitationFilters",   // pointwise202's prefix squeeze-and-excitation's excitation pointwise
  "pointwise202PrefixSEExcitationBiases",

  "pointwise21PrefixSEExcitationFilters",    // pointwise21's prefix squeeze-and-excitation's excitation pointwise
  "pointwise21PrefixSEExcitationBiases",

  "pointwise20Filters",
  "pointwise20Biases",

  "pointwise202Filters",
  "pointwise202Biases",

  "pointwise21Filters",
  "pointwise21Biases",

  "pointwise20PostfixSEIntermediateFilters",  // pointwise20's postfix squeeze-and-excitation's intermediate pointwise
  "pointwise20PostfixSEIntermediateBiases",

  "pointwise202PostfixSEIntermediateFilters", // pointwise202's postfix squeeze-and-excitation's intermediate pointwise
  "pointwise202PostfixSEIntermediateBiases",

  "pointwise21PostfixSEIntermediateFilters",  // pointwise21's postfix squeeze-and-excitation's intermediate pointwise
  "pointwise21PostfixSEIntermediateBiases",

  "pointwise20PostfixSEExcitationFilters",    // pointwise20's postfix squeeze-and-excitation's excitation pointwise
  "pointwise20PostfixSEExcitationBiases",

  "pointwise202PostfixSEExcitationFilters",   // pointwise202's postfix squeeze-and-excitation's excitation pointwise
  "pointwise202PostfixSEExcitationBiases",

  "pointwise21PostfixSEExcitationFilters",    // pointwise21's postfix squeeze-and-excitation's excitation pointwise
  "pointwise21PostfixSEExcitationBiases",
];
