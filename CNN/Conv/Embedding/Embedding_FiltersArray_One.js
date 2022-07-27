export { Embedding_FiltersArray_One as FiltersArray_One };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as ActivationEscaping from "../ActivationEscaping.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_Base } from "./Embedding_FiltersArray_One.js";

//!!! ...unfinished... (2022/07/25)
// Perhaps, provide a parameter control whether different input channel uses the same
// or different look-up (i.e. vocabulary) table.

/**
 * A large table which is composed of all vocabulary table of every input channel. It is
 * mainly used by Embedding.AddGatherReshape.
 *
 *
 *
 *
 * @member {Racyclable.Array} filtersArray
 *   The embedding vocabulary look-up table. It is composed by merging all input channels'
 * vocabulary.
 *
 * @see Embedding.FiltersArray_Base
 *
 */
class Embedding_FiltersArray_One extends FiltersArray_Base {

  /**
   * Used as default Embedding.FiltersArray_One provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.FiltersArray_One.Pool",
    Embedding_FiltersArray_One, Embedding_FiltersArray_One.setAsConstructor );

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
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super.setAsConstructor(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_FiltersArray_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

!!! ...unfinished... (2022/07/27)

    if ( this.filtersArray ) {
      this.filtersArray.disposeResources_and_recycleToPool();
      this.filtersArray = null;
    }

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

    // Calcualte weights extracting beginning and ending position.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, this.tensorWeightCountExtracted ) ) {
      return false;  // e.g. input array does not have enough data.
    }

//!!! ...unfinished... (2022/07/27) filtersArray

    return true;
  }

}
