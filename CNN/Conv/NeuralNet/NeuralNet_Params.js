export { NeuralNet_Params as Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as Block from "../Block.js";
import { ParamsBase } from "./NeuralNet_ParamsBase.js";

/**
 * NeuralNet parameters.
 *
 * @see Weight.Params
 *
 */
class NeuralNet_Params extends Weights.Params( ParamsBase ) {

  /**
   * Used as default NeuralNet.Params provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "NeuralNet.Params.Pool",
    NeuralNet_Params, NeuralNet_Params.setAsConstructor );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray
   * (i.e. by evolution).
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel = 256,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {
    super(
      NeuralNet_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
    );
    NeuralNet_Params.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel = 256,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      NeuralNet_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
    );
    NeuralNet_Params.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /**
   * @return {boolean}
   *   Always return false. NeuralNet.Params needs not and can not generate
   * Stage.Params by itself. Only NeuralNet.Base.initer() could do that. The
   * reason is NeuralNet.StageParamsCreator needs input_height and input_width
   * of previous block. And these could only be available from previous
   * Stage.Base which should be created by NeuralNet.Base.initer().
   *
   * @override
   */
  inferencedParams_embeddingParams_stageParamsArray_needed() {
    return false;
  }

  /** @override */
  EmbeddingParamsClass_get() {
    return Embedding.Params;
  }

  /** @override */
  StageParamsClass_get() {
    return Stage.Params;
  }

  /** @override */
  BlockParamsClass_get() {
    return Block.Params;
  }

  /**
   * Extract parameters from inputWeightArray.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  init( inputWeightArray, elementOffsetBegin ) {
    let bExtractOk = super.init( inputWeightArray, elementOffsetBegin );
    if ( !bExtractOk )
      return false;

    {
      this.input_height = this.getParamValue_byParamDesc( NeuralNet_Params.input_height );
      this.input_width = this.getParamValue_byParamDesc( NeuralNet_Params.input_width );
      this.input_channelCount = this.getParamValue_byParamDesc( NeuralNet_Params.input_channelCount );
      this.vocabularyChannelCount = this.getParamValue_byParamDesc( NeuralNet_Params.vocabularyChannelCount );
      this.vocabularyCountPerInputChannel = this.getParamValue_byParamDesc( NeuralNet_Params.vocabularyCountPerInputChannel );
      this.nConvStageTypeId = this.getParamValue_byParamDesc( NeuralNet_Params.nConvStageTypeId );
      this.blockCountTotalRequested = this.getParamValue_byParamDesc( NeuralNet_Params.blockCountTotalRequested );
      this.output_channelCount = this.getParamValue_byParamDesc( NeuralNet_Params.output_channelCount );
      this.output_asInputValueRange = this.getParamValue_byParamDesc( NeuralNet_Params.output_asInputValueRange );
      this.bKeepInputTensor = this.getParamValue_byParamDesc( NeuralNet_Params.bKeepInputTensor );
    }

    this.inferencedParams_create();

    return bExtractOk;
  }

  /**
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   Get or create (from pool) NeuralNet.Params according to the specified
   * neuralNetParamsBase.
   */
  static get_or_create_by_NeuralNetParamsBase( neuralNetParamsBase ) {
    let neuralNetParams = NeuralNet_Params.Pool.get_or_create_by(
      neuralNetParamsBase.input_height,
      neuralNetParamsBase.input_width,
      neuralNetParamsBase.input_channelCount,
      neuralNetParamsBase.vocabularyChannelCount,
      neuralNetParamsBase.vocabularyCountPerInputChannel,
      neuralNetParamsBase.nConvStageTypeId,
      neuralNetParamsBase.blockCountTotalRequested,
      neuralNetParamsBase.output_channelCount,
      neuralNetParamsBase.output_asInputValueRange,
      neuralNetParamsBase.bKeepInputTensor
    );
    return neuralNetParams;
  }

}


// Define parameter descriptions.
NeuralNet_Params.input_height =             new ParamDesc.Int(  "input_height",                   1, ( 10 * 1024 ) );
NeuralNet_Params.input_width =              new ParamDesc.Int(  "input_width",                    1, ( 10 * 1024 ) );
NeuralNet_Params.input_channelCount =       new ParamDesc.Int(  "input_channelCount",             1, ( 10 * 1024 ) );

NeuralNet_Params.vocabularyChannelCount =   new ParamDesc.Int(  "vocabularyChannelCount",         2, (  1 * 1024 ) );
NeuralNet_Params.vocabularyCountPerInputChannel
                                          = new ParamDesc.Int(  "vocabularyCountPerInputChannel", 1, ( 2 ** 24 ) );

NeuralNet_Params.nConvStageTypeId =         new ParamDesc.ConvStageType( "nConvStageTypeId" );

NeuralNet_Params.blockCountTotalRequested = new ParamDesc.Int(  "blockCountTotalRequested",       2, ( 10 * 1024 ) );

NeuralNet_Params.output_channelCount =      new ParamDesc.Int(  "output_channelCount",            1, ( 10 * 1024 ) );
NeuralNet_Params.output_asInputValueRange = new ParamDesc.Bool( "output_asInputValueRange" );

NeuralNet_Params.bKeepInputTensor =         new ParamDesc.Bool( "bKeepInputTensor" );


/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to
 * this array's order.)
 */
NeuralNet_Params.SequenceArray = new ParamDesc.SequenceArray( [
  NeuralNet_Params.input_height,
  NeuralNet_Params.input_width,
  NeuralNet_Params.input_channelCount,
  NeuralNet_Params.vocabularyChannelCount,
  NeuralNet_Params.vocabularyCountPerInputChannel,
  NeuralNet_Params.nConvStageTypeId,
  NeuralNet_Params.blockCountTotalRequested,
  NeuralNet_Params.output_channelCount,
  NeuralNet_Params.output_asInputValueRange,
  NeuralNet_Params.bKeepInputTensor,
] );

