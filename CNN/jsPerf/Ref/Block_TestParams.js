export { Base };

import * as RandTools from "../../util/RandTools.js";
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
 * it has the following data members: sourceHeight, sourceWidth, sourceChannelCount, stepCountPerBlock, bChannelShuffler,
 * pointwise1ChannelCountRate, depthwiseFilterHeight, bBias, nActivationId, nActivationIdAtBlockEnd, bKeepInputTensor.
 * It also has the following properties:
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
    sourceHeight, sourceWidth, sourceChannelCount, stepCountPerBlock, bChannelShuffler,
    pointwise1ChannelCountRate, depthwiseFilterHeight, bBias, nActivationId, nActivationIdAtBlockEnd, bKeepInputTensor
  ) {
    this.in.paramsNumberArrayObject = {};
    this.out = {
      sourceHeight, sourceWidth, sourceChannelCount, stepCountPerBlock, bChannelShuffler,
      pointwise1ChannelCountRate, depthwiseFilterHeight, bBias, nActivationId, nActivationIdAtBlockEnd, bKeepInputTensor
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
   * The name should be one of Base.paramsInArrayOrder[] elements.
   *
   * @param {object} this.out
   *   An object which has the following data members: channelCount1_pointwise1Before, pointwise1ChannelCount, bPointwise1Bias,
   * depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, pointwise21ChannelCount,
   * bPointwise21Bias, pointwise22ChannelCount, bPointwise22Bias. This object will be recorded in this.out directly.
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   * The this.in.byteOffsetBegin will be ( 4 * weightsElementOffsetBegin ).
   *
   * @return {Base}
   *   Return this object self.
   */
  set_By_ParamsNumberArrayMap_ParamsOut( weightsElementOffsetBegin = 0 ) {

//!!! ...unfinished... (2021/08/09)

    Base.generate_Filters_Biases( channelCount0_pointwise1Before, this.out, this.in.paramsNumberArrayObject );

    let Float32Array_ByteOffsetBegin
      = Base.concat_ParamsNumberArrayObject_To_Float32Array( this.in.paramsNumberArrayObject, weightsElementOffsetBegin );

    this.in.inputFloat32Array = Float32Array_ByteOffsetBegin.weightsFloat32Array;
    this.in.byteOffsetBegin = Float32Array_ByteOffsetBegin.weightsByteOffsetBegin;

    return this;
  }

  /**
   * @override
   */
  onBefore_Yield() {
//!!! ...unfinished... (2021/08/09)

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

//!!! ...unfinished... (2021/08/09)


//!!! ...unfinished... (2021/07/27) When pad is "same", it should test more filter size.
    // When pad is "valid", the depthwise (avgPooling/maxPooling/conv)'s filter size could not be larger than input image size.
    //
    // Note: When pad is "same", this restriction does not exist.
    let depthwiseFilterMaxSize = Math.min( this.inputImageHeight, this.inputImageWidth );

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    this.maxKindsRestrict = {
//      PerParameter: 5,
      Pointwise:    3,

      // Because the logic of bias and activation function is simpler than other, it is just randomly tested once
      // (i.e. ( maxKinds == 0 )) for speeding up testing.
//!!! (2021/07/20 Temp Remarked) Fix to none to simplify debug.
      Bias:         0,
      ActivationId: 0,
//       Bias:         1,
//       ActivationId: 1,

      channelCount1_pointwise1Before: 5,
      depthwise_AvgMax_Or_ChannelMultiplier: 5,
      depthwiseFilterHeight: depthwiseFilterMaxSize,
      depthwiseStridesPad: undefined,
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ChannelCount, this.maxKindsRestrict.Pointwise ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise21Bias,        this.maxKindsRestrict.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise21ActivationId, this.maxKindsRestrict.ActivationId ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise22ChannelCount, this.maxKindsRestrict.Pointwise ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise22Bias,        this.maxKindsRestrict.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise22ActivationId, this.maxKindsRestrict.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.bPointwise1Bias,         this.maxKindsRestrict.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ActivationId,  this.maxKindsRestrict.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.channelCount1_pointwise1Before,
                                                                                      this.maxKindsRestrict.channelCount1_pointwise1Before ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier,
                                                                                      this.maxKindsRestrict.depthwise_AvgMax_Or_ChannelMultiplier ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseFilterHeight,   this.maxKindsRestrict.depthwiseFilterHeight ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseStridesPad,     this.maxKindsRestrict.depthwiseStridesPad ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.bDepthwiseBias,          this.maxKindsRestrict.Bias ),
      new TestParams.ParamDescConfig( PointDepthPoint.Params.depthwiseActivationId,   this.maxKindsRestrict.ActivationId ),

      new TestParams.ParamDescConfig( PointDepthPoint.Params.pointwise1ChannelCount,  this.maxKindsRestrict.Pointwise ),
    ];

    yield *Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

}
