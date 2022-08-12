export { Stage_TestParams_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Stage from "../../Conv/Stage.js";
import * as TestParams from "./TestParams.js";
import * as Block_TestParams from "./Block_TestParams.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @member {object[]} blockArray
 *   Every element is an Block_TestParams object for the parameters of the block.
 *
 * @see TestParams.Base
 */
class Stage_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Stage_TestParams.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage_TestParams.Base.Pool", Stage_TestParams_Base, Stage_TestParams_Base.setAsConstructor );

  /**
   */
  constructor( id ) {
    super( id );
    Stage_TestParams_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( id ) {
    super.setAsConstructor( id );
    Stage_TestParams_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.blockArray = Recyclable.OwnerArray.Pool.get_or_create_by();
    this.out = Stage.ParamsBase.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.out?.disposeResources_and_recycleToPool();
    this.out = null;

    this.blockArray?.disposeResources_and_recycleToPool();
    this.blockArray = null;

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
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor
  ) {
    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = Stage.ParamsBase.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor
    );

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in_weights
   *   - this.out.inferencedParams
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {Stage.ParamsBase} this.out
   *   An object which will be the final result of Stage.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result inputWeightArray.
   * The this.in.byteOffsetBegin will be ( 4 * weightElementOffsetBegin ).
   *
   * @return {Stage_TestParams_Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin = 0 ) {
    let stageParams = this.out;

    this.generate_out_inferencedParams(); // Generate blockParamsArray[].

    let blockParamsArray = stageParams.inferencedParams.blockParamsArray;

    this.blockArray.clear();
    this.blockArray.length = blockParamsArray.length;

    this.in.paramsNumberArrayObject.length = 0;

    let blockParams;
    for ( let i = 0; i < blockParamsArray.length; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.
      blockParams = blockParamsArray[ i ]; // Get current block parameters.

      let blockTestParams = Block_TestParams.Base.Pool.get_or_create_by( this.id );
      blockTestParams.set_byParamsScattered(
        blockParams.input0_height, blockParams.input0_width, blockParams.input0_channelCount,
        blockParams.nConvBlockTypeId,
        blockParams.pointwise1ChannelCount,
        blockParams.depthwise_AvgMax_Or_ChannelMultiplier, blockParams.depthwiseFilterHeight,
        blockParams.depthwiseFilterWidth, blockParams.depthwiseStridesPad,
        blockParams.depthwiseActivationId,
        blockParams.pointwise20ChannelCount, blockParams.pointwise20ActivationId,
        blockParams.nSqueezeExcitationChannelCountDivisor, blockParams.bSqueezeExcitationPrefix,
        blockParams.nActivationId,
        blockParams.bKeepInputTensor
      );

      this.blockArray[ i ] = blockTestParams;
      this.in.paramsNumberArrayObject.push( blockTestParams.in_weights.weightArray ); // Place every block's parameters in sequence.
    }

    // Pack all parameters, filters, biases weights into a (pre-allocated and re-used) NumberArray.
    this.in_weights.set_byConcat(
      Stage_TestParams_Base.paramsNameOrderArray_Basic, this.in.paramsNumberArrayObject, weightElementOffsetBegin );

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

//!!! ...unfinished... (2022/07/22)
//
//     // (2021/07/20)
//     // Note: In backend WASM, when filter width is 1 (note: filter height does not have this issue and could be 1), it seems that
//     // tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() will calculate wrongly. In backend CPU and WebGL, this problem does
//     // not exist.
//     //
//     // (2022/05/01)
//     // The tensorflow.js team seems not recognize this issue as a problem and will not fix it. So, we need get around it by
//     // ourselves testing procedure.
//     if ( tf.getBackend() == "wasm" ) {
//
//       this.generate_out_inferencedParams(); // So that this.out.inferencedParams and .depthwisePadInfo is usable.
//
//       *   - this.depthwiseFilterWidthArray
//       *   - this.depthwiseFilterHeightArray
// 
//       if ( this.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
//
//         // For depthwise1/depthwis2.
//         if ( this.out.depthwiseFilterWidth == 1 )
//           return false;
//
//         let pointwise2_inputWidth = this.out.inferencedParams.depthwisePadInfo.outputWidth;
//
//         // For squeeze-and-excitation.
//         //
//         // (squeeze is an average pooling. Its filter width is the same as inputWidth (i.e. pointwise2_inputWidth).)
//         if (   ( pointwise2_inputWidth == 1 )
//             && ( ValueDesc.SqueezeExcitationChannelCountDivisor.hasSqueeze( this.out.nSqueezeExcitationChannelCountDivisor ) )
//            )
//           return false;
//       }
//     }

    return true;
  }

  /**
   * @override
   */
  onYield_before() {

    // For testing not start at the offset 0.
    let weightElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin );
  }

  /**
   * @override
   */
  onYield_after() {
    this.blockArray.clear(); // Clear blocks' parameters.
  }

  /**
   * Responsible for generating testing paramters combinations.
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
//!!! (2022/07/22 Temp Remarked) For test more.
      // input_height: [ 3, 3 ],
      // input_width:  [ 4, 5 ], // Test different input image width (even and odd).
      // input_channelCount: [ 3, 4 ],
//!!! (2022/07/22 Temp Remarked) For speed-up debug.
      input_height: [ 3, 3 ],
      input_width:  [ 5, 5 ],
      input_channelCount: [ 3, 3 ],

//      nConvStageTypeId: undefined,
//!!! (2022/07/20 Temp Remarked) For speed-up debug.
      // nConvStageTypeId: [
      //   Stage.Params.nConvStageTypeId.valueDesc.range.min,
      //   Stage.Params.nConvStageTypeId.valueDesc.range.max
      // ],
      nConvStageTypeId: [
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1, // (0)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID, // (1)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN, // (2)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2, // (3)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2, // (4)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1, // (5)
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21, // (7)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 // (5)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID // (6)
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21 // (7)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 // (4)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2 // (3)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN // (2)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID // (1)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1 // (0)
      ],

//!!! (2022/08/04 Temp Remarked) For speed-up debug.
      // blockCountRequested: [
      //   Stage.Params.blockCountRequested.valueDesc.range.min,
      //   Stage.Params.blockCountRequested.valueDesc.range.min + 3
      // ],
      blockCountRequested: [
        3,
        3
      ],

//      bPointwise1: undefined,
//!!! (2022/08/04 Temp Remarked) For speed-up debug.
      bPointwise1: [
        Stage.Params.bPointwise1.valueDesc.range.min,
        Stage.Params.bPointwise1.valueDesc.range.max
      ],
      // bPointwise1: [
      //   false,
      //   false
      // ],

      // (2022/05/05) Note: WASM seems not correct when tf.pool() or tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).
//!!! (2022/07/22 Remarked) to avoid depthwise filter 1 x N or N x 1
//      depthwiseFilterHeight: [ Stage.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
//      depthwiseFilterWidth: [ Stage.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],
//!!! (2022/08/04 Temp Remarked) For speed-up debug.
      // depthwiseFilterHeight: [ 2, depthwiseFilterMaxSize ],
      // depthwiseFilterWidth: [ 2, depthwiseFilterMaxSize ],
      depthwiseFilterHeight: [ 3, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ 2, depthwiseFilterMaxSize ],

//      nSqueezeExcitationChannelCountDivisor: undefined,
//!!! (2022/08/03 Temp Remarked) For speed-up debug.
      // nSqueezeExcitationChannelCountDivisor: [
      //   ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
      //   3
      // ],
      nSqueezeExcitationChannelCountDivisor: [
        0,
        0
      ],
      // nSqueezeExcitationChannelCountDivisor: [
      //   ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION,
      //   ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION
      // ],

      // Must have ActivationFunction (i.e. can not be NONE). Otherwise, it easily results in infinity value because of multiple block.
      //
//      nActivationId: [ ValueDesc.ActivationFunction.Singleton.range.max, ValueDesc.ActivationFunction.Singleton.range.max ],
      nActivationId: [ false, false ],

//      bKeepInputTensor: undefined,
//!!! (2022/08/04 Temp Remarked) For speed-up debug.
      bKeepInputTensor: [
        Stage.Params.bKeepInputTensor.valueDesc.range.min,
        Stage.Params.bKeepInputTensor.valueDesc.range.max
      ],
      // bKeepInputTensor: [
      //   false,
      //   false
      // ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Stage.Params.input_height,                   valueOutMinMax.input_height ),
      new TestParams.ParamDescConfig( Stage.Params.input_width,                    valueOutMinMax.input_width ),
      new TestParams.ParamDescConfig( Stage.Params.input_channelCount,             valueOutMinMax.input_channelCount ),
      new TestParams.ParamDescConfig( Stage.Params.nConvStageTypeId,               valueOutMinMax.nConvStageTypeId ),
      new TestParams.ParamDescConfig( Stage.Params.blockCountRequested,            valueOutMinMax.blockCountRequested ),
      new TestParams.ParamDescConfig( Stage.Params.bPointwise1,                    valueOutMinMax.bPointwise1 ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterHeight,          valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterWidth,           valueOutMinMax.depthwiseFilterWidth ),

      new TestParams.ParamDescConfig( Stage.Params.nSqueezeExcitationChannelCountDivisor,
                                                                                   valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

      new TestParams.ParamDescConfig( Stage.Params.nActivationId,                  valueOutMinMax.nActivationId ),
      new TestParams.ParamDescConfig( Stage.Params.bKeepInputTensor,               valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Stage_TestParams_Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Stage.initer().
 */
Stage_TestParams_Base.paramsNameOrderArray_Basic = [
  Stage.Params.input_height.paramName,
  Stage.Params.input_width.paramName,
  Stage.Params.input_channelCount.paramName,
  Stage.Params.nConvStageTypeId.paramName,
  Stage.Params.blockCountRequested.paramName,
  Stage.Params.bPointwise1.paramName,
  Stage.Params.depthwiseFilterHeight.paramName,
  Stage.Params.depthwiseFilterWidth.paramName,
  Stage.Params.nSqueezeExcitationChannelCountDivisor.paramName,  
  Stage.Params.nActivationId.paramName,
  Stage.Params.bKeepInputTensor.paramName,
];
