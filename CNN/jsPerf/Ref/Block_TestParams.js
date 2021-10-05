export { Base };

import * as RandTools from "../../util/RandTools.js";
import * as NameNumberArrayObject_To_Float32Array from "../../util/NameNumberArrayObject_To_Float32Array.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";
import * as TestParams from "./TestParams.js";
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js";
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
 * it has the following data members: sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested,
 * pointwise1ChannelCountRate, depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel,
 * bKeepInputTensor. It also has the following properties:
 *   - paramsNumberArrayObject
 *   - inputFloat32Array
 *   - byteOffsetBegin
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of Block.Params's extract(). That is, it has
 * the above data members (with outputHeight, outputWidth) except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 * @member {object[]} stepsArray
 *   Every element is an PointDepthPoint_TestParams object for the parameters of the step.
 */
class Base extends TestParams.Base {

  /**
   *
   */
  constructor() {
    super();
    this.stepsArray = new Array();
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
    sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested, pointwise1ChannelCountRate,
    depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel, bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested, pointwise1ChannelCountRate,
      depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel, bKeepInputTensor
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
   *   An object which has the following data members: sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested,
   * pointwise1ChannelCountRate, depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel,
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
    let blockParams = this.out;

    // Fill in outputHeight, outputWidth.
    Block.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( blockParams, blockParams.sourceHeight, blockParams.sourceWidth );

    let stepParamsMaker = Block.Base.create_Params_to_PointDepthPointParams( blockParams );
    stepParamsMaker.determine_stepCount_depthwiseFilterHeight_Default_Last();

    this.stepsArray.length = stepParamsMaker.stepCount;
    let paramsNameOrderArray = Base.paramsNameOrderArray_Basic.slice(); // Shallow copy.

    let paramsNumberArrayObject = {};
    Object.assign( paramsNumberArrayObject, this.in.paramsNumberArrayObject ); // Shallow copy.

    let channelShuffler;
    for ( let i = 0; i < stepParamsMaker.stepCount; ++i ) { // Step0, 1, 2, 3, ..., StepLast.

      if ( 0 == i ) { // Step0.
        stepParamsMaker.configTo_beforeStep0();
      }

      if ( ( this.stepsArray.length - 1 ) == i ) { // StepLast. (Note: Step0 may also be StepLast.)
        stepParamsMaker.configTo_beforeStepLast();
      }

      // If channelShuffler is not null, keep it so that its tensors could be released.
      if ( stepParamsMaker.channelShuffler ) {
        channelShuffler = stepParamsMaker.channelShuffler;
      }

      let stepName = `step${i}`;
      paramsNameOrderArray.push( stepName ); // Place every step's parameters in sequence.

      let stepTestParams = new PointDepthPoint_TestParams.Base( this.id );
      stepTestParams.set_By_ParamsScattered(
        stepParamsMaker.channelCount0_pointwise1Before,
        stepParamsMaker.channelCount1_pointwise1Before,
        stepParamsMaker.pointwise1ChannelCount, stepParamsMaker.bPointwise1Bias, stepParamsMaker.pointwise1ActivationId,
        stepParamsMaker.depthwise_AvgMax_Or_ChannelMultiplier, stepParamsMaker.depthwiseFilterHeight, stepParamsMaker.depthwiseStridesPad,
        stepParamsMaker.bDepthwiseBias, stepParamsMaker.depthwiseActivationId,
        stepParamsMaker.pointwise21ChannelCount, stepParamsMaker.bPointwise21Bias, stepParamsMaker.pointwise21ActivationId,
        stepParamsMaker.bOutput1Requested,
        stepParamsMaker.bKeepInputTensor
      );

      this.stepsArray[ i ] = stepTestParams;
      paramsNumberArrayObject[ stepName ] = stepTestParams.in.inputFloat32Array;

      if ( 0 == i ) { // After step0 (i.e. for step1, 2, 3, ...)
        stepParamsMaker.configTo_afterStep0();
      }
    }

    // Here (i.e. in Block_TestParams), the channelShuffler is not used. Just release it for avoiding memory leak.
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
  onBefore_Yield() {

    // For testing not start at the offset 0.
    let weightsElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

    this.set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin );
  }

  /**
   * @override
   */
  onAfter_Yield() {
    this.stepsArray.length = 0; // Clear steps' parameters.
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
    this.sourceHeight = sourceHeight;
    this.sourceWidth = sourceWidth;
    this.sourceChannelCount = sourceChannelCount;

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.valueOutMinMax = {
      sourceHeight: [ this.sourceHeight, this.sourceHeight ], //5,
      sourceWidth:  [ this.sourceWidth,  this.sourceWidth  ], //5,
      sourceChannelCount: [ sourceChannelCount, sourceChannelCount ],

      stepCountRequested: [
        Block.Params.stepCountRequested.valueDesc.range.min,
        Block.Params.stepCountRequested.valueDesc.range.min + 5
      ],

      pointwise1ChannelCountRate: undefined,
      depthwiseFilterHeight: undefined,

      // Because the logic of activation function is simpler than other, it is just randomly tested once
      // for speeding up testing.
//      nActivationId: undefined,
      nActivationId: [
        ValueDesc.ActivationFunction.Singleton.range.min,
        ValueDesc.ActivationFunction.Singleton.range.max
      ],

//      nActivationIdAtBlockEnd: undefined,
      nActivationIdAtBlockEnd: [
        ValueDesc.ActivationFunction.Singleton.range.min,
        ValueDesc.ActivationFunction.Singleton.range.max
      ],

      nWhetherShuffleChannel: undefined,
      bKeepInputTensor: undefined,
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Block.Params.sourceHeight,               this.valueOutMinMax.sourceHeight ),
      new TestParams.ParamDescConfig( Block.Params.sourceWidth,                this.valueOutMinMax.sourceWidth ),
      new TestParams.ParamDescConfig( Block.Params.sourceChannelCount,         this.valueOutMinMax.sourceChannelCount ),
      new TestParams.ParamDescConfig( Block.Params.stepCountRequested,         this.valueOutMinMax.stepCountRequested ),
      new TestParams.ParamDescConfig( Block.Params.pointwise1ChannelCountRate, this.valueOutMinMax.pointwise1ChannelCountRate ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterHeight,      this.valueOutMinMax.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Block.Params.nActivationId,              this.valueOutMinMax.nActivationId ),
      new TestParams.ParamDescConfig( Block.Params.nActivationIdAtBlockEnd,    this.valueOutMinMax.nActivationIdAtBlockEnd ),
      new TestParams.ParamDescConfig( Block.Params.nWhetherShuffleChannel,     this.valueOutMinMax.nWhetherShuffleChannel ),
      new TestParams.ParamDescConfig( Block.Params.bKeepInputTensor,           this.valueOutMinMax.bKeepInputTensor ),
    ];

    yield *Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

}


/**
 * The order when generate weightsFloat32Array[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of Block.initer().
 */
Base.paramsNameOrderArray_Basic = [
  Block.Params.sourceHeight.paramName,
  Block.Params.sourceWidth.paramName,
  Block.Params.sourceChannelCount.paramName,
  Block.Params.stepCountRequested.paramName,
  Block.Params.pointwise1ChannelCountRate.paramName,
  Block.Params.depthwiseFilterHeight.paramName,
  Block.Params.nActivationId.paramName,
  Block.Params.nActivationIdAtBlockEnd.paramName,
  Block.Params.nWhetherShuffleChannel.paramName,
  Block.Params.bKeepInputTensor.paramName,
];
