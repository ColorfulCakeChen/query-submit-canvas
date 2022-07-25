export { Embedding_Params as Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
//import { InferencedParams } from "./Embedding_InferencedParams.js";


//!!! ...unfinished... (2022/07/25)


/**
 * Embedding parameters.
 *
 * Embedding could achieve non-linear mapping (just like any perceptron). But it is achieved by lookup table (instead
 * of weighted sum, bias and activation function). This implies:
 *   - It may use more (CPU or GPU) memory, but may use less (CPU or GPU) computation.
 *   - It can only achieve channel expansion, and can not achieve channel aggregation. (because no weighted sum)
 *   - It can only represent context-independent (not context-dependent) information. (because no weighted sum)
 *   - It can only handle integer input (i.e. int32, not float32).
 *
 * It is useful as the first layer of text or image processing because their inputs are all integer (e.g. character codes,
 * word indices, color codes, etc). And, the first layer only needs carry context-independent information (and all the other
 * layers after it will produce context-dependent information).
 *
 * This object always accepts tensor3d (dtype = int32).
 *   - The axis 0 is height. (Image height) (Text lines and usually only 1 line.)
 *   - The axis 1 is width. (Image width) (Text length (e.g. character count).)
 *   - The axis 2 is channel. (Image color channel) (Text character code channel and usually only 1 channel.)
 *
 * An embedding layer contains one params (this.params) and inChannels embedding vocabulary tables.
 *   - Every input channel has one embedding vocabulary table.
 *   - Every embedding vocabulary table has vocabularyCountPerInputChannel vocabularies.
 *   - Every vocabulary has channelMultiplier embedding channels.
 *
 *
 *
 * @param {number} input_channelCount
 *   The input channel count.
 *
 * @member {number} channelMultiplier
 *   Every vocabulary will have how many embedding channels. Every input channel will be expanded into so many
 * embedding channels. It could be viewed as embeddingChannelCountPerInputChannel.
 *
 * @member {number} vocabularyCountPerInputChannel
 *   Every input channel will have how many vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A four channels), there will be 256
 * vocabularies per input channel because every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 *
 * @member {boolean} bEmbedVocabularyId
 *   If true, one of embedding channels will be an auto-generated vocabulary id (i.e. 0, 1, 2, ...). So only
 * ( channelMultiplier - 1 ) embedding channels will be extracted from inputWeightArray. The extra vocabulary id
 * channel achieves residual connection. Residual connection means apply_and_destroy_or_keep() will append (concatenate)
 * input to output. Since apply_and_destroy_or_keep()'s input is just vocabulary id (one channel or multiple channels),
 * pre-embedded vocabulary id inside the embedding table acheives the same effect by less computation (but more memory).
 *
 * @member {number} output_channelCount
 *   Output channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 *
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this embedding.
 *
 * @see Weight.Params
 *
 */
 class Embedding_Params extends Weights.Params {

  /**
   * Used as default Embedding.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.Params.Pool", Params, Params.setAsConstructor );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   */
  constructor(
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor,
  ) {

    super(
      Params.SequenceArray,
      input_channelCount,
      channelMultiplier,
      vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor,
    );
    Embedding_Params.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor,
  ) {
    super.setAsConstructor(
      Params.SequenceArray,
      input_channelCount,
      channelMultiplier,
      vocabularyCountPerInputChannel, bEmbedVocabularyId,
      bKeepInputTensor,
    );
    Embedding_Params.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
//!!! ...unfinished... (2022/07/25)
//    this.InferencedParams_dispose();
    super.disposeResources();
  }

//!!! ...unfinished... (2022/07/25)
  // /** Release .inferencedParams */
  // InferencedParams_dispose() {
  //   if ( this.inferencedParams ) {
  //     this.inferencedParams.disposeResources_and_recycleToPool();
  //     this.inferencedParams = null;
  //   }
  // }
Embedding_Params
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

//!!! ...unfinished... (2022/07/25)
//     this.InferencedParams_dispose();
//
//     this.inferencedParams = InferencedParams.Pool.get_or_create_by(
//       this.input_channelCount,
//       this.channelMultiplier,
//       this.vocabularyCountPerInputChannel, this.bEmbedVocabularyId,
//       this.bKeepInputTensor
//     );

    return bExtractOk;
  }

//!!! ...unfinished... (2022/07/25)

  get sourceHeight()              { return this.getParamValue_byParamDesc( Params.sourceHeight ); }
  get sourceWidth()               { return this.getParamValue_byParamDesc( Params.sourceWidth ); }
  get sourceChannelCount()        { return this.getParamValue_byParamDesc( Params.sourceChannelCount ); }

  /** @return {number} The number version of nConvStageTypeId. */
  get nConvStageTypeId()          { return this.getParamValue_byParamDesc( Params.nConvStageTypeId ); }

  /** @return {string} The string version of nConvStageTypeId. */
  get nConvStageTypeName()        { return Params.nConvStageTypeId.getStringOfValue( this.nConvStageTypeId ); }

  get blockCountRequested()       { return this.getParamValue_byParamDesc( Params.blockCountRequested ); }
  get bPointwise1()               { return this.getParamValue_byParamDesc( Params.bPointwise1 ); }

  get depthwiseFilterHeight()     { return this.getParamValue_byParamDesc( Params.depthwiseFilterHeight ); }
  get depthwiseFilterWidth()      { return this.getParamValue_byParamDesc( Params.depthwiseFilterWidth ); }

  get bPointwise2ActivatedAtStageEnd() { return this.getParamValue_byParamDesc( Params.bPointwise2ActivatedAtStageEnd ); }

  get nSqueezeExcitationChannelCountDivisor()     { return this.getParamValue_byParamDesc( Params.nSqueezeExcitationChannelCountDivisor ); }
  get nSqueezeExcitationChannelCountDivisorName() {
    return Params.nSqueezeExcitationChannelCountDivisor.getStringOfValue( this.nSqueezeExcitationChannelCountDivisor );
  }

  //!!! (2022/07/14 Remarked) Stage.BlockParamsCreator will determine it.
  //get bSqueezeExcitationPrefix()  { return this.getParamValue_byParamDesc( Params.bSqueezeExcitationPrefix ); }

  get nActivationId()             { return this.getParamValue_byParamDesc( Params.nActivationId ); }
  get nActivationName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }

  get bKeepInputTensor()          { return this.getParamValue_byParamDesc( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =                   new ParamDesc.Int(                "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                    new ParamDesc.Int(                "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =             new ParamDesc.Int(                "sourceChannelCount",         1, ( 10 * 1024 ) );

Params.nConvStageTypeId =               new ParamDesc.ConvStageType(      "nConvStageTypeId" );

Params.blockCountRequested =            new ParamDesc.Int(                "blockCountRequested",        2, (  1 * 1024 ) );
Params.bPointwise1 =                    new ParamDesc.Bool(               "bPointwise1" );
Params.depthwiseFilterHeight =          new ParamDesc.Int(                "depthwiseFilterHeight",      1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =           new ParamDesc.Int(                "depthwiseFilterWidth",       2, ( 10 * 1024 ) );
Params.bPointwise2ActivatedAtStageEnd = new ParamDesc.Bool(               "bPointwise2ActivatedAtStageEnd" );

Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
//Params.bSqueezeExcitationPrefix =       new ParamDesc.Bool(               "bSqueezeExcitationPrefix" );

Params.nActivationId =                  new ParamDesc.ActivationFunction( "nActivationId" );

Params.bKeepInputTensor =               new ParamDesc.Bool(               "bKeepInputTensor" );


//!!! ...unfinished... (2022/07/25)

/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to this array's order.)
 */
Params.SequenceArray = new ParamDesc.SequenceArray( [
  Params.sourceHeight,
  Params.sourceWidth,
  Params.sourceChannelCount,
  Params.nConvStageTypeId,
  Params.blockCountRequested,
  Params.bPointwise1,
  Params.depthwiseFilterHeight,
  Params.depthwiseFilterWidth,
  Params.bPointwise2ActivatedAtStageEnd,
  Params.nSqueezeExcitationChannelCountDivisor,
  Params.nActivationId,
  Params.bKeepInputTensor,
] );

