export { Embedding_FiltersArray_Base as FiltersArray_Base };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { InferencedParams } from "./Embedding_InferencedParams.js";


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
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this embedding.
 *
 * @see Weight.Base
 * @see Embedding.InferencedParams
 *
 */
class Embedding_FiltersArray_Base extends Weights.Base( InferencedParams ) {

  /**
   * Used as default Embedding.FiltersArray_Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.FiltersArray_Base.Pool",
    Embedding_FiltersArray_Base, Embedding_FiltersArray_Base.setAsConstructor );

  /**
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super.setAsConstructor(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.channelMultiplier = channelMultiplier;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
  }

  /** @override */
  disposeResources() {
    if ( this.boundsArraySet ) {
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }

    this.bEmbedVocabularyId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.channelMultiplier = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    super.disposeResources();
  }

  /**
   * Initialize this object.
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

    // Calcualte weights extracting beginning and ending position.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, this.tensorWeightCountExtracted ) ) {
      return false;  // e.g. input array does not have enough data.
    }

    // Initialize element value bounds (per channel).
    this.boundsArraySet = BoundsArraySet.InputsOutputs.Pool.get_or_create_by(
      inputScaleBoundsArray, null, this.output_channelCount );

    return true;
  }

}
