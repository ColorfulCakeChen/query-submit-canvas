export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as NameNumberArrayObject_To_Float32Array from "../../util/NameNumberArrayObject_To_Float32Array.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";
import * as TestParams from "./TestParams.js";
import * as Block_TestParams from "./Block_TestParams.js";
import * as Stage from "../../Conv/Stage.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of the Stage.Params's constructor. That is,
 * it has the following data members: sourceHeight, sourceWidth, sourceChannelCount, blockCountRequested,
 * pointwise1ChannelCountRate, depthwiseFilterHeight, nActivationId, nActivationIdAtStageEnd, nWhetherShuffleChannel,
 * bKeepInputTensor. It also has the following properties:
 *   - paramsNumberArrayObject
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of Stage.Params's extract(). That is, it has
 * the above data members (with outputHeight, outputWidth) except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 * @member {object[]} blocksArray
 *   Every element is an Block_TestParams object for the parameters of the block.
 */
class Base extends TestParams.Base {

  /**
   *
   */
  constructor() {
    super();
    this.blocksArray = new Array();
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
  set_By_ParamsScattered(
    sourceHeight, sourceWidth, sourceChannelCount, blockCountRequested, bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth, nActivationId,
    bPointwise2ActivatedAtStageEnd, nConvStageType, bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      sourceHeight, sourceWidth, sourceChannelCount, blockCountRequested, bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth, nActivationId,
      bPointwise2ActivatedAtStageEnd, nConvStageType, bKeepInputTensor
    };

    Object.assign( this.in, this.out ); // So that all parameters are by specified (none is by evolution).

    let weightsElementOffsetBegin = 0;
    return this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }
 
  /**
   * Fills the following proterties:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *   - this.out.outputHeight
   *   - this.out.outputWidth
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {object} this.out
   *   An object which has the following data members: sourceHeight, sourceWidth, sourceChannelCount, blockCountRequested,
   * bPointwise1, depthwiseFilterHeight, depthwiseFilterWidth, nActivationId, bPointwise2ActivatedAtStageEnd, nConvStageType,
   * bKeepInputTensor, outputHeight, outputWidth.
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightsElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {
    let stageParams = this.out;

    // Fill in outputHeight, outputWidth.
    Stage.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call(
      stageParams, stageParams.sourceHeight, stageParams.sourceWidth );

    let blockParamsCreator = Stage.Base.create_BlockParamsCreator_byStageParams( stageParams );
    blockParamsCreator.determine_blockCount_depthwiseFilterHeightWidth_Default_Last();

    this.blocksArray.length = blockParamsCreator.blockCount;
    let paramsNameOrderArray = Base.paramsNameOrderArray_Basic.slice(); // Shallow copy.

    let paramsNumberArrayObject = {};
    Object.assign( paramsNumberArrayObject, this.in.paramsNumberArrayObject ); // Shallow copy.

    let channelShuffler;
    for ( let i = 0; i < blockParamsCreator.blockCount; ++i ) { // Block0, 1, 2, 3, ..., BlockLast.

      if ( 0 == i ) { // Block0.
        blockParamsCreator.configTo_beforeBlock0();
      }

      if ( ( this.blocksArray.length - 1 ) == i ) { // BlockLast. (Note: Block0 may also be BlockLast.)
        blockParamsCreator.configTo_beforeBlockLast();
      }

      // If channelShuffler is not null, keep it so that its tensors could be released.
      if ( blockParamsCreator.channelShuffler ) {
        channelShuffler = blockParamsCreator.channelShuffler;
      }

      let blockName = `block${i}`;
      paramsNameOrderArray.push( blockName ); // Place every block's parameters in sequence.

      let blockTestParams = new Block_TestParams.Base( this.id );
      blockTestParams.set_By_ParamsScattered(
        blockParamsCreator.channelCount0_pointwise1Before,
        blockParamsCreator.channelCount1_pointwise1Before,
        blockParamsCreator.pointwise1ChannelCount, blockParamsCreator.bPointwise1Bias, blockParamsCreator.pointwise1ActivationId,
        blockParamsCreator.depthwise_AvgMax_Or_ChannelMultiplier,
        blockParamsCreator.depthwiseFilterHeight, blockParamsCreator.depthwiseFilterWidth, blockParamsCreator.depthwiseStridesPad,
        blockParamsCreator.bDepthwiseBias, blockParamsCreator.depthwiseActivationId,
        blockParamsCreator.pointwise21ChannelCount, blockParamsCreator.bPointwise21Bias, blockParamsCreator.pointwise21ActivationId,
        blockParamsCreator.bOutput1Requested,
        blockParamsCreator.bKeepInputTensor
      );

      this.blocksArray[ i ] = blockTestParams;
      paramsNumberArrayObject[ blockName ] = blockTestParams.in.inputFloat32Array;

      if ( 0 == i ) { // After block0 (i.e. for block1, 2, 3, ...)
        blockParamsCreator.configTo_afterBlock0();
      }
    }

    // Here (i.e. in Stage_TestParams), the channelShuffler is not used. Just release it for avoiding memory leak.
    if ( channelShuffler ) {
      channelShuffler.disposeTensors();
      channelShuffler = null;
    }

    let Float32Array_ByteOffsetBegin = new NameNumberArrayObject_To_Float32Array.Base();
    Float32Array_ByteOffsetBegin.setByConcat( paramsNameOrderArray, paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    return this;
  }

  /**
   * @override
   */
  onYield_isLegal() {
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
    this.blocksArray.length = 0; // Clear blocks' parameters.
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @param {number} sourceHeight
   *   Only test the height of input image.
   *
   * @param {number} sourceWidth
   *   Only test the width of input image.
   *
   * @param {number} sourceChannelCount
   *   Only test the depth of input image.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator( sourceHeight, sourceWidth, sourceChannelCount ) {
    // (2022/04/30 Remarked) For speed up testing by reduce testing space.
    //let depthwiseFilterMaxSize = 5;
    let depthwiseFilterMaxSize = 3;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.valueOutMinMax = {
      sourceHeight: [ 3, 3 ],
      sourceWidth:  [ 4, 5 ], // Test different input image width (even and odd).
      sourceChannelCount: [ 4, 4 ],

      blockCountRequested: [
        Stage.Params.blockCountRequested.valueDesc.range.min,
        Stage.Params.blockCountRequested.valueDesc.range.min + 5
      ],

//      bPointwise1: undefined,
      bPointwise1: [
        Stage.Params.bPointwise1.valueDesc.range.min,
        Stage.Params.bPointwise1.valueDesc.range.max
      ],

      // (2022/05/05) Note: WASM seems not correct when tf.pool() or tf.depthwiseConv2d() with ( depthwiseFilterWidth == 1 ).
      depthwiseFilterHeight: [ Stage.Params.depthwiseFilterHeight.valueDesc.range.min, depthwiseFilterMaxSize ],
      depthwiseFilterWidth: [ Stage.Params.depthwiseFilterWidth.valueDesc.range.min, depthwiseFilterMaxSize ],

      // Beware of NONE and RELU. They easily result in infinity value because they do not have upper bound.
      //
//       nActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 0 ],
//       nActivationId: [ ValueDesc.ActivationFunction.Singleton.range.min, ValueDesc.ActivationFunction.Singleton.range.min + 1 ],
      nActivationId: [
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3,
        ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N3_P3 ],

      bPointwise2ActivatedAtStageEnd: [
        Stage.Params.bPointwise2ActivatedAtStageEnd.valueDesc.range.min,
        Stage.Params.bPointwise2ActivatedAtStageEnd.valueDesc.range.max
      ],

//      nConvStageType: undefined,
      nConvStageType: [
        Stage.Params.nConvStageType.valueDesc.range.min,
        Stage.Params.nConvStageType.valueDesc.range.max
      ],

//      bKeepInputTensor: undefined,
      bKeepInputTensor: [
        Stage.Params.bKeepInputTensor.valueDesc.range.min,
        Stage.Params.bKeepInputTensor.valueDesc.range.max
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Stage.Params.sourceHeight,                   this.valueOutMinMax.sourceHeight ),
      new TestParams.ParamDescConfig( Stage.Params.sourceWidth,                    this.valueOutMinMax.sourceWidth ),
      new TestParams.ParamDescConfig( Stage.Params.sourceChannelCount,             this.valueOutMinMax.sourceChannelCount ),
      new TestParams.ParamDescConfig( Stage.Params.blockCountRequested,             this.valueOutMinMax.blockCountRequested ),
      new TestParams.ParamDescConfig( Stage.Params.bPointwise1,                    this.valueOutMinMax.bPointwise1 ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterHeight,          this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Stage.Params.depthwiseFilterWidth,           this.valueOutMinMax.depthwiseFilterWidth ),
      new TestParams.ParamDescConfig( Stage.Params.nActivationId,                  this.valueOutMinMax.nActivationId ),
      new TestParams.ParamDescConfig( Stage.Params.bPointwise2ActivatedAtStageEnd, this.valueOutMinMax.bPointwise2ActivatedAtStageEnd ),
      new TestParams.ParamDescConfig( Stage.Params.nConvStageType,                 this.valueOutMinMax.nConvStageType ),
      new TestParams.ParamDescConfig( Stage.Params.bKeepInputTensor,               this.valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

}


/**
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Stage.initer().
 */
Base.paramsNameOrderArray_Basic = [
  Stage.Params.sourceHeight.paramName,
  Stage.Params.sourceWidth.paramName,
  Stage.Params.sourceChannelCount.paramName,
  Stage.Params.blockCountRequested.paramName,
  Stage.Params.bPointwise1.paramName,
  Stage.Params.depthwiseFilterHeight.paramName,
  Stage.Params.depthwiseFilterWidth.paramName,
  Stage.Params.nActivationId.paramName,
  Stage.Params.bPointwise2ActivatedAtStageEnd.paramName,
  Stage.Params.nConvStageType.paramName,
  Stage.Params.bKeepInputTensor.paramName,
];
