export { Embedding_TestParams_Base as Base };
export { Out };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TestParams from "./TestParams.js";
//import * as Embedding from "../../Conv/Embedding.js";

/**
 *
 */
class Out extends Recyclable.Root {

  /**
   * Used as default Embedding_TestParams.Out provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_TestParams.Out.Pool", Out, Out.setAsConstructor );

  /**
   */
  constructor(
    input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    super();
    Out.setAsConstructor_self.call( this,
      input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    Out.setAsConstructor_self.call( this,
      input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {
    this.input_channelCount = input_channelCount;
    this.channelMultiplier = channelMultiplier;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.InferencedParams_dispose();

    this.input_channelCount = undefined;
    this.channelMultiplier = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.bEmbedVocabularyId = undefined;
    this.bKeepInputTensor = undefined;

    super.disposeResources();
  }

  /** Release .inferencedParams */
  InferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /**  */
  generate_inferencedParams() {
    this.InferencedParams_dispose();
    this.inferencedParams = Embedding.InferencedParams.Pool.get_or_create_by(
      this.input_channelCount, this.channelMultiplier
    );
  }

  /** @override */
  toString() {
    let paramsOutDescription =
        `input_channelCount=${this.input_channelCount}, `
      + `channelMultiplier=${this.channelMultiplier}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `

      + `output_channelCount=${this.inferencedParams.output_channelCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}


/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 */
class Embedding_TestParams_Base extends TestParams.Base {

  /**
   * Used as default Embedding_TestParams.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding_TestParams.Base.Pool",
    Embedding_TestParams_Base, Embedding_TestParams_Base.setAsConstructor );

  /**
   */
  constructor( id ) {
    super( id );
    Embedding_TestParams_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( id ) {
    super.setAsConstructor( id );
    Embedding_TestParams_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.out = Out.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

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
    input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    bKeepInputTensor
  ) {

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = Out.Pool.get_or_create_by(
      input_channelCount, channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
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
   * @param {Embedding_TestParams.Out} this.out
   *   An object which will be the final result of Embedding.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result inputWeightArray.
   * The this.in.byteOffsetBegin will be ( 4 * weightElementOffsetBegin ).
   *
   * @return {Embedding_TestParams_Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin = 0 ) {

//!!! ...unfinished... (2022/07/26)

    let stageParams = this.out;

    this.generate_out_inferencedParams();

    let blockParamsCreator = Embedding.Base.create_BlockParamsCreator_byStageParams( stageParams );
    blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last();

    this.blockArray.clear();
    this.blockArray.length = blockParamsCreator.blockCount;

//!!! (2022/07/24 Remarked) use integer numeric propert name instead.
//     let paramsNameOrderArray_modified = Recyclable.Array.Pool.get_or_create_by( ...Base.paramsNameOrderArray_Basic ); // Shallow copy.
//
//     let paramsNumberArrayObject_modified = {};
//     Object.assign( paramsNumberArrayObject_modified, this.in.paramsNumberArrayObject ); // Shallow copy.

    this.in.paramsNumberArrayObject.length = 0;

    for ( let i = 0; i < blockParamsCreator.blockCount; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

      if ( 0 == i ) { // Block0.
        blockParamsCreator.configTo_beforeBlock0();
      } else { // (i.e. block1, 2, 3, ...)
        blockParamsCreator.configTo_beforeBlockN_exceptBlock0( i );
      }

      if ( ( this.blockArray.length - 1 ) == i ) { // BlockLast. (Note: Block0 may also be BlockLast.)
        blockParamsCreator.configTo_beforeBlockLast();
      }

//!!! (2022/07/24 Remarked) use integer numeric propert name instead.
//       let blockName = `block${i}`;
//       paramsNameOrderArray_modified.push( blockName ); // Place every block's parameters in sequence.

      let blockTestParams = Block_TestParams.Base.Pool.get_or_create_by( this.id );
      blockTestParams.set_byParamsScattered(
        blockParamsCreator.input0_height, blockParamsCreator.input0_width, blockParamsCreator.input0_channelCount,
        blockParamsCreator.nConvBlockTypeId,
        blockParamsCreator.pointwise1ChannelCount,
        blockParamsCreator.depthwise_AvgMax_Or_ChannelMultiplier, blockParamsCreator.depthwiseFilterHeight,
        blockParamsCreator.depthwiseFilterWidth, blockParamsCreator.depthwiseStridesPad,
        blockParamsCreator.depthwiseActivationId,
        blockParamsCreator.pointwise20ChannelCount, blockParamsCreator.pointwise20ActivationId,
        blockParamsCreator.nSqueezeExcitationChannelCountDivisor, blockParamsCreator.bSqueezeExcitationPrefix,
        blockParamsCreator.nActivationId,
        blockParamsCreator.bKeepInputTensor
      );

      this.blockArray[ i ] = blockTestParams;
      this.in.paramsNumberArrayObject.push( blockTestParams.in_weights.weightArray ); // Place every block's parameters in sequence.
    }

    if ( blockParamsCreator ) {
      blockParamsCreator.disposeResources_and_recycleToPool();
      blockParamsCreator = null;
    }

    // Pack all parameters, filters, biases weights into a (pre-allocated and re-used) NumberArray.
    this.in_weights.set_byConcat(
      Embedding_TestParams_Base.paramsNameOrderArray_Basic, this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    return this;
  }

  /** Fill this.out.inferencedParams according to this.out */
  generate_out_inferencedParams() {
    this.out.generate_inferencedParams();
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
    this.valueOutMinMax = {
//!!! (2022/07/22 Temp Remarked) For test more.
      sourceHeight: [ 3, 3 ],
      sourceWidth:  [ 4, 5 ], // Test different input image width (even and odd).
      sourceChannelCount: [ 3, 4 ],
//!!! (2022/07/22 Temp Remarked) For speed-up debug.
      // sourceHeight: [ 1, 5 ],
      // sourceWidth:  [ 1, 5 ], // Test different input image width (even and odd).
      // sourceChannelCount: [ 3, 4 ],

//      nConvStageTypeId: undefined,
//!!! (2022/07/20 Temp Remarked) For speed-up debug.
      nConvStageTypeId: [
        Embedding.Params.nConvStageTypeId.valueDesc.range.min,
        Embedding.Params.nConvStageTypeId.valueDesc.range.max
      ],
      // nConvStageTypeId: [
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1, // (0)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID, // (1)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN, // (2)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2, // (3)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2, // (4)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1, // (5)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21, // (7)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 // (5)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID // (6)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21 // (7)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 // (4)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2 // (3)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN // (2)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID // (1)
      //   ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1 // (0)
      // ],

      blockCountRequested: [
        Embedding.Params.blockCountRequested.valueDesc.range.min,
        Embedding.Params.blockCountRequested.valueDesc.range.min + 2
      ],

//      bPointwise1: undefined,
      bPointwise1: [
        Embedding.Params.bPointwise1.valueDesc.range.min,
        Embedding.Params.bPointwise1.valueDesc.range.max
      ],

      // (2022/05/05) Note: WASM seems not correct when tf.pool() or tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).
//!!! (2022/07/22 Remarked) to avoid depthwise filter 1 x N or N x 1
//      depthwiseFilterHeight: [ Embedding.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
//      depthwiseFilterWidth: [ Embedding.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],
      depthwiseFilterHeight: [ 2, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ 2, depthwiseFilterMaxSize ],

      bPointwise2ActivatedAtStageEnd: [
        Embedding.Params.bPointwise2ActivatedAtStageEnd.valueDesc.range.min,
        Embedding.Params.bPointwise2ActivatedAtStageEnd.valueDesc.range.max
      ],

//      nSqueezeExcitationChannelCountDivisor: undefined,
      nSqueezeExcitationChannelCountDivisor: [
        ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.range.min,
        3
      ],

      // Must have ActivationFunction (i.e. can not be NONE). Otherwise, it easily results in infinity value because of multiple block.
      //
       nActivationId: [ ValueDesc.ActivationFunction.Singleton.range.max, ValueDesc.ActivationFunction.Singleton.range.max ],

//      bKeepInputTensor: undefined,
      bKeepInputTensor: [
        Embedding.Params.bKeepInputTensor.valueDesc.range.min,
        Embedding.Params.bKeepInputTensor.valueDesc.range.max
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Embedding.Params.sourceHeight,                   this.valueOutMinMax.sourceHeight ),
      new TestParams.ParamDescConfig( Embedding.Params.sourceWidth,                    this.valueOutMinMax.sourceWidth ),
      new TestParams.ParamDescConfig( Embedding.Params.sourceChannelCount,             this.valueOutMinMax.sourceChannelCount ),
      new TestParams.ParamDescConfig( Embedding.Params.nConvStageTypeId,               this.valueOutMinMax.nConvStageTypeId ),
      new TestParams.ParamDescConfig( Embedding.Params.blockCountRequested,            this.valueOutMinMax.blockCountRequested ),
      new TestParams.ParamDescConfig( Embedding.Params.bPointwise1,                    this.valueOutMinMax.bPointwise1 ),
      new TestParams.ParamDescConfig( Embedding.Params.depthwiseFilterHeight,          this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Embedding.Params.depthwiseFilterWidth,           this.valueOutMinMax.depthwiseFilterWidth ),
      new TestParams.ParamDescConfig( Embedding.Params.bPointwise2ActivatedAtStageEnd, this.valueOutMinMax.bPointwise2ActivatedAtStageEnd ),

      new TestParams.ParamDescConfig( Embedding.Params.nSqueezeExcitationChannelCountDivisor,
                                                                                   this.valueOutMinMax.nSqueezeExcitationChannelCountDivisor ),

      new TestParams.ParamDescConfig( Embedding.Params.nActivationId,                  this.valueOutMinMax.nActivationId ),
      new TestParams.ParamDescConfig( Embedding.Params.bKeepInputTensor,               this.valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Embedding_TestParams_Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Embedding.initer().
 */
Embedding_TestParams_Base.paramsNameOrderArray_Basic = [
  Embedding.Params.sourceHeight.paramName,
  Embedding.Params.sourceWidth.paramName,
  Embedding.Params.sourceChannelCount.paramName,
  Embedding.Params.nConvStageTypeId.paramName,
  Embedding.Params.blockCountRequested.paramName,
  Embedding.Params.bPointwise1.paramName,
  Embedding.Params.depthwiseFilterHeight.paramName,
  Embedding.Params.depthwiseFilterWidth.paramName,
  Embedding.Params.bPointwise2ActivatedAtStageEnd.paramName,
  Embedding.Params.nSqueezeExcitationChannelCountDivisor.paramName,  
  Embedding.Params.nActivationId.paramName,
  Embedding.Params.bKeepInputTensor.paramName,
];
