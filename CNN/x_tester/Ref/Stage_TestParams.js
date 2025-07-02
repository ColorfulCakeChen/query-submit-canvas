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
 *   Every element is an Block_TestParams object for the parameters of the
 * block.
 *
 * @see TestParams.Base
 */
class Stage_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Stage_TestParams.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage_TestParams.Base.Pool",
    Stage_TestParams_Base );

  /**
   */
  constructor( id ) {
    super( id );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( id ) {
    super.setAsConstructor( id );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
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
   * @param {Stage.ParamsBase} aParamsBase  The parameters of stage.
   *
   * @return {Base}  Return this object self.
   */
  set_byParamsBase( aParamsBase ) {
    return this.set_byParamsScattered(
      aParamsBase.input_height,
      aParamsBase.input_width,
      aParamsBase.input_channelCount,
      aParamsBase.nConvStageTypeId,
      aParamsBase.blockCountRequested,
      aParamsBase.bPointwise1,
      aParamsBase.depthwiseFilterHeight,
      aParamsBase.depthwiseFilterWidth,
      aParamsBase.nSqueezeExcitationChannelCountDivisor,
      aParamsBase.nActivationId,
      aParamsBase.bKeepInputTensor,
      aParamsBase.bTableLog
    );
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
    bKeepInputTensor,
    bTableLog
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
      bKeepInputTensor,
      bTableLog
    );

    // So that all parameters are by specified (none is by evolution).
    Object.assign( this.in, this.out );

    let weightElementOffsetBegin = 0;
    return this.set_byParamsNumberArrayObject_ParamsOut(
      weightElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in_weights
   *   - this.out.inferencedParams
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map
   * from a string name (e.g. parameter name) to a number array. The name
   * should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {Stage.ParamsBase} this.out
   *   An object which will be the final result of Stage.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the
   * result inputWeightArray. The this.in.byteOffsetBegin will be
   * ( 4 * weightElementOffsetBegin ).
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

    { // 1. Generate every sub block test params.

      // Block0, 1, 2, 3, ..., BlockLast.
      for ( let i = 0; i < blockParamsArray.length; ++i ) {

        // Get current block parameters.
        let blockParams = blockParamsArray[ i ];

        let blockTestParams
          = Block_TestParams.Base.Pool.get_or_create_by( this.id );

        blockTestParams.set_byParamsScattered(
          blockParams.input0_height,
          blockParams.input0_width,
          blockParams.input0_channelCount,
          blockParams.nConvBlockTypeId,
          blockParams.pointwise1ChannelCount,
          blockParams.depthwise_AvgMax_Or_ChannelMultiplier,
          blockParams.depthwiseFilterHeight,
          blockParams.depthwiseFilterWidth,
          blockParams.depthwiseStridesPad,
          blockParams.depthwiseActivationId,
          blockParams.pointwise20ChannelCount,
          blockParams.pointwise20ActivationId,
          blockParams.nSqueezeExcitationChannelCountDivisor,
          blockParams.bSqueezeExcitationPrefix,
          blockParams.nActivationId,
          blockParams.bKeepInputTensor,
          blockParams.bTableLog
        );

        this.blockArray[ i ] = blockTestParams;

        // Place every block's parameters in sequence.
        this.in.paramsNumberArrayObject.push(
          blockTestParams.in_weights.weightArray );
      }
    }

    // 2. Pack all parameters, filters, biases weights into a (pre-allocated
    //    and re-used) NumberArray.
    this.in_weights.set_byConcat(
      Stage_TestParams_Base.paramsNameOrderArray_Basic,
      this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    { // 3. Release temporary intermediate array for reducing memory usage.
      let blockTestParams;
      for ( let i = 0; i < this.blockArray.length; ++i ) {
        blockTestParams = this.blockArray[ i ];
        blockTestParams.in_weights.weightArray.length = 0;
      }
    }

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
//     // Note: In backend WASM, when filter width is 1 (note: filter height
//     //       does not have this issue and could be 1), it seems that
//     //       tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() will
//     //       calculate wrongly. In backend CPU and WebGL, this problem does
//     //       not exist.
//     //
//     // (2022/05/01)
//     // The tensorflow.js team seems not recognize this issue as a problem
//     // and will not fix it. So, we need get around it by ourselves testing
//     // procedure.
//     if ( tf.getBackend() == "wasm" ) {
//
//       // So that this.out.inferencedParams and .depthwisePadInfo is usable.
//       this.generate_out_inferencedParams();
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
//         let pointwise2_inputWidth
//           = this.out.inferencedParams.depthwisePadInfo.outputWidth;
//
//         // For squeeze-and-excitation.
//         //
//         // (squeeze is an average pooling. Its filter width is the same as
//         // inputWidth (i.e. pointwise2_inputWidth).)
//         if (   ( pointwise2_inputWidth == 1 )
//             && ( ValueDesc.SqueezeExcitationChannelCountDivisor.hasSqueeze(
//                    this.out.nSqueezeExcitationChannelCountDivisor ) )
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
    // Skip a random un-used element count.
    let weightElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 );

    this.set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin );
  }

  /**
   * @override
   */
  onYield_after() {
    this.blockArray.clear(); // Clear blocks' parameters.
  }

  /**
   * @return {TestParams.ParamDescConfigAll}
   *   Create and return the configuration for generating testing paramters
   * combinations. It can be used to call .ParamsGenerator().
   */
  ParamDescConfigAll_create() {

    // (2022/04/30 Remarked) For speed up testing by reducing testing space.
    //let depthwiseFilterMaxSize = 5;
    let depthwiseFilterMaxSize = 3;

    // Restrict some parameter's large kinds. Otherwise, too many combination
    // will be generated.
    let valueOutMinMax = this.valueOutMinMax = {

      input_height: [
        3,
        3
      ],

      // Test different input image width (even and odd).
      input_width:  [
        4,
        // 5,
        // 4
        5
      ],

      input_channelCount: [
        3,
        // 4,
        // 3
        4
      ],

      nConvStageTypeId: [
        Stage.Params.nConvStageTypeId.valueDesc.range.min,
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1,           // (0)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID, // (1)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN,      // (2)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2,           // (3)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2,          // (4)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1,           // (5)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID, // (6)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21,             // (7)

        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1           // (0)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID // (1)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN      // (2)
        // ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2           // (3)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2          // (4)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1           // (5)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID // (6)
        // ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21             // (7)
        Stage.Params.nConvStageTypeId.valueDesc.range.max
      ],

      blockCountRequested: [
        Stage.Params.blockCountRequested.valueDesc.range.min, // 2
        // 2
        Stage.Params.blockCountRequested.valueDesc.range.min + 3
      ],

      bPointwise1: [
        // Stage.Params.bPointwise1.valueDesc.range.min,
        Stage.Params.bPointwise1.valueDesc.range.max,
        // Stage.Params.bPointwise1.valueDesc.range.min
        Stage.Params.bPointwise1.valueDesc.range.max
      ],

      depthwiseFilterHeight: [
        // Stage.Params.depthwiseFilterHeight.valueDesc.range.min, // 1
        // 2,
        3,
        depthwiseFilterMaxSize
      ],

      // (2022/05/05)
      // Note: WASM seems not correct when tf.pool() or
      //       tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).

      depthwiseFilterWidth: [
        // Stage.Params.depthwiseFilterWidth.valueDesc.range.min, // 2
        3,
        depthwiseFilterMaxSize
      ],

      nSqueezeExcitationChannelCountDivisor: [
        // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min, // -2
        // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE, // -2
        // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, // -1
        // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION, // 0
        // 1,
        2,
        3
      ],

      // Must have ActivationFunction (i.e. can not be NONE). Otherwise, it easily
      // results in infinity value because of multiple block.
      //
      nActivationId: [ 
        // ValueDesc.ActivationFunction.Singleton.range.min + 0,
        ValueDesc.ActivationFunction.Singleton.range.min + 1,
        // ValueDesc.ActivationFunction.Singleton.range.min + 0
        ValueDesc.ActivationFunction.Singleton.range.min + 1
      ],

      bKeepInputTensor: [
        Stage.Params.bKeepInputTensor.valueDesc.range.min,
        // Stage.Params.bKeepInputTensor.valueDesc.range.max
        // Stage.Params.bKeepInputTensor.valueDesc.range.min
        Stage.Params.bKeepInputTensor.valueDesc.range.max
      ],

      bTableLog: [
        // (2025/06/04 Temp Remarked) For debug.
        // 0, 0
        1, 1
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these elements could be adjusted to change testing order.
    //       The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Stage.Params.input_height,
        valueOutMinMax.input_height ),
      new TestParams.ParamDescConfig( Stage.Params.input_width,
        valueOutMinMax.input_width ),
      new TestParams.ParamDescConfig( Stage.Params.input_channelCount,
        valueOutMinMax.input_channelCount ),
      new TestParams.ParamDescConfig( Stage.Params.nConvStageTypeId,
        valueOutMinMax.nConvStageTypeId ),
      new TestParams.ParamDescConfig( Stage.Params.blockCountRequested,
        valueOutMinMax.blockCountRequested ),
      new TestParams.ParamDescConfig( Stage.Params.bPointwise1,
        valueOutMinMax.bPointwise1 ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterHeight,
        valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterWidth,
        valueOutMinMax.depthwiseFilterWidth ),

      new TestParams.ParamDescConfig( Stage.Params.nSqueezeExcitationChannelCountDivisor,
        valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

      new TestParams.ParamDescConfig( Stage.Params.nActivationId,
        valueOutMinMax.nActivationId ),
      new TestParams.ParamDescConfig( Stage.Params.bKeepInputTensor,
        valueOutMinMax.bKeepInputTensor ),
      new TestParams.ParamDescConfig( Stage.Params.bTableLog,
        valueOutMinMax.bTableLog ),
    ];

    const theParamDescConfigAll
      = new TestParams.ParamDescConfigAll( paramDescConfigArray );

    return theParamDescConfigAll;
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the
 * parameter extracting order of Stage.initer().
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
  Stage.Params.bTableLog.paramName,
];
