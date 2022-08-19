export { Embedding_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import { Params } from "./Embedding_Params.js";

/**
 * This is the base class of Embedding.AddGatherReshape and Embedding.SplitReshapeGatherConcat.
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
 * @member {ActivationEscaping.ScaleBoundsArray} output_scaleBoundsArray
 *   The element value bounds (per channel) of output (can NOT null).
 *
 */
class Embedding_Base extends Recyclable.Base( ReturnOrClone.Root ) {

  /**
   * Used as default Embedding.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.Base.Pool", Embedding_Base, Embedding_Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Embedding_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Embedding_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /**
   * Generator for initializing this object.
   * 
   * Note: Embedding.initer() does not have argument inputScaleBoundsArray0, but it does
   * assumes input's value bounds is [ 0, vocabularyCountPerInputChannel ].
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.root_get() will be returned when every time yield.
   *
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters. This
   * params will be owned and destroyed by this .initer(). So caller should not use
   * it again.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   */
  * initer( progressParent, inputWeightArray, weightElementOffsetBegin, params ) {

    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.bInitOk = false;

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputWeightArray.
      ;

    let progressRoot = progressParent.root_get();
    let progressToAdvance = progressParent.child_add( ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) ); // For parameters extracting.

    // 1. Extract parameters.
    if ( !params )
      return false;

    if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
      return false;  // e.g. input array does not have enough data.
    this.weightElementOffsetEnd = params.weightElementOffsetEnd;

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputWeightArray could be released.
    this.input_height = params.input_height;
    this.input_width = params.input_width;
    this.input_channelCount = params.input_channelCount;
    this.channelMultiplier = params.channelMultiplier;
    this.vocabularyCountPerInputChannel = params.vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = params.bEmbedVocabularyId;
    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
      this.output_height = params.inferencedParams.output_height;
      this.output_width = params.inferencedParams.output_width;
      this.output_channelCount = params.inferencedParams.output_channelCount;
      this.vocabularyIdMax = params.inferencedParams.vocabularyIdMax;
      this.weightCountPerVocabularyTable_extracted = params.inferencedParams.weightCountPerVocabularyTable_extracted;
      this.weightCountPerVocabularyTable = params.inferencedParams.weightCountPerVocabularyTable;
      this.tensorWeightCountExtracted = params.inferencedParams.tensorWeightCountExtracted;
      this.tensorWeightCountTotal = params.inferencedParams.tensorWeightCountTotal;
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // Parameters extracted. Report progress.

    try {

      this.bInitOk = true;
      return true;

    } finally {
      if ( params ) {
        params.disposeResources_and_recycleToPool();
        params = undefined;
      }
    }
  }

  /**
   * Initialize this object by calling initer() and advance the generator by loop until done.
   *
   * @return {boolean}
   *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
   *   Return false if failed (and progressParent.valuePercentage will be less than 100).
   *
   * @see Block.Base.init()
   */
  init( progressParent, inputWeightArray, weightElementOffsetBegin, params ) {

    let initer = this.initer( progressParent, inputWeightArray, weightElementOffsetBegin, params );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.root_get().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** @override */
  disposeResources() {

    if ( this.output_scaleBoundsArray ) {
      this.output_scaleBoundsArray.disposeResources_and_recycleToPool();
      this.output_scaleBoundsArray = null;
    }

    this.tensorWeightCountTotal = undefined;
    this.tensorWeightCountExtracted = undefined;
    this.weightCountPerVocabularyTable = undefined;
    this.weightCountPerVocabularyTable_extracted = undefined;
    this.vocabularyIdMax = undefined;
    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;

    this.bKeepInputTensor = undefined;
    this.bEmbedVocabularyId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.channelMultiplier = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.weightElementOffsetEnd = undefined;
    this.weightElementOffsetBegin = undefined;
    this.bInitOk = undefined;

    super.disposeResources();
  }

  /**
   * @return {string} The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let strDescription = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `channelMultiplier=${this.channelMultiplier}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `

      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
      + `vocabularyIdMax=${this.vocabularyIdMax}, `
      + `weightCountPerVocabularyTable_extracted=${this.weightCountPerVocabularyTable_extracted}, `
      + `weightCountPerVocabularyTable=${this.weightCountPerVocabularyTable}, `
      + `tensorWeightCountExtracted=${this.tensorWeightCountExtracted}, `
      + `tensorWeightCountTotal=${this.tensorWeightCountTotal}`
    ;
    return strDescription;
  }

}

