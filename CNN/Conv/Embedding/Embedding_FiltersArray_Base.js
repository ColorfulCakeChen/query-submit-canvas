export { Embedding_FiltersArray_Base as FiltersArray_Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import * as Weights from "../../Unpacker/Weights.js";


//!!! ...unfinished... (2022/07/25)
// Perhaps, provide a parameter control whether different input channel uses the same
// or different look-up (i.e. vocabulary) table.

/**
 * This is the base class of Embedding.FiltersArray_One and Embedding.FiltersArray_Multi.
 *
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
 * @member {boolean} bInitOk
 *  If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
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
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used
 * in tensors. Not including embedded vocabulary id (even if ( bEmbedVocabularyId == true )), because they are not extracted
 * from inputWeightArray.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including embedded
 * vocabulary id.
 *
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this embedding.
 *
 * @see Weight.Root
 *
 */
class Embedding_FiltersArray_Base extends Weights.Root {

  /**
   * Used as default Embedding.FiltersArray_Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.FiltersArray_Base.Pool",
    Embedding_FiltersArray_Base, Embedding_FiltersArray_Base.setAsConstructor );

  /**
   *
   */
  constructor(
    input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super();
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this,
      input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
  }

  /** @override */
  static setAsConstructor(
    input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super.setAsConstructor();
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this,
      input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    this.input_channelCount = input_channelCount;
    this.channelMultiplier = channelMultiplier;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;

    {
      this.output_channelCount = this.input_channelCount * this.channelMultiplier;
      this.tensorWeightCountTotal_internal = this.input_channelCount * this.output_channelCount;
      this.vocabularyIdMax = this.vocabularyCountPerInputChannel - 1; // maximum legal vocabulary id.

      if ( this.bEmbedVocabularyId ) {
        this.weightsCountPerVocabularyTable = ( this.channelMultiplier - 1 ) * this.vocabularyCountPerInputChannel;

      } else {
        this.weightsCountPerVocabularyTable = this.channelMultiplier * this.vocabularyCountPerInputChannel;
      }
    }
  }

  /** @override */
  disposeResources() {
    if ( this.boundsArraySet ) {
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }

    this.weightsCountPerVocabularyTable = undefined;
    this.vocabularyIdMax = undefined;
    this.tensorWeightCountTotal_internal = undefined;
    this.output_channelCount = undefined;

    this.bEmbedVocabularyId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.channelMultiplier = undefined;
    this.input_channelCount = undefined;

    super.disposeResources();
  }

  /**
   * Generator for initializing this object.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   *
   */
  init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) {

    if ( this.input_channelCount != inputScaleBoundsArray.length )
      throw Error( `Embedding.FiltersArray_Base.init(): `
        + `input_channelCount ( ${this.input_channelCount} ) should be the same as `
        + `output_channelCount of previous operation ( ${inputScaleBoundsArray.length} ).`
      );

    if ( !inputScaleBoundsArray.scaleArraySet.undo.is_all_EQ_byN( 1 ) )
      throw Error( `Embedding.FiltersArray_Base.init(): `
        + `The .output.scaleArraySet.undo ( ${inputScaleBoundsArray.scaleArraySet.undo.scales} ) `
        + `of previous operation `
        + `should be all one (i.e. should not have activation escaping scaling).`
      );

    if ( !inputScaleBoundsArray.boundsArray.is_all_IN_byLowerUpper( 0, this.vocabularyIdMax ) )
      throw Error( `Embedding.FiltersArray_Base.init(): `
        + `The .output.boundsArray ( ${inputScaleBoundsArray.boundsArray} ) `
        + `of previous operation `
        + `should be all within [ 0, ${this.vocabularyIdMax} ].`
      );

    let tableCount = this.input_channelCount;
    let weightsCount_extracted = this.weightsCountPerVocabularyTable * tableCount;

    this.tensorWeightCountTotal_internal

    // Prepare source weights to be extracted.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, weightsCount_extracted ) ) { // i.e. Weights.Base.init()
      this.bInitOk = false;
      return false;  // e.g. input array does not have enough data.
    }

    // Initialize element value bounds (per channel).
    this.boundsArraySet = BoundsArraySet.InputsOutputs.Pool.get_or_create_by(
      inputScaleBoundsArray, null, this.output_channelCount );

    this.bInitOk = true;
    return true;
  }

  /** @override */
  get tensorWeightCountExtracted() {
    return this.weightElementExtractedCount;
  }

  /** @override */
  get tensorWeightCountTotal() {
    return this.tensorWeightCountTotal_internal;
  }

}
