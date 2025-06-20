export { NeuralNet_TestParams_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as TestParams from "./TestParams.js";
import * as Embedding_TestParams from "./Embedding_TestParams.js";
import * as Stage_TestParams from "./Stage_TestParams.js";
import * as Block_TestParams from "./Block_TestParams.js";

/**
 *
 * This is an object { id, in, out } which has one number and two sub-objects.
 *
 *
 * @see TestParams.Base
 */
class NeuralNet_TestParams_Base extends TestParams.Base {

  /**
   * Used as default NeuralNet_TestParams.Base provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet_TestParams.Base.Pool",
    NeuralNet_TestParams_Base );

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
    this.stageArray = Recyclable.OwnerArray.Pool.get_or_create_by();
    this.out = NeuralNet.ParamsBase.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.out?.disposeResources_and_recycleToPool();
    this.out = null;

    this.blockFinal?.disposeResources_and_recycleToPool();
    this.blockFinal = null;

    this.stageArray?.disposeResources_and_recycleToPool();
    this.stageArray = null;

    this.embedding?.disposeResources_and_recycleToPool();
    this.embedding = null;

    super.disposeResources();
  }

  /**
   * Use scattered parameters to fills the following proterties:
   *   - this.in
   *   - this.in_weights
   *   - this.out
   *
   * @param {NeuralNet.ParamsBase} aParamsBase
   *   The parameters of neural network.
   *
   * @return {Base}
   *   Return this object self.
   */
  set_byParamsBase( aParamsBase ) {
    return this.set_byParamsScattered(
      aParamsBase.explicit_input_height,
      aParamsBase.explicit_input_width,
      aParamsBase.explicit_input_channelCount,
      aParamsBase.has_implicit_input,
      aParamsBase.vocabularyChannelCount,
      aParamsBase.vocabularyCountPerInputChannel,
      aParamsBase.nConvStageTypeId,
      aParamsBase.blockCountTotalRequested,
      aParamsBase.output_channelCount,
      aParamsBase.output_asInputValueRange,
      aParamsBase.bKeepInputTensor
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
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    has_implicit_input,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {

    if ( this.out ) {
      this.out.disposeResources_and_recycleToPool();
      this.out = null;
    }

    this.out = NeuralNet.ParamsBase.Pool.get_or_create_by(
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      has_implicit_input,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
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
   * @param {NeuralNet.ParamsBase} this.out
   *   An object which will be the final result of NeuralNet.Params.
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the
   * result inputWeightArray. The this.in.byteOffsetBegin will be
   * ( 4 * weightElementOffsetBegin ).
   *
   * @return {NeuralNet_TestParams_Base}
   *   Return this object self.
   */
  set_byParamsNumberArrayObject_ParamsOut( weightElementOffsetBegin = 0 ) {
    let neuralNetParams = this.out;

    this.generate_out_inferencedParams();

    this.in.paramsNumberArrayObject.length = 0;

    // 1. Embedding
    {
      this.embedding?.disposeResources_and_recycleToPool();
      this.embedding
        = Embedding_TestParams.Base.Pool.get_or_create_by( this.id );

      this.embedding.set_byParamsScattered(
        neuralNetParams.inferencedParams.input_height,
        neuralNetParams.inferencedParams.input_width,
        neuralNetParams.inferencedParams.input_channelCount,
        neuralNetParams.vocabularyChannelCount,
        neuralNetParams.vocabularyCountPerInputChannel,
        neuralNetParams.inferencedParams.bEmbedVocabularyId,
        neuralNetParams.bKeepInputTensor
      );

      this.in.paramsNumberArrayObject.push(
        this.embedding.in_weights.weightArray );
    }

    // 2. Stages
    let stageParamsArray = neuralNetParams.inferencedParams.stageParamsArray;

    this.stageArray.clear();
    this.stageArray.length = stageParamsArray.length;

    // Stage0, 1, 2, 3, ..., StageLast.
    for ( let i = 0; i < stageParamsArray.length; ++i ) {
      let stageParams = stageParamsArray[ i ];

      let stageTestParams
        = Stage_TestParams.Base.Pool.get_or_create_by( this.id );

      stageTestParams.set_byParamsScattered(
        stageParams.input_height, stageParams.input_width,
        stageParams.input_channelCount,
        stageParams.nConvStageTypeId,
        stageParams.blockCountRequested,
        stageParams.bPointwise1,
        stageParams.depthwiseFilterHeight,
        stageParams.depthwiseFilterWidth,
        stageParams.nSqueezeExcitationChannelCountDivisor,
        stageParams.nActivationId,
        stageParams.bKeepInputTensor
      );

      this.stageArray[ i ] = stageTestParams;

      // Place every stage's parameters in sequence.
      this.in.paramsNumberArrayObject.push(
        stageTestParams.in_weights.weightArray );
    }

    // 3. blockFinal
    {
      let blockFinalParams = neuralNetParams.inferencedParams.blockFinalParams;

      let blockTestParams
        = Block_TestParams.Base.Pool.get_or_create_by( this.id );

      blockTestParams.set_byParamsBase( blockFinalParams );

      this.blockFinal?.disposeResources_and_recycleToPool();
      this.blockFinal = blockTestParams;

      // Place final block's parameters in sequence.
      this.in.paramsNumberArrayObject.push(
        blockTestParams.in_weights.weightArray );
    }

    // 4. Pack all parameters, look-up tables weights into a (pre-allocated and
    //    re-used) NumberArray.
    this.in_weights.set_byConcat(
      NeuralNet_TestParams_Base.paramsNameOrderArray_Basic,
      this.in.paramsNumberArrayObject, weightElementOffsetBegin );

    { // 5. Release temporary intermediate array for reducing memory usage.
      for ( let i = 0; i < this.stageArray.length; ++i ) {
        let stageTestParams = this.stageArray[ i ];
        stageTestParams.in_weights.weightArray.length = 0;
      }

      let blockTestParams = this.blockFinal;
      blockTestParams.in_weights.weightArray.length = 0;
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
    this.blockFinal?.disposeResources_and_recycleToPool();
    this.blockFinal = null;

    this.stageArray.clear();

    this.embedding?.disposeResources_and_recycleToPool();
    this.embedding = null;
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself)
   * should not be modified because it will be re-used.
   */
  * ParamsGenerator() {

    // Restrict some parameter's large kinds. Otherwise, too many combination
    // will be generated.
    let valueOutMinMax = this.valueOutMinMax = {
      explicit_input_height: [ 3, 5 ],
      explicit_input_width: [ 3, 5 ],

      explicit_input_channelCount: [
        1, //NeuralNet.Params.explicit_input_channelCount.valueDesc.range.min,
        4
      ],

      // has_implicit_input: undefined,
      has_implicit_input: [
        NeuralNet.Params.has_implicit_input.valueDesc.range.min,
        NeuralNet.Params.has_implicit_input.valueDesc.range.max
      ],

      vocabularyChannelCount: [
        1, //NeuralNet.Params.vocabularyChannelCount.valueDesc.range.min,
        3 //4
      ],

      vocabularyCountPerInputChannel: [
        256, //NeuralNet.Params.vocabularyCountPerInputChannel.valueDesc.range.min,
        256
      ],

      // (2022/08/16) Note: Mobile Moto e40 seems necessary pad=valid to work.
      // (2023/03/09) Note: Mobile Moto e40 seems pad=same also workable.

      //!!! (2022/08/16 Temp Remarked) For mobile phone Moto e40 could pass testing.
      nConvStageTypeId: [
        NeuralNet.Params.nConvStageTypeId.valueDesc.range.min,
        NeuralNet.Params.nConvStageTypeId.valueDesc.range.max
      ],
      // nConvStageTypeId: [
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID, // (6)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID // (6)
      // ],
      // nConvStageTypeId: [
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1, // (5)
      //   ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID // (6)
      // ],

      blockCountTotalRequested: [
        NeuralNet.Params.blockCountTotalRequested.valueDesc.range.min,
        6 //NeuralNet.Params.blockCountTotalRequested.valueDesc.range.max
      ],

      output_channelCount: [
        1, //NeuralNet.Params.output_channelCount.valueDesc.range.min,
        10
      ],

      // output_asInputValueRange: undefined,
      output_asInputValueRange: [
        NeuralNet.Params.output_asInputValueRange.valueDesc.range.min,
        NeuralNet.Params.output_asInputValueRange.valueDesc.range.max
      ],

      // bKeepInputTensor: undefined,
      bKeepInputTensor: [
        NeuralNet.Params.bKeepInputTensor.valueDesc.range.min,
        NeuralNet.Params.bKeepInputTensor.valueDesc.range.max
      ],
    };

    // All the parameters to be tried.
    //
    // Note: The order of these elements could be adjusted to change testing order. The last element will be tested (changed) first.
    let paramDescConfigArray = [
      new TestParams.ParamDescConfig( NeuralNet.Params.explicit_input_height,
        valueOutMinMax.explicit_input_height ),
      new TestParams.ParamDescConfig( NeuralNet.Params.explicit_input_width,
        valueOutMinMax.explicit_input_width ),
      new TestParams.ParamDescConfig( NeuralNet.Params.explicit_input_channelCount,
        valueOutMinMax.explicit_input_channelCount ),

      new TestParams.ParamDescConfig( NeuralNet.Params.has_implicit_input,
        valueOutMinMax.has_implicit_input ),

      new TestParams.ParamDescConfig( NeuralNet.Params.vocabularyChannelCount,
        valueOutMinMax.vocabularyChannelCount ),
      new TestParams.ParamDescConfig( NeuralNet.Params.vocabularyCountPerInputChannel,
        valueOutMinMax.vocabularyCountPerInputChannel ),

      new TestParams.ParamDescConfig( NeuralNet.Params.nConvStageTypeId,
        valueOutMinMax.nConvStageTypeId ),

      new TestParams.ParamDescConfig( NeuralNet.Params.blockCountTotalRequested,
        valueOutMinMax.blockCountTotalRequested ),

      new TestParams.ParamDescConfig( NeuralNet.Params.output_channelCount,
        valueOutMinMax.output_channelCount ),
      new TestParams.ParamDescConfig( NeuralNet.Params.output_asInputValueRange,
        valueOutMinMax.output_asInputValueRange ),

      new TestParams.ParamDescConfig( NeuralNet.Params.bKeepInputTensor,
        valueOutMinMax.bKeepInputTensor ),
    ];

    const theParamDescConfigAll
      = new TestParams.ParamDescConfigAll( paramDescConfigArray );

    yield *NeuralNet_TestParams_Base.ParamsGenerator.call( this,
      theParamDescConfigAll );
  }

}


/**
 * The order when generate inputWeightArray[].
 *
 * This order could not be changed arbitrarily. It must be the same as the
 * parameter extracting order of NeuralNet.initer().
 */
NeuralNet_TestParams_Base.paramsNameOrderArray_Basic = [
  NeuralNet.Params.explicit_input_height.paramName,
  NeuralNet.Params.explicit_input_width.paramName,
  NeuralNet.Params.explicit_input_channelCount.paramName,
  NeuralNet.Params.has_implicit_input.paramName,
  NeuralNet.Params.vocabularyChannelCount.paramName,
  NeuralNet.Params.vocabularyCountPerInputChannel.paramName,
  NeuralNet.Params.nConvStageTypeId.paramName,
  NeuralNet.Params.blockCountTotalRequested.paramName,
  NeuralNet.Params.output_channelCount.paramName,
  NeuralNet.Params.output_asInputValueRange.paramName,
  NeuralNet.Params.bKeepInputTensor.paramName,
];
