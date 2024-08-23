export { NeuralNet_ParamsBase as ParamsBase } ;

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as Block from "../Block.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";

/**
 * NeuralNet parameters base class.
 *
 *
 * @member {number} explicit_input_height
 *   The explicit (i.e. user visible) input image's height (pixel count). It is
 * equal to or less than .inferencedParams.input_height.
 *
 * @member {number} explicit_input_width
 *   The explicit (i.e. user visible) input image's width (pixel count). It is
 * equal to or less than .inferencedParams.input_width.
 *
 * @member {number} explicit_input_channelCount
 *   The explicit (i.e. user visible) input image's channel count. It is always
 * equal to .inferencedParams.input_channelCount. For RGBA input image, it
 * should be 4.
 *
 *
 * @member {boolean} has_implicit_input
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be non-zero.
 *
 *     - In this case, the .output_asInputValueRange should also be true so
 *         that the previous time output is suitable for feedback.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - .inferencedParams.implicit_input_Xxx will be 0.
 *
 * @member {number} vocabularyChannelCount
 *   In the embedding layer, every vocabulary will have how many embedding
 * channels. Every input channel will be expanded into so many embedding
 * channels. It could be viewed as embeddingChannelCountPerInputChannel. It
 * must be ( >= 2 ) because the embedding layer always has
 * ( bEmbedVocabularyId == true ).
 *
 * @member {number} vocabularyCountPerInputChannel
 *   In the embedding layer, every input channel will have how many
 * vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A
 * four channels), there will be 256 vocabularies per input channel because
 * every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 *
 * @member {number} nConvStageTypeId
 *   The type (ValueDesc.ConvStageType.Singleton.Ids.Xxx) of every convolution
 * stage.
 *
 * @member {number} blockCountTotalRequested
 *   How many blocks of the whole neural network are wanted. It will be
 * spreaded to every stage. Note that every stage will have at least 2 blocks.
 *
 * @member {number} output_channelCount
 *   The output tensor's channel count.
 *
 * @member {boolean} output_asInputValueRange
 *   If true, restrict output value to the (neural network) input value range
 * (i.e. non-negative integer which can be used in embedding looking up). This
 * is useful if the output will be used as the recurrent feedback of the next
 * time input. It should be true if ( has_implicit_input == true ).
 *
 * @member {boolean} bKeepInputTensor
 *   If true, apply() will not dispose inputTensor (i.e. will be kept).
 *
 * @member {InferencedParams} inferencedParams
 *   The inferenced parameters of this neural network parameters.
 *
 */
class NeuralNet_ParamsBase extends Recyclable.Root {

  /**
   * Used as default NeuralNet.ParamsBase provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.ParamsBase.Pool",
    NeuralNet_ParamsBase, NeuralNet_ParamsBase.setAsConstructor );

  /**
   */
  constructor(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    has_implicit_input,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {
    super();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      has_implicit_input,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    has_implicit_input,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      has_implicit_input,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    has_implicit_input,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount, output_asInputValueRange,
    bKeepInputTensor
  ) {
    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;
    this.has_implicit_input = has_implicit_input;
    this.vocabularyChannelCount = vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.nConvStageTypeId = nConvStageTypeId;
    this.blockCountTotalRequested = blockCountTotalRequested;
    this.output_channelCount = output_channelCount;
    this.output_asInputValueRange = output_asInputValueRange;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bKeepInputTensor = undefined;
    this.output_asInputValueRange = undefined;
    this.output_channelCount = undefined;
    this.blockCountTotalRequested = undefined;
    this.nConvStageTypeId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.vocabularyChannelCount = undefined;
    this.has_implicit_input = undefined;
    this.explicit_input_channelCount = undefined;
    this.explicit_input_width = undefined;
    this.explicit_input_height = undefined;

    super.disposeResources();
  }

  /**
   * Get or create (from pool) NeuralNet.ParamsBase according to this
   * NeuralNet.ParamsBase.
   */
  clone() {
    let another = NeuralNet_ParamsBase.Pool.get_or_create_by(
      this.explicit_input_height,
      this.explicit_input_width,
      this.explicit_input_channelCount,
      this.has_implicit_input,
      this.vocabularyChannelCount,
      this.vocabularyCountPerInputChannel,
      this.nConvStageTypeId,
      this.blockCountTotalRequested,
      this.output_channelCount, this.output_asInputValueRange,
      this.bKeepInputTensor
    );
    return another;
  }

  /** Release .inferencedParams */
  inferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /**  */
  inferencedParams_create() {
    this.inferencedParams_dispose();
    this.inferencedParams = InferencedParams.Pool.get_or_create_by( this );
  }

  /**
   * @return {boolean}
   *   Return true, if .inferencedParams will create .embeddingParams and
   * .stageParamsArray
   */
  inferencedParams_embeddingParams_stageParamsArray_needed() {
    return true;
  }

  /**
   * @return {Embedding.ParamsBase|Embedding.Params}
   *   Return which embedding parameter class should be used by
   * InferencedParams.
   */
  EmbeddingParamsClass_get() {
    return Embedding.ParamsBase;
  }

  /**
   * @return {Stage.ParamsBase|Stage.Params}
   *   Return which stage parameter class should be used by InferencedParams.
   */
  StageParamsClass_get() {
    return Stage.ParamsBase;
  }

  /**
   * @return {Block.ParamsBase|Block.Params}
   *   Return which block parameter class should be used by InferencedParams.
   */
  BlockParamsClass_get() {
    return Block.ParamsBase;
  }

  /**
   * @return {string}
   *  e.g. "SHUFFLE_NET_V2_BY_MOBILE_NET_V1"
   */
  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId(
      this.nConvStageTypeId );
  }

  /**
   * @return {string}
   *  e.g. "SHUFFLE_NET_V2_BY_MOBILE_NET_V1(5)"
   */
  get nConvStageTypeName_with_Id() {
    return ValueDesc.ConvStageType.Singleton.getNameWithInt_byId(
      this.nConvStageTypeId );
  }

  /**
   * Set nConvStageTypeId to SHUFFLE_NET_V2 (4) if
   * it is SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5) now.
   *
   *
   * Note:
   *
   * The following two convolution neural network architectures use the same
   * filter weights and produce the same result (except some floating-point
   * accumulation error):
   *   - ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2 (4)
   *   - ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5)
   *
   * However, they have different performance advantage in different backend.
   *
   *   - If backend is CPU, SHUFFLE_NET_V2 (4) is faster than
   *       SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5). In fact, it is the fastest
   *       convolution neural network architecture in backend CPU.
   *
   *   - If backend is WEBGL, SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5) is faster
   *       than SHUFFLE_NET_V2 (4).
   *
   */
  nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2() {
    if ( ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1
           === this.nConvStageTypeId ) // (5)
      this.nConvStageTypeId
        = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2; // (4)
  }

  /**
   * Set nConvStageTypeId to SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5) if
   * it is SHUFFLE_NET_V2 (4) now.
   */
  nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2() {
    if ( ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2
           === this.nConvStageTypeId ) // (4)
      this.nConvStageTypeId
        = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1; // (5)
  }


  /** @override */
  toString() {
    let str =
        `explicit_input_height=${this.explicit_input_height}, `
      + `explicit_input_width=${this.explicit_input_width}, `
      + `explicit_input_channelCount=${this.explicit_input_channelCount}, `

      + `has_implicit_input=${this.has_implicit_input}, `

      + `vocabularyChannelCount=${this.vocabularyChannelCount}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `

      + `nConvStageTypeName=${this.nConvStageTypeName_with_Id}, `

      + `blockCountTotalRequested=${this.blockCountTotalRequested}, `

      + `output_channelCount=${this.output_channelCount}, `
      + `output_asInputValueRange=${this.output_asInputValueRange}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `inferencedParams={ ${this.inferencedParams} }`
      ;
    return str;
  }

}
