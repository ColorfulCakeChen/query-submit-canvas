export { Embedding_FiltersArray_Base as FiltersArray_Base };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import { InferencedParams } from "./Embedding_InferencedParams.js";


//!!! ...unfinished... (2022/07/25)
// Perhaps, provide a parameter control whether different input channel uses the same
// or different look-up (i.e. vocabulary) table.

/**
 * This is the base class of Embedding.FiltersArray_One and Embedding.FiltersArray_Multi.
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
    if ( this.output_scaleBoundsArray ) {
      this.output_scaleBoundsArray.disposeResources_and_recycleToPool();
      this.output_scaleBoundsArray = null;
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
   * Note: Embedding_FiltersArray.init() does not have argument inputScaleBoundsArray,
   * but it does assumes input's value bounds is [ 0, vocabularyCountPerInputChannel ].
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   */

//!!! (2022/08/03 Remarked) Embedding_FiltersArray.init() no longer has inputScaleBoundsArray.

//   init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) {

//     if ( this.input_channelCount != inputScaleBoundsArray.length )
//       throw Error( `Embedding.FiltersArray_Base.init(): `
//         + `input_channelCount ( ${this.input_channelCount} ) should be the same as `
//         + `output_channelCount of previous operation ( ${inputScaleBoundsArray.length} ).`
//       );

//     if ( !inputScaleBoundsArray.scaleArraySet.undo.is_all_EQ_byN( 1 ) )
//       throw Error( `Embedding.FiltersArray_Base.init(): `
//         + `The .output.scaleArraySet.undo ( ${inputScaleBoundsArray.scaleArraySet.undo.scales} ) `
//         + `of previous operation `
//         + `should be all one (i.e. should not have activation escaping scaling).`
//       );

//     if ( !inputScaleBoundsArray.boundsArray.is_all_in_LowerUpper( 0, this.vocabularyIdMax ) )
//       throw Error( `Embedding.FiltersArray_Base.init(): `
//         + `The .output.boundsArray ( ${inputScaleBoundsArray.boundsArray} ) `
//         + `of previous operation `
//         + `should be all within [ 0, ${this.vocabularyIdMax} ].`
//       );

  init( inputWeightArray, weightElementOffsetBegin ) {

        // Calcualte weights extracting beginning and ending position.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, this.tensorWeightCountExtracted ) ) {
      return false;  // e.g. input array does not have enough data.
    }

    // Initialize element value bounds (per channel).
    this.output_scaleBoundsArray = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by(
      this.output_channelCount );

    return true;
  }

}
