export { Embedding_FiltersArray_One as FiltersArray_One };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import { FiltersArray_Base } from "./Embedding_FiltersArray_Base.js";

/**
 * A large table which is composed of all vocabulary table of every input channel. It is
 * mainly used by Embedding.AddGatherReshape.
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
    Embedding_FiltersArray_One.setAsConstructor_self.call( this );
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
    Embedding_FiltersArray_One.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
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
   *   Return true, if successfully. Return false, if failed.
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

    this.output_scaleBoundsArray.set_all_by_PositiveInfinity_NegativeInfinity();
    let outBoundsArray = this.output_scaleBoundsArray.boundsArray;

    this.filtersArray = Recyclable.Array.Pool.get_or_create_by( this.tensorWeightCountTotal );
    let filterIndex = 0;

    let sourceIndex = weightElementOffsetBegin;

    let outChannelBegin = 0;
    for ( let inChannel = 0; inChannel < this.input_channelCount; ++inChannel ) {
      for ( let vocabularyId = 0; vocabularyId < this.vocabularyCountPerInputChannel; ++vocabularyId ) {
        let outChannel = outChannelBegin;

        if ( this.bEmbedVocabularyId ) {
          this.filtersArray[ filterIndex ] = vocabularyId; // Embed the vocabulary's id.
          ++filterIndex;

          outBoundsArray.enlarge_one_byN( outChannel, vocabularyId );
          ++outChannel;
        }

        for ( let outChannelSub = outChannelSubBegin; outChannelSub < this.channelMultiplier; ++outChannelSub ) {
          let filterValue = inputWeightArray[ sourceIndex ];
          ++sourceIndex;

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
