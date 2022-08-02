export { NeuralNet_TestParams_Base as Base };
export { Out };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as TestParams from "./TestParams.js";
import * as Embedding_TestParams from "./Embedding_TestParams.js";
import * as Stage_TestParams from "./Stage_TestParams.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 */
class NeuralNet_TestParams_Base extends TestParams.Base {

  /**
   * Used as default NeuralNet_TestParams.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet_TestParams.Base.Pool",
    NeuralNet_TestParams_Base, NeuralNet_TestParams_Base.setAsConstructor );

  /**
   */
  constructor( id ) {
    super( id );
    NeuralNet_TestParams_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( id ) {
    super.setAsConstructor( id );
    NeuralNet_TestParams_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.stageArray = Recyclable.OwnerArray.Pool.get_or_create_by();
    this.out = NeuralNet.ParamsBase.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.stageArray?.disposeResources_and_recycleToPool();
    this.stageArray = null;

    this.embeddingTestParams?.disposeResources_and_recycleToPool();
    this.embeddingTestParams = null;

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
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

//!!! ...unfinished... (2022/07/30)


    this.out = NeuralNet.ParamsBase.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested,
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
   * @param {NeuralNet_TestParams.Out} this.out
   *   An object which will be the final result of NeuralNet.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result inputWeightArray.
   * The this.in.byteOffsetBegin will be ( 4 * weightElementOffsetBegin ).
   *
   * @return {NeuralNet_TestParams_Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin = 0 ) {
    let neuralNetParams = this.out;

    this.generate_out_inferencedParams();


//!!! ...unfinished... (2022/07/30)

    this.in.paramsNumberArrayObject.length = 0;

    {
      this.embeddingTestParams?.disposeResources_and_recycleToPool();
      this.embeddingTestParams = Embedding_TestParasm.Pool.get_or_create_by( this.id );

      this.embeddingTestParams.set_byParamsScattered(
        neuralNetParams.input_height,
        neuralNetParams.input_width,
        neuralNetParams.input_channelCount,
        neuralNetParams.vocabularyChannelCount,
        neuralNetParams.vocabularyCountPerInputChannel,
        neuralNetParams.inferencedParams.bEmbedVocabularyId,
        neuralNetParams.bKeepInputTensor
      );

      this.in.paramsNumberArrayObject.push( this.embeddingTestParams.in_weights.weightArray );
    }

    let stageParamsCreator = Stage.Base.create_StageParamsCreator_byNeuralNetParams( neuralNetParams );

    this.stageArray.clear();
    this.stageArray.length = stageParamsCreator.stageCount;

    for ( let i = 0; i < stageCount; ++i ) { // Stage0, 1, 2, 3, ..., StageLast.

      if ( 0 == i ) { // Stage0.
        stageParamsCreator.configTo_beforeStage0();
      } else { // (i.e. Stage1, 2, 3, ...)
        stageParamsCreator.configTo_beforeStageN_exceptStage0( i );
      }

      if ( ( this.blockArray.length - 1 ) == i ) { // StageLast. (Note: Stage0 may also be StageLast.)
        stageParamsCreator.configTo_beforeStageLast();
      }

      let stageTestParams = Stage_TestParams.Base.Pool.get_or_create_by( this.id );
      blockTestParams.set_byParamsScattered(
        stageParamsCreator.input_height, stageParamsCreator.input_width, stageParamsCreator.input_channelCount,
        stageParamsCreator.nConvStageTypeId,
        stageParamsCreator.blockCountRequested,
        stageParamsCreator.bPointwise1,
        stageParamsCreator.depthwiseFilterHeight, stageParamsCreator.depthwiseFilterWidth,
        stageParamsCreator.bPointwise2ActivatedAtStageEnd,
        stageParamsCreator.nSqueezeExcitationChannelCountDivisor,
        stageParamsCreator.nActivationId,
        stageParamsCreator.bKeepInputTensor
      );

      this.stageArray[ i ] = stageTestParams;
      this.in.paramsNumberArrayObject.push( stageTestParams.in_weights.weightArray ); // Place every stage's parameters in sequence.
    }

    // Pack all parameters, look-up tables weights into a (pre-allocated and re-used) NumberArray.
    this.in_weights.set_byConcat(
      NeuralNet_TestParams_Base.paramsNameOrderArray_Basic, this.in.paramsNumberArrayObject, weightElementOffsetBegin );

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
    this.stageArray.clear();

    this.embeddingTestParams?.disposeResources_and_recycleToPool();
    this.embeddingTestParams = null;
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    // Restrict some parameter's large kinds. Otherwise, too many combination will be generated.
    let valueOutMinMax = this.valueOutMinMax = {
      input_height: [ 1, 5 ],
      input_width: [ 1, 5 ],

      input_channelCount: [
        NeuralNet.Params.input_channelCount.valueDesc.range.min,
        4
      ],

      vocabularyChannelCount: [
        NeuralNet.Params.vocabularyChannelCount.valueDesc.range.min,
        4
      ],

      vocabularyCountPerInputChannel: [
        256, //NeuralNet.Params.vocabularyCountPerInputChannel.valueDesc.range.min,
        257
      ],

      nConvStageTypeId: [
        NeuralNet.Params.nConvStageTypeId.valueDesc.range.min,
        NeuralNet.Params.nConvStageTypeId.valueDesc.range.max
      ],

      stageCountRequested: [
        NeuralNet.Params.stageCountRequested.valueDesc.range.min,
        10 //NeuralNet.Params.stageCountRequested.valueDesc.range.max
      ],

      blockCountRequested: [
        NeuralNet.Params.blockCountRequested.valueDesc.range.min,
        4 //NeuralNet.Params.blockCountRequested.valueDesc.range.max
      ],

      // bKeepInputTensor: undefined,
      bKeepInputTensor: [
        NeuralNet.Params.bKeepInputTensor.valueDesc.range.min,
        NeuralNet.Params.bKeepInputTensor.valueDesc.range.max
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these element could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( NeuralNet.Params.input_height,                   valueOutMinMax.input_height ),
      new TestParams.ParamDescConfig( NeuralNet.Params.input_width,                    valueOutMinMax.input_width ),
      new TestParams.ParamDescConfig( NeuralNet.Params.input_channelCount,             valueOutMinMax.input_channelCount ),

      new TestParams.ParamDescConfig( NeuralNet.Params.vocabularyChannelCount,         valueOutMinMax.vocabularyChannelCount ),
      new TestParams.ParamDescConfig( NeuralNet.Params.vocabularyCountPerInputChannel, valueOutMinMax.vocabularyCountPerInputChannel ),

      new TestParams.ParamDescConfig( NeuralNet.Params.nConvStageTypeId,               valueOutMinMax.nConvStageTypeId ),
      new TestParams.ParamDescConfig( NeuralNet.Params.stageCountRequested,            valueOutMinMax.stageCountRequested ),
      new TestParams.ParamDescConfig( NeuralNet.Params.blockCountRequested,            valueOutMinMax.blockCountRequested ),

      new TestParams.ParamDescConfig( NeuralNet.Params.bKeepInputTensor,               valueOutMinMax.bKeepInputTensor ),
    ];

    yield *NeuralNet_TestParams_Base.ParamsGenerator.call( this, paramDescConfigArray );
  }

  /**
   * Fill an object's property as a number array.
   *
   * Similar to Base.ensure_object_property_numberArray_length_filled(). But the
   * property will be a shared number array. Its value may be shared with other caller.
   *
   * This may have better performance because of number array re-using (instead
   * of re-generating).
   *
   *
   * @param {object} io_object            The object to be checked and modified.
   * @param {string|numner} propertyName  The property io_object[ propertyName ] will be ensured as a number array.
   * @param {number} elementCount         The property io_object[ propertyName ].length will be ensured as elementCount.
   *
   */
  fill_object_property_numberArray( io_object, propertyName, elementCount ) {
    super.ensure_object_property_numberArray_length_existed( io_object, propertyName,
      elementCount,
      TestParams.Base.weightsRandomOffset.min, TestParams.Base.weightsRandomOffset.max,
      TestParams.Base.weightsDivisorForRemainder
    );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the parameter extracting order of NeuralNet.initer().
 */
NeuralNet_TestParams_Base.paramsNameOrderArray_Basic = [
  NeuralNet.Params.input_height.paramName,
  NeuralNet.Params.input_width.paramName,
  NeuralNet.Params.input_channelCount.paramName,
  NeuralNet_Params.vocabularyChannelCount.paramName,
  NeuralNet_Params.vocabularyCountPerInputChannel.paramName,
  NeuralNet_Params.nConvStageTypeId.paramName,
  NeuralNet_Params.stageCountRequested.paramName,
  NeuralNet_Params.blockCountRequested.paramName,
  NeuralNet.Params.bKeepInputTensor.paramName,
];
