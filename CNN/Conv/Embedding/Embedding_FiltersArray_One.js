export { Embedding_FiltersArray_One as FiltersArray_One };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import { FiltersArray_Base } from "./Embedding_FiltersArray_Base.js";

/**
 * A large table which is composed of all vocabulary table of every input
 * channel. It is mainly used by Embedding.AddGatherReshape.
 *
 *
 *
 * @member {Racyclable.Array} filtersArray
 *   The embedding vocabulary look-up table. It is composed by merging all
 * input channels' vocabulary.
 *
 * @see Embedding.FiltersArray_Base
 *
 */
class Embedding_FiltersArray_One extends FiltersArray_Base {

  /**
   * Used as default Embedding.FiltersArray_One provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.FiltersArray_One.Pool",
    Embedding_FiltersArray_One );

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
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super.setAsConstructor(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    if ( this.filtersArray ) {
      this.filtersArray.disposeResources_and_recycleToPool();
      this.filtersArray = null;
    }

    super.disposeResources();
  }

  /**
   * Initialize this object.
   *
   * @return {boolean}
   *   Return true, if succeeded. Return false, if failed.
   *
   */
  init( inputWeightArray, weightElementOffsetBegin ) {

    // 1. Calcualte weights extracting beginning and ending position.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin ) ) {
      return false;  // e.g. input array does not have enough data.
    }

    // 2. filtersArray
    let outChannelSubBegin;
    if ( this.bEmbedVocabularyId )
      outChannelSubBegin = 1;
    else
      outChannelSubBegin = 0;

    this.output_scaleBoundsArray
      .set_all_by_PositiveInfinity_NegativeInfinity();

    let outBoundsArray = this.output_scaleBoundsArray.boundsArray;

    this.filtersArray
      = Recyclable.Array.Pool.get_or_create_by( this.tensorWeightCountTotal );

    let filterIndex = 0;

    let sourceIndex = weightElementOffsetBegin;

    let outChannelBegin = 0;
    for ( let inChannel = 0;
      inChannel < this.input_channelCount; ++inChannel ) {

      for (
        let vocabularyId = 0;
        vocabularyId < this.vocabularyCountPerInputChannel;
        ++vocabularyId ) {

        let outChannel = outChannelBegin;

        if ( this.bEmbedVocabularyId ) {
          // Embed the vocabulary's id.
          this.filtersArray[ filterIndex ] = vocabularyId;
          ++filterIndex;

          outBoundsArray.enlarge_one_byN( outChannel, vocabularyId );
          ++outChannel;
        }

        for (
          let outChannelSub = outChannelSubBegin;
          outChannelSub < this.channelMultiplier;
          ++outChannelSub ) {

          let filterValue = inputWeightArray[ sourceIndex ];
          ++sourceIndex;

          // Note: fround() for all source (i.e. input, filter and bias).
          //       Please see Embedding_Reference_Base.calcResult().
          //
          // (2025/07/05)
          filterValue = Math.fround( filterValue );

          this.filtersArray[ filterIndex ] = filterValue;
          ++filterIndex;

          outBoundsArray.enlarge_one_byN( outChannel, filterValue );
          ++outChannel;
        }
      }

      outChannelBegin += this.channelMultiplier;
    }

    return true;
  }

}
