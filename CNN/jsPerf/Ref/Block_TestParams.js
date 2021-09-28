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
 *   The "out" sub-object's data members represent the "should-be" result of Block.Params's extract().
 * That is, it has the above data members except paramsNumberArrayObject, inputFloat32Array, byteOffsetBegin.
 *
 */
class Base extends TestParams.Base {

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
   *
   * @param {object} this.in.paramsNumberArrayObject
   *   Pass in an object. The result will be put into this object. It is a map from a string name (e.g. parameter name) to a number array.
   * The name should be one of Base.paramsNameOrderArray[] elements.
   *
   * @param {object} this.out
   *   An object which has the following data members: sourceHeight, sourceWidth, sourceChannelCount, stepCountRequested,
   * pointwise1ChannelCountRate, depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd, nWhetherShuffleChannel,
   * bKeepInputTensor.
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
    let stepParamsMaker = Block.Base.create_Params_to_PointDepthPointParams( blockParams );

    let paramsNameOrderArray = Base.paramsNameOrderArray_Basic.slice(); // Shallow copy.
    
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

      let stepTestParams = new PointDepthPoint_TestParams.Base();
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

      this.in[ stepName ] = stepTestParams.in;
      this.in.paramsNumberArrayObject[ stepName ] = stepTestParams.weightsFloat32Array;
      this.out[ stepName ] = stepTestParams.out;

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
    Float32Array_ByteOffsetBegin.setByConcat( paramsNameOrderArray, this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

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
   * Responsible for generating testing paramters combinations.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.maxKindsRestrict = {
      sourceHeight: 5,
      sourceWidth:  5,
      sourceChannelCount: 4,
      stepCountRequested: 5,
      pointwise1ChannelCountRate: undefined,
      depthwiseFilterHeight: undefined,

      // Because the logic of activation function is simpler than other, it is just randomly tested once
      // (i.e. ( maxKinds == 0 )) for speeding up testing.
      nActivationId: 0,
      nActivationIdAtBlockEnd: 0,

      nWhetherShuffleChannel: undefined,
      bKeepInputTensor: undefined,
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( Block.Params.sourceHeight,               this.maxKindsRestrict.sourceHeight ),
      new TestParams.ParamDescConfig( Block.Params.sourceWidth,                this.maxKindsRestrict.sourceWidth ),
      new TestParams.ParamDescConfig( Block.Params.sourceChannelCount,         this.maxKindsRestrict.sourceChannelCount ),
      new TestParams.ParamDescConfig( Block.Params.stepCountRequested,          this.maxKindsRestrict.stepCountRequested ),
      new TestParams.ParamDescConfig( Block.Params.pointwise1ChannelCountRate, this.maxKindsRestrict.pointwise1ChannelCountRate ),
      new TestParams.ParamDescConfig( Block.Params.depthwiseFilterHeight,      this.maxKindsRestrict.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( Block.Params.nActivationId,              this.maxKindsRestrict.nActivationId ),
      new TestParams.ParamDescConfig( Block.Params.nActivationIdAtBlockEnd,    this.maxKindsRestrict.nActivationIdAtBlockEnd ),
      new TestParams.ParamDescConfig( Block.Params.nWhetherShuffleChannel,     this.maxKindsRestrict.nWhetherShuffleChannel ),
      new TestParams.ParamDescConfig( Block.Params.bKeepInputTensor,           this.maxKindsRestrict.bKeepInputTensor ),
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
