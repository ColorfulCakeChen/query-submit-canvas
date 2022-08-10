export { Block_TestParams_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TestParams from "./TestParams.js";
import * as NumberImage from "./NumberImage.js";
import * as ImageSourceBag from "./ImageSourceBag.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as Block from "../../Conv/Block.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 *
 */
class Block_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Block_TestParams.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block_TestParams.Base.Pool",
    Block_TestParams_Base, Block_TestParams_Base.setAsConstructor );

  /**
   */
  constructor( id ) {
    super( id );
    Block_TestParams_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( id ) {
    super.setAsConstructor( id );
    Block_TestParams_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag = Pointwise.PassThrough_FiltersArray_BiasesArray_Bag.Pool.get_or_create_by();
    this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag = Depthwise.PassThrough_FiltersArray_BiasesArray_Bag.Pool.get_or_create_by();

    this.out = Block.ParamsBase.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag?.disposeResources_and_recycleToPool();
    this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag = null;

    this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag?.disposeResources_and_recycleToPool();
    this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag = null;

    super.disposeResources();
  }

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in
   *   - this.in_weights
   *   - this.out
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsScattered(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId,
    bKeepInputTensor
  ) {
    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = Block.ParamsBase.Pool.get_or_create_by(
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
    );

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin, false );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in_weights
   *   - this.out.inferencedParams
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Block_TestParams_Base.paramsNameOrderArray[] elements.
   *
   * @param {Block.ParamsBase} this.out
   *   An object which will be the final result of Block.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut(
    weightElementOffsetBegin = 0, bDouble_when_ShuffleNetV2_byMobileNetV1 ) {

    this.generate_out_inferencedParams();
    this.generate_Filters_Biases( bDouble_when_ShuffleNetV2_byMobileNetV1 );

    // Pack all parameters, filters, biases weights into a (pre-allocated and re-used) NumberArray.
    this.in_weights.set_byConcat(
      Block_TestParams_Base.paramsNameOrderArray, this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    return this;
  }

  /** Fill this.out.inferencedParams according to this.out */
  generate_out_inferencedParams() {
    this.out.inferencedParams_create();
  }

  /**
   * @override
   */
  onYield_isLegal() {

    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( this.out.nConvBlockTypeId );

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

    // (2022/07/18)
    // Note: In backend WASM, when filter height is 1 or filter width is 1, it sometimes seems that tf.depthwiseConv2d()
    // may calculate wrongly. In backend CPU and WebGL, this problem does not exist.
    //
    // (2022/07/18)
    // Note: In backend WASM, when filter height is 1 and filter width is 1, it seems that tf.pool() (both AVG and MAX)
    // will calculate wrongly. In backend CPU and WebGL, this problem does not exist.
    //
    // (2022/05/01)
    // The tensorflow.js team seems not recognize this issue as a problem and will not fix it. So, we need get around it by
    // ourselves testing procedure.
    //
    if ( tf.getBackend() == "wasm" ) {

      this.generate_out_inferencedParams(); // So that this.out.inferencedParams and .depthwisePadInfo is usable.
      if ( this.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {

        // For depthwise1/depthwis2.
        if ( ( this.out.depthwiseFilterHeight == 1 ) || ( this.out.depthwiseFilterWidth == 1 ) )
          return false;

        let pointwise2_inputHeight = this.out.inferencedParams.depthwisePadInfo.outputHeight;
        let pointwise2_inputWidth = this.out.inferencedParams.depthwisePadInfo.outputWidth;

        // For squeeze-and-excitation.
        //
        // (squeeze is an average pooling. Its filter width is the same as inputWidth (i.e. pointwise2_inputWidth).)
        if (   ( ( pointwise2_inputHeight == 1 ) || ( pointwise2_inputWidth == 1 ) )
            && ( ValueDesc.SqueezeExcitationChannelCountDivisor.hasSqueeze( this.out.nSqueezeExcitationChannelCountDivisor ) )
           )
          return false;
      }
    }

    return true;
  }
  
  /**
   * @override
   */
  onYield_before() {
    // For testing not start at the offset 0.
    let weightElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin, true );
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
    let valueOutMinMax = this.valueOutMinMax = {
      // input0_height: [ 3, 3 ],
      input0_height: [ 1, 5 ],

      // input0_width: [ 4, 5 ],
      input0_width: [ 1, 5 ],

      input0_channelCount: [ 1, 3 ],
      // input0_channelCount: [ 3, 4 ], //[ 1, 3 ],

//!!! (2022/07/06 Temp Remarked) For speed-up debug.
      // nConvBlockTypeId: [
      //   Block.Params.nConvBlockTypeId.valueDesc.range.min,
      //   Block.Params.nConvBlockTypeId.valueDesc.range.max
      // ],
//!!! (2022/07/06 Temp Added and Remarked) For speed-up debug.
      nConvBlockTypeId: [
        Block.Params.nConvBlockTypeId.valueDesc.range.min,
        // ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL, // (1)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY, // (3)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL, // (4)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD, // (5)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY, // (6)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL, // (7)
        // ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL // (1)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL // (4)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD // (5)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY // (6)
        // ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL // (7)
        Block.Params.nConvBlockTypeId.valueDesc.range.max
      ],

//!!! (2022/07/11 Temp Remarked) For speed-up debug.
      // pointwise1ChannelCount: [ 0, 8 ],
      // pointwise1ChannelCount: [ 2, 2 ],
      // pointwise1ChannelCount: [ 0, 0 ],
      pointwise1ChannelCount: [ 0, 2 ],

      pointwise20ChannelCount: [ 1, 3 ],
      // pointwise20ChannelCount: [ 1, 8 ],

//!!! (2022/07/07 Temp Remarked) For speed up debug.
      depthwise_AvgMax_Or_ChannelMultiplier: [
        ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.range.min,
        2
      ],
      // depthwise_AvgMax_Or_ChannelMultiplier: [
      //   1,
      //   2
      // ],

      // (2021/10/06) Note: WASM seems not correct when tf.pool() or tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).
//!!! (2022/08/04 Temp Remarked) For debug neural net (only use 3x3).
      depthwiseFilterHeight: [ Block.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ Block.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],
      // depthwiseFilterHeight: [ 3, 3 ],
      // depthwiseFilterWidth: [ 3, 3 ],
      // depthwiseFilterHeight: [ 2, 2 ],
      // depthwiseFilterWidth: [ 2, 2 ],

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

      depthwiseActivationId:
//       undefined,
        [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],
//        [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
//        [ ValueDesc.ActivationFunction.Singleton.range.min + 1, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      // bSqueezeExcitationPrefix: undefined,
      bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
      // bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.min ],
      // bSqueezeExcitationPrefix: [ ValueDesc.Bool.Singleton.range.max, ValueDesc.Bool.Singleton.range.max ],

      // nSqueezeExcitationChannelCountDivisor: undefined,
      nSqueezeExcitationChannelCountDivisor: [
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
        3
      ],
      // nSqueezeExcitationChannelCountDivisor: [
      //   3,
      //   3
      // ],

      pointwise20ActivationId:
        // undefined,
        [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],
        // [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
        // [ ValueDesc.ActivationFunction.Singleton.range.min + 1, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      // Because the logic of bias and activation function is simpler than other, it could be just randomly tested once
      // (i.e. ( undefined )) for speeding up testing.
 
      ActivationId:
        // undefined,
        [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],
        // [ ValueDesc.ActivationFunction.Singleton.range.min + 0, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
        // [ ValueDesc.ActivationFunction.Singleton.range.min + 1, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],

      bKeepInputTensor: undefined,
//      bKeepInputTensor: [ ValueDesc.Bool.Singleton.range.min, ValueDesc.Bool.Singleton.range.max ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( Block.Params.input0_height,           valueOutMinMax.input0_height ),
      new TestParams.ParamDescConfig( Block.Params.input0_width,            valueOutMinMax.input0_width ),

      new TestParams.ParamDescConfig( Block.Params.pointwise20ChannelCount, valueOutMinMax.pointwise20ChannelCount ),
      new TestParams.ParamDescConfig( Block.Params.pointwise20ActivationId, valueOutMinMax.pointwise20ActivationId ),

      new TestParams.ParamDescConfig( Block.Params.nActivationId,           valueOutMinMax.ActivationId ),

      new TestParams.ParamDescConfig( Block.Params.input0_channelCount,     valueOutMinMax.input0_channelCount ),

      new TestParams.ParamDescConfig( Block.Params.depthwise_AvgMax_Or_ChannelMultiplier,
                                                                            valueOutMinMax.depthwise_AvgMax_Or_ChannelMultiplier ),

      new TestParams.ParamDescConfig( Block.Params.depthwiseStridesPad,     valueOutMinMax.depthwiseStridesPad ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseActivationId,   valueOutMinMax.depthwiseActivationId ),

      new TestParams.ParamDescConfig( Block.Params.pointwise1ChannelCount,  valueOutMinMax.pointwise1ChannelCount ),

      new TestParams.ParamDescConfig( Block.Params.bKeepInputTensor,        valueOutMinMax.bKeepInputTensor ),

      new TestParams.ParamDescConfig( Block.Params.nConvBlockTypeId,        valueOutMinMax.nConvBlockTypeId ),

      new TestParams.ParamDescConfig( Block.Params.bSqueezeExcitationPrefix,
                                                                            valueOutMinMax.bSqueezeExcitationPrefix ),

      new TestParams.ParamDescConfig( Block.Params.nSqueezeExcitationChannelCountDivisor,
                                                                            valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterHeight,   valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterWidth,    valueOutMinMax.depthwiseFilterWidth ),

    ];

    yield *Block_TestParams_Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {number} pointwise1ChannelCount The output channel count of the pointwise1 convolution.
   * @param {string} pointwiseName          A string for debug message of the pointwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise1 convolution, bias and activation.
   */
  use_pointwise1( inputImage, pointwise1ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {
    let result = inputImage.clone_byPointwise_NonPassThrough( pointwise1ChannelCount,
      this.in.paramsNumberArrayObject.pointwise1Filters, this.out.inferencedParams.pointwise1Bias,
      this.in.paramsNumberArrayObject.pointwise1Biases, this.out.inferencedParams.pointwise1ActivationId,
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
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
  use_pointwise1_PassThrough( inputImage, pointwise1ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {
    let result = inputImage.clone_byPointwise_PassThrough( pointwise1ChannelCount,
      this.out.inferencedParams.pointwise1Bias, this.out.inferencedParams.pointwise1ActivationId,
      this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise1 convolution, bias and activation.
   */
  use_depthwise1( inputImage, io_imageNeedDisposeUniqueStack, depthwiseName, parametersDesc ) {
    let result = inputImage.clone_byDepthwise_NonPassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight_real, this.out.depthwiseFilterWidth_real, this.out.depthwiseStridesPad,
      this.in.paramsNumberArrayObject.depthwise1Filters, this.out.inferencedParams.depthwiseBias,
      this.in.paramsNumberArrayObject.depthwise1Biases, this.out.depthwiseActivationId,
      parametersDesc, depthwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise1 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise1 convolution, bias and activation.
   */
  use_depthwise1_PassThrough( inputImage, io_imageNeedDisposeUniqueStack, depthwiseName, parametersDesc ) {
    let result = inputImage.clone_byDepthwise_PassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight_real, this.out.depthwiseFilterWidth_real, this.out.depthwiseStridesPad,
      this.out.inferencedParams.depthwiseBias, this.out.depthwiseActivationId,
      this.Depthwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      parametersDesc, depthwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
    return result;
  }

  /**
   * @param {NumberImage.Base} inputImage   The source image to be processed.
   * @param {string} depthwiseName          A string for debug message of the depthwise2 convolution.
   * @param {string} parametersDesc         A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the depthwise2 convolution, bias and activation.
   */
  use_depthwise2( inputImage, io_imageNeedDisposeUniqueStack, depthwiseName, parametersDesc ) {
    let result = inputImage.clone_byDepthwise_NonPassThrough( this.out.depthwise_AvgMax_Or_ChannelMultiplier,
      this.out.depthwiseFilterHeight_real, this.out.depthwiseFilterWidth_real, this.out.depthwiseStridesPad,
      this.in.paramsNumberArrayObject.depthwise2Filters, this.out.inferencedParams.depthwiseBias,
      this.in.paramsNumberArrayObject.depthwise2Biases, this.out.depthwiseActivationId,
      parametersDesc, depthwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
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
  use_pointwise20( inputImage, pointwise20ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {

    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise20PrefixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId,
          parametersDesc, pointwiseName, "squeezeExcitationPrefix" );
        io_imageNeedDisposeUniqueStack.push( inputImage );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise20ChannelCount,
      this.in.paramsNumberArrayObject.pointwise20Filters, this.out.inferencedParams.pointwise20Bias,
      this.in.paramsNumberArrayObject.pointwise20Biases, this.out.pointwise20ActivationId,
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( squeezeExcitationPrefixOut );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise20PostfixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId,
          parametersDesc, pointwiseName, "squeezeExcitationPostfix" );
        io_imageNeedDisposeUniqueStack.push( pointwiseOut );
      } // Otherwise, do not clone to improve performance.
    }

    return squeezeExcitationPostfixOut;
  }

  /**
   * Pointwise202 uses the same channel count, bias flag and activation function as Pointwise20 (i.e. pointwise20ChannelCount,
   * pointwise20Bias and pointwise20ActivationId), but uses different filters and biases weights (i.e. pointwise202Filters and
   * pointwise202Biases)
   *
   * @param {NumberImage.Base} inputImage    The source image to be processed.
   * @param {number} pointwise20ChannelCount The output channel count of the pointwise202 convolution.
   * @param {string} pointwiseName           A string for debug message of the pointwise202 convolution.
   * @param {string} parametersDesc          A string for debug message of the point-depth-point.
   *
   * @return {NumberImage.Base} Return a newly created object which is the result of the pointwise202 convolution, bias and activation.
   */
  use_pointwise202( inputImage, pointwise20ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {

    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise202PrefixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId,
          parametersDesc, pointwiseName, "squeezeExcitationPrefix" );
        io_imageNeedDisposeUniqueStack.push( inputImage );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise20ChannelCount,
      this.in.paramsNumberArrayObject.pointwise202Filters, this.out.inferencedParams.pointwise20Bias,
      this.in.paramsNumberArrayObject.pointwise202Biases, this.out.pointwise20ActivationId,
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( squeezeExcitationPrefixOut );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise202PostfixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId,
          parametersDesc, pointwiseName, "squeezeExcitationPostfix" );
        io_imageNeedDisposeUniqueStack.push( pointwiseOut );
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
  use_pointwise20_PassThrough( inputImage, pointwise20ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {

    // Note: Since pass-through, the squeeze-and-excitation is not necessary here.

    let result = inputImage.clone_byPointwise_PassThrough( pointwise20ChannelCount,
      this.out.inferencedParams.pointwise20Bias, this.out.pointwise20ActivationId,
      this.Pointwise_PassThrough_FiltersArray_BiasesArray_Bag,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0, // SameWhenPassThrough.
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( inputImage );
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
  use_pointwise21( inputImage, pointwise21ChannelCount, io_imageNeedDisposeUniqueStack, pointwiseName, parametersDesc ) {
    
    let squeezeExcitationPrefixOut = inputImage;
    if ( this.out.bSqueezeExcitationPrefix ) {
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPrefixOut = inputImage.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise21PrefixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId, // (Note: Not pointwise21ActivationId)
          parametersDesc, pointwiseName, "squeezeExcitationPrefix" );
        io_imageNeedDisposeUniqueStack.push( inputImage );
      } // Otherwise, do not clone to improve performance.
    }

    let pointwiseOut = squeezeExcitationPrefixOut.clone_byPointwise_NonPassThrough( pointwise21ChannelCount,
      this.in.paramsNumberArrayObject.pointwise21Filters, this.out.inferencedParams.pointwise20Bias, // (Note: Not pointwise21Bias)
      this.in.paramsNumberArrayObject.pointwise21Biases, this.out.pointwise20ActivationId, // (Note: Not pointwise21ActivationId)
      parametersDesc, pointwiseName );
    io_imageNeedDisposeUniqueStack.push( squeezeExcitationPrefixOut );

    let squeezeExcitationPostfixOut = pointwiseOut;
    if ( !this.out.bSqueezeExcitationPrefix ) { // i.e. postfix
      if ( this.out.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { (-2)
        squeezeExcitationPostfixOut = pointwiseOut.clone_bySqueezeExcitation_NonPassThrough(
          this.out.nSqueezeExcitationChannelCountDivisor,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEIntermediateFilters,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEIntermediateBiases,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEExcitationFilters,
          this.in.paramsNumberArrayObject.pointwise21PostfixSEExcitationBiases,
          this.out.inferencedParams.squeezeExcitationActivationId, // (Note: Not pointwise21ActivationId)
          parametersDesc, pointwiseName, "squeezeExcitationPostfix" );
        io_imageNeedDisposeUniqueStack.push( pointwiseOut );
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

  /** @return {boolean} Return true if this.out.nConvBlockTypeId is (8) (ShuffleNetV2_ByPointwise21's head when no pointwise1). */
  nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2() {
    if ( this.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 )
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
   * @param {number} height        The length of axis0 of the io_object[ propertyName ].
   * @param {number} width         The length of axis1 of the io_object[ propertyName ].
   * @param {number} channelCount  The length of axis2 of the io_object[ propertyName ].
   */
  fill_object_property_numberArray( io_object, propertyName,
    height, width, channelCount
  ) {

    //!!! (2022/05/23 Remarked)
    //Base.ensure_object_property_numberArray_length_filled( io_object, propertyName,
    //   elementCount,
    //   TestParams.Base.weightsValueBegin,
    //   TestParams.Base.weightsValueStep,
    //   TestParams.Base.weightsRandomOffset.min, TestParams.Base.weightsRandomOffset.max,
    //   TestParams.Base.weightsDivisorForRemainder
    // );

    super.ensure_object_property_numberArray_length_existed( io_object, propertyName,
      height, width, channelCount,
      TestParams.Base.weightsValueBegin,
      TestParams.Base.weightsValueStep,
      TestParams.Base.weightsRandomOffset.min, TestParams.Base.weightsRandomOffset.max,
      TestParams.Base.weightsDivisorForRemainder
    );
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
   * @param {Object[]} propertyNames
   * @param {Object[]} propertyNames[ i ].Intermediate.Filters
   * @param {Object[]} propertyNames[ i ].Intermediate.Biases
   * @param {Object[]} propertyNames[ i ].Excitation.Filters
   * @param {Object[]} propertyNames[ i ].Excitation.Biases
   *   The property names of the result object. It should have three object propertyNames[ 0 ], propertyNames[ 1 ], propertyNames[ 2 ].
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
    propertyNames,
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
            throw Error(
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
        intermediate_bBias, propertyNames[ 0 ].Intermediate, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        intermediate_inputChannelCount_B, ( ( bIntermediate ) ? intermediate_outputChannelCount_B : 0 ),
        intermediate_bBias, propertyNames[ 1 ].Intermediate, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        intermediate_inputChannelCount_C, ( ( bIntermediate ) ? intermediate_outputChannelCount_C : 0 ),
        intermediate_bBias, propertyNames[ 2 ].Intermediate, io_numberArrayObject );
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
      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_A, ( ( bExcitation ) ? excitation_outputChannelCount_A : 0 ),
        excitation_bBias, propertyNames[ 0 ].Excitation, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_B, ( ( bExcitation ) ? excitation_outputChannelCount_B : 0 ),
        excitation_bBias, propertyNames[ 1 ].Excitation, io_numberArrayObject );

      this.generate_pointwise_filters_biases(
        excitation_inputChannelCount_C, ( ( bExcitation ) ? excitation_outputChannelCount_C : 0 ),
        excitation_bBias, propertyNames[ 2 ].Excitation, io_numberArrayObject );
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
   * @param {Object} propertyNames
   *   The property names of the result object. It should have two property: { Filters, Biases }. For example,
   * ( propertyNames.Filters == "xxxFilters" ) and ( propertyNames.Biases == "xxxBiases" ). If null, nothing will be filled.
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * two properties may be set: "xxxFilters", "xxxBiases".
   *
   * @return {number}
   *   Return the outputChannelCount of this pointwise operation.
   */
  generate_pointwise_filters_biases( inputChannelCount, outputChannelCount, bBias, propertyNames, io_numberArrayObject ) {

    // If this pointwise operation does not exist, default outputChannelCount will be inputChannelCount.
    let result_outputChannelCount = inputChannelCount;

    if ( propertyNames ) {
      if ( outputChannelCount > 0 ) {
        result_outputChannelCount = outputChannelCount;

        //let filtersWeightsCount = inputChannelCount * outputChannelCount;
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Filters,
          inputChannelCount, 1, outputChannelCount );

        if ( bBias ) {
          let biasesWeightsCount = result_outputChannelCount;
          this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases,
            1, 1, biasesWeightsCount );
        } else {
          this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases,
            1, 1, 0 );
        }

      } else { // No pointwise convolution.
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Filters, 1, 1, 0 );
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases, 1, 1, 0 );
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
   * @param {Object} propertyNames
   *   The property names of the result object. It should have two property: { Filters, Biases }. For example,
   * ( propertyNames.Filters == "xxxFilters" ) and ( propertyNames.Biases == "xxxBiases" ). If null, nothing will be filled.
   *
   * @param {object} io_numberArrayObject
   *   The object will be filled in result data. Every result number array will be set as a property of the object. At most,
   * two properties may be set: "xxxFilters", "xxxBiases".
   *
   * @return {number}
   *   Return the outputChannelCount of this depthwise operation.
   */
  generate_depthwise_filters_biases(
    inputChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bBias,
    propertyNames, io_numberArrayObject ) {

    // If this depthwise operation does not exist, default outputChannelCount will be inputChannelCount.
    let result_outputChannelCount = inputChannelCount;

    if ( propertyNames ) {
      if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
        result_outputChannelCount = inputChannelCount * depthwise_AvgMax_Or_ChannelMultiplier;

        //let filtersWeightsCount = result_outputChannelCount * ( depthwiseFilterHeight * depthwiseFilterWidth );
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Filters,
          depthwiseFilterHeight, depthwiseFilterWidth, result_outputChannelCount );

      } else {
        // Note: if AVG or MAX pooling, this property will be empty array.
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Filters,
          1, 1, 0 );
      }

      if ( depthwise_AvgMax_Or_ChannelMultiplier != 0 ) { // Include avgerage pooling, maximum pooling, convolution.
        if ( bBias ) {
          let biasesWeightsCount = result_outputChannelCount;
          this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases,
            1, 1, biasesWeightsCount );
        } else { // No bias.
          this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases,
            1, 1, 0 );
        }
      } else { // No depthwise convolution, no avg pooling, no max pooling.
        this.fill_object_property_numberArray( io_numberArrayObject, propertyNames.Biases,
          1, 1, 0 );
      }
    }

    return result_outputChannelCount;
  }

  /**
   *
   * @param {Block_TestParams.Base} this
   *   The TestParam object to be referenced (and modified).
   *
   * @param {boolean} bDouble_when_ShuffleNetV2_byMobileNetV1
   *   If true and nConvBlockTypeId is SHUFFLE_NET_V2_BY_MOBILE_NET_V1_Xxx, some channel count will be
   * doubled. Mainly used for testing Block_TestParams.
   */
  generate_Filters_Biases( bDouble_when_ShuffleNetV2_byMobileNetV1 ) {

    let paramsAll = this.out;
    let inferencedParams = paramsAll.inferencedParams;
    //let depthwisePadInfo = inferencedParams.depthwisePadInfo;

    let io_paramsNumberArrayObject = this.in.paramsNumberArrayObject;

    let infoConvBlockType = ValueDesc.ConvBlockType.Singleton.getInfo_byId( paramsAll.nConvBlockTypeId );


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

    let input0_channelCount_for_generating = input0_channelCount_original;
    let pointwise1ChannelCount_for_generating = pointwise1ChannelCount_original;
    let pointwise20ChannelCount_for_generating = pointwise20ChannelCount_original;

    // 0.1 For avoiding channel count can not be divisible by 2 when auto generating testing.
    if ( bDouble_when_ShuffleNetV2_byMobileNetV1 ) {

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
          let pointwise1_outputChannelCount_lowerHalf = pointwise1ChannelCount_original;

          // Because input0's channel count has been doubled (in the above), the higher half is just the same as the original input0's channel count.
          let pointwise1_inputChannelCount_higherHalf = input0_channelCount_original;

          let pointwise1ChannelCount_enlarged = pointwise1_outputChannelCount_lowerHalf + pointwise1_inputChannelCount_higherHalf;
          this.modifyParamValue( Block.Params.pointwise1ChannelCount, pointwise1ChannelCount_enlarged );
        }

        this.doubleParamValue( Block.Params.pointwise20ChannelCount );
      }

    // 0.2 Normal case (i.e. when channel count could be divisible by 2)
    } else {

      if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
        {
          if ( ( pointwise20ChannelCount_original % 2 ) != 0 )
          throw Error( `Block_TestParams.Base.generate_Filters_Biases(): `
            + `pointwise20ChannelCount_original ( ${pointwise20ChannelCount_original} ) `
            + `should be divisible by 2.`
          );
          pointwise20ChannelCount_for_generating = pointwise20ChannelCount_original / 2;
        }

      } else if ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)

        {
          if ( ( input0_channelCount_original % 2 ) != 0 )
          throw Error( `Block_TestParams.Base.generate_Filters_Biases(): `
            + `input0_channelCount_original ( ${input0_channelCount_original} ) `
            + `should be divisible by 2.`
          );
          input0_channelCount_for_generating = input0_channelCount_original / 2;
        }

        if ( pointwise1ChannelCount_original == 0 ) {
          // When the output channel count is not specified, keep it zero.

        } else {

          {
            if ( ( pointwise1ChannelCount_original % 2 ) != 0 )
            throw Error( `Block_TestParams.Base.generate_Filters_Biases(): `
              + `pointwise1ChannelCount_original ( ${pointwise1ChannelCount_original} ) `
              + `should be divisible by 2.`
            );
            pointwise1ChannelCount_for_generating = pointwise1ChannelCount_original / 2;
          }

          let pointwise1_outputChannelCount_lowerHalf = pointwise1ChannelCount_for_generating; // already halved.
          let pointwise1_inputChannelCount_higherHalf = input0_channelCount_for_generating; // already halved.

          let pointwise1ChannelCount_enlarged = pointwise1_outputChannelCount_lowerHalf + pointwise1_inputChannelCount_higherHalf;
          if ( pointwise1ChannelCount_enlarged != input0_channelCount_original )
            throw Error( `Block_TestParams.Base.generate_Filters_Biases(): `
              + `pointwise1ChannelCount_enlarged ( ${pointwise1ChannelCount_enlarged} ) `
              + `should be the same as input0_channelCount_original ( ${input0_channelCount_original} ).`
            );
        }

        {
          if ( ( pointwise20ChannelCount_original % 2 ) != 0 )
          throw Error( `Block_TestParams.Base.generate_Filters_Biases(): `
            + `pointwise20ChannelCount_original ( ${pointwise20ChannelCount_original} ) `
            + `should be divisible by 2.`
          );
          pointwise20ChannelCount_for_generating = pointwise20ChannelCount_original / 2;
        }
      }
    }

    // 1. Pointwise1
    let pointwise1_resultOutputChannelCount = this.generate_pointwise_filters_biases( input0_channelCount_for_generating,
      pointwise1ChannelCount_for_generating, paramsAll.inferencedParams.pointwise1Bias,
      Block_TestParams_Base.PropertyNames.pointwise1, io_paramsNumberArrayObject );

    // 2. Depthwise
    let depthwise1_resultOutputChannelCount;
    let depthwise2_resultOutputChannelCount;

    // Depthwise1
    {
      let depthwise1_inputChannelCount = pointwise1_resultOutputChannelCount;

      // Only if depthwise operation is requested and necessary, create them.
      if ( paramsAll.inferencedParams.bDepthwiseRequestedAndNeeded ) {
        depthwise1_resultOutputChannelCount = this.generate_depthwise_filters_biases( depthwise1_inputChannelCount,
          paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight_real, paramsAll.depthwiseFilterWidth_real,
          paramsAll.depthwiseStridesPad, paramsAll.inferencedParams.depthwiseBias,
          Block_TestParams_Base.PropertyNames.depthwise1, io_paramsNumberArrayObject );
      } else {
        depthwise1_resultOutputChannelCount = depthwise1_inputChannelCount;
        this.generate_depthwise_filters_biases( null, 0, null, null, null, null, Block_TestParams_Base.PropertyNames.depthwise1, io_paramsNumberArrayObject );
      }
    }

    // Depthwise2
    {
      // In ShuffleNetV2's head.
      if (   ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
          || ( this.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
         ) {

        let depthwise2_inputChannelCount = paramsAll.input0_channelCount; // Use input0.

        // Only if depthwise operation is requested and necessary, create them.
        if ( paramsAll.inferencedParams.bDepthwiseRequestedAndNeeded ) {
          depthwise2_resultOutputChannelCount = this.generate_depthwise_filters_biases( depthwise2_inputChannelCount,
            paramsAll.depthwise_AvgMax_Or_ChannelMultiplier, paramsAll.depthwiseFilterHeight_real, paramsAll.depthwiseFilterWidth_real,
            paramsAll.depthwiseStridesPad, paramsAll.inferencedParams.depthwiseBias,
            Block_TestParams_Base.PropertyNames.depthwise2, io_paramsNumberArrayObject );
        } else {
          depthwise2_resultOutputChannelCount = depthwise2_inputChannelCount;
          this.generate_depthwise_filters_biases( null, 0, null, null, null, null,
            Block_TestParams_Base.PropertyNames.depthwise2, io_paramsNumberArrayObject );
        }

      // no depthwise2.
      } else {
        this.generate_depthwise_filters_biases( null, 0, null, null, null, null, Block_TestParams_Base.PropertyNames.depthwise2, io_paramsNumberArrayObject );
      }
    }

    // 3. Concat

    // 3.1 Pointwise2 input/output channel count preparation.
    let pointwise20_inputChannelCount = 0, pointwise202_inputChannelCount = 0, pointwise21_inputChannelCount = 0;
    let pointwise20_outputChannelCount = 0, pointwise202_outputChannelCount = 0, pointwise21_outputChannelCount = 0;
    {
      switch ( paramsAll.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL: // ( 0)
        case ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL: // ( 1)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // ( 2)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise21_inputChannelCount = depthwise2_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          pointwise21_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD: // ( 5)
          pointwise20_inputChannelCount =  depthwise1_resultOutputChannelCount;
          pointwise202_inputChannelCount = depthwise2_resultOutputChannelCount;
          pointwise20_outputChannelCount =  pointwise20ChannelCount_for_generating;
          pointwise202_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY: // ( 3)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL: // ( 4)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY: // ( 6)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL: // ( 7)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2: // ( 8)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise21_inputChannelCount = depthwise1_resultOutputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          pointwise21_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD: // ( 9)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount + depthwise2_resultOutputChannelCount;
          pointwise21_inputChannelCount = pointwise20_inputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          pointwise21_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY: // (10)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount + inferencedParams.input1_channelCount;
          pointwise21_inputChannelCount = pointwise20_inputChannelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          pointwise21_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL: // (11)
          pointwise20_inputChannelCount = depthwise1_resultOutputChannelCount + inferencedParams.input1_channelCount;
          pointwise20_outputChannelCount = pointwise20ChannelCount_for_generating;
          break;

        default:
          if ( channelShuffler == null )
            throw Error( `Block_Reference.Base.calcResult(): `
              + `Block.TestParams.Base.generate_Filters_Biases(): Unknown `
              + `nConvBlockTypeId=`
              + `${ValueDesc.ConvBlockType.Singleton.getName_byId( paramsAll.nConvBlockTypeId )}`
              + `(${paramsAll.nConvBlockTypeId}). `
              + `` );
          break;
      }
    }

    // 3.2 Pointwise21's Preparation.
    //
    // pointwise21's bias flag and activation function should always be the same as pointwise20's.
    let pointwise21Bias, nPointwise21ActivationId;
    {
      pointwise21Bias = paramsAll.inferencedParams.pointwise20Bias;
      nPointwise21ActivationId = paramsAll.pointwise20ActivationId;
    }

    // 4. Pointwise2's prefix squeeze-and-excitation
    if (   ( paramsAll.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
        && ( paramsAll.bSqueezeExcitationPrefix )
       ) {

      // 4.1 Pointwise20's, Pointwise202's, Pointwise21's prefix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.nActivationId,
        pointwise20_inputChannelCount, pointwise202_inputChannelCount, pointwise21_inputChannelCount,
        Block_TestParams_Base.PropertyNames.pointwise2PrefixSE, io_paramsNumberArrayObject );

    } else { // 4.2 Clear all prefix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.nActivationId,
        0, 0, 0,
        Block_TestParams_Base.PropertyNames.pointwise2PrefixSE, io_paramsNumberArrayObject );
    }

    // 5. Pointwise2

    // 5.1 Pointwise20
    //
    // Note: Even if ( Xxx_outputChannelCount == 0 ), the .generate_pointwise_filters_biases() still needs to be called
    //       to clear old them (because TestParams.Block_TestParams_Base.permuteParamRecursively() may not know them and may not clear them.
    {
      let pointwise20_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise20_inputChannelCount,
        pointwise20_outputChannelCount, paramsAll.inferencedParams.pointwise20Bias,
        Block_TestParams_Base.PropertyNames.pointwise20, io_paramsNumberArrayObject );

      let pointwise202_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise202_inputChannelCount,
        pointwise202_outputChannelCount, paramsAll.inferencedParams.pointwise20Bias,
        Block_TestParams_Base.PropertyNames.pointwise202, io_paramsNumberArrayObject );
    }

    // 5.2 Pointwise21
    {
      let pointwise21_resultOutputChannelCount = this.generate_pointwise_filters_biases( pointwise21_inputChannelCount,
        pointwise21_outputChannelCount, pointwise21Bias, Block_TestParams_Base.PropertyNames.pointwise21, io_paramsNumberArrayObject );
    }

    // 6. Pointwise2's postfix squeeze-and-excitation
    if (   ( paramsAll.nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
        && ( !paramsAll.bSqueezeExcitationPrefix )
       ) {

      // 6.1 Pointwise20's, Pointwise202's, Pointwise21's postfix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.nActivationId,
        pointwise20_outputChannelCount, pointwise202_outputChannelCount, pointwise21_outputChannelCount,
        Block_TestParams_Base.PropertyNames.pointwise2PostfixSE, io_paramsNumberArrayObject );

    } else { // 6.2 Clear all postfix squeeze-and-excitation.
      this.generate_squeezeExcitation_filters_biases(
        paramsAll.nSqueezeExcitationChannelCountDivisor, paramsAll.nActivationId,
        0, 0, 0,
        Block_TestParams_Base.PropertyNames.pointwise2PostfixSE, io_paramsNumberArrayObject );
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


Block_TestParams_Base.PropertyNames = {};
Block_TestParams_Base.PropertyNames.pointwise1 = { Filters: "pointwise1Filters", Biases: "pointwise1Biases" };
Block_TestParams_Base.PropertyNames.depthwise1 = { Filters: "depthwise1Filters", Biases: "depthwise1Biases" };
Block_TestParams_Base.PropertyNames.depthwise2 = { Filters: "depthwise2Filters", Biases: "depthwise2Biases" };

Block_TestParams_Base.PropertyNames.pointwise20 =  { Filters: "pointwise20Filters",  Biases: "pointwise20Biases" };
Block_TestParams_Base.PropertyNames.pointwise202 = { Filters: "pointwise202Filters", Biases: "pointwise202Biases" };
Block_TestParams_Base.PropertyNames.pointwise21 =  { Filters: "pointwise21Filters",  Biases: "pointwise21Biases" };

Block_TestParams_Base.PropertyNames.pointwise2PrefixSE = [
  { // pointwise20's prefix squeeze-and-excitation
    Intermediate: { Filters: "pointwise20PrefixSEIntermediateFilters",  Biases: "pointwise20PrefixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise20PrefixSEExcitationFilters",    Biases: "pointwise20PrefixSEExcitationBiases" },
  },

  { // pointwise202's prefix squeeze-and-excitation
    Intermediate: { Filters: "pointwise202PrefixSEIntermediateFilters", Biases: "pointwise202PrefixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise202PrefixSEExcitationFilters",   Biases: "pointwise202PrefixSEExcitationBiases" },
  },

  { // pointwise21's prefix squeeze-and-excitation
    Intermediate: { Filters: "pointwise21PrefixSEIntermediateFilters",  Biases: "pointwise21PrefixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise21PrefixSEExcitationFilters",    Biases: "pointwise21PrefixSEExcitationBiases" },
  },
];

Block_TestParams_Base.PropertyNames.pointwise2PostfixSE = [
  { // pointwise20's postfix squeeze-and-excitation
    Intermediate: { Filters: "pointwise20PostfixSEIntermediateFilters",  Biases: "pointwise20PostfixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise20PostfixSEExcitationFilters",    Biases: "pointwise20PostfixSEExcitationBiases" },
  },

  { // pointwise202's postfix squeeze-and-excitation
    Intermediate: { Filters: "pointwise202PostfixSEIntermediateFilters", Biases: "pointwise202PostfixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise202PostfixSEExcitationFilters",   Biases: "pointwise202PostfixSEExcitationBiases" },
  },

  { // pointwise21's postfix squeeze-and-excitation
    Intermediate: { Filters: "pointwise21PostfixSEIntermediateFilters",  Biases: "pointwise21PostfixSEIntermediateBiases" },
    Excitation:   { Filters: "pointwise21PostfixSEExcitationFilters",    Biases: "pointwise21PostfixSEExcitationBiases" },
  },
];


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Block.initer().
 */
Block_TestParams_Base.paramsNameOrderArray = [
  Block.Params.input0_height.paramName,
  Block.Params.input0_width.paramName,
  Block.Params.input0_channelCount.paramName,
  Block.Params.nConvBlockTypeId.paramName,
  Block.Params.pointwise1ChannelCount.paramName,
  Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.paramName,
  Block.Params.depthwiseFilterHeight.paramName,
  Block.Params.depthwiseFilterWidth.paramName,
  Block.Params.depthwiseStridesPad.paramName,
  Block.Params.depthwiseActivationId.paramName,
  Block.Params.pointwise20ChannelCount.paramName,
  Block.Params.pointwise20ActivationId.paramName,
  Block.Params.nSqueezeExcitationChannelCountDivisor.paramName,
  Block.Params.bSqueezeExcitationPrefix.paramName,
  Block.Params.nActivationId.paramName,

  Block.Params.bKeepInputTensor.paramName,

  Block_TestParams_Base.PropertyNames.pointwise1.Filters,
  Block_TestParams_Base.PropertyNames.pointwise1.Biases,

  Block_TestParams_Base.PropertyNames.depthwise1.Filters,
  Block_TestParams_Base.PropertyNames.depthwise1.Biases,

  Block_TestParams_Base.PropertyNames.depthwise2.Filters,
  Block_TestParams_Base.PropertyNames.depthwise2.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 0 ].Intermediate.Filters, // pointwise20's prefix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 0 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 1 ].Intermediate.Filters, // pointwise202's prefix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 1 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 2 ].Intermediate.Filters, // pointwise21's prefix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 2 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 0 ].Excitation.Filters, // pointwise20's prefix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 0 ].Excitation.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 1 ].Excitation.Filters, // pointwise202's prefix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 1 ].Excitation.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 2 ].Excitation.Filters, // pointwise21's prefix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PrefixSE[ 2 ].Excitation.Biases,

  Block_TestParams_Base.PropertyNames.pointwise20.Filters,
  Block_TestParams_Base.PropertyNames.pointwise20.Biases,

  Block_TestParams_Base.PropertyNames.pointwise202.Filters,
  Block_TestParams_Base.PropertyNames.pointwise202.Biases,

  Block_TestParams_Base.PropertyNames.pointwise21.Filters,
  Block_TestParams_Base.PropertyNames.pointwise21.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 0 ].Intermediate.Filters, // pointwise20's postfix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 0 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 1 ].Intermediate.Filters, // pointwise202's postfix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 1 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 2 ].Intermediate.Filters, // pointwise21's postfix squeeze-and-excitation's intermediate pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 2 ].Intermediate.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 0 ].Excitation.Filters, // pointwise20's postfix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 0 ].Excitation.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 1 ].Excitation.Filters, // pointwise202's postfix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 1 ].Excitation.Biases,

  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 2 ].Excitation.Filters, // pointwise21's postfix squeeze-and-excitation's excitation pointwise
  Block_TestParams_Base.PropertyNames.pointwise2PostfixSE[ 2 ].Excitation.Biases,

];

