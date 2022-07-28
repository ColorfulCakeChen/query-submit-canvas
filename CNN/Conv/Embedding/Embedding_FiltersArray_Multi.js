export { Embedding_FiltersArray_Multi as FiltersArray_Multi };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_Base } from "./Embedding_FiltersArray_Base.js";

/**
 * Multiple tables for every vocabulary table of every input channel. It is mainly used by
 * Embedding.SplitReshapeGatherConcat.
 *
 *
 *
 * @member {Racyclable.OwnerArray} filtersArrayArray
 *   Its every element is an instance of Racyclable.Array which is the embedding vocabulary
 * look-up table of one input channel.
 *
 * @see Embedding.FiltersArray_Base
 *
 */
class Embedding_FiltersArray_Multi extends FiltersArray_Base {

  /**
   * Used as default Embedding.FiltersArray_Multi provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.FiltersArray_Multi.Pool",
    Embedding_FiltersArray_Multi, Embedding_FiltersArray_Multi.setAsConstructor );

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
    Embedding_FiltersArray_Multi.setAsConstructor_self.call( this );
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
    Embedding_FiltersArray_Multi.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    if ( this.filtersArrayArray ) {
      this.filtersArrayArray.disposeResources_and_recycleToPool();
      this.filtersArrayArray = null;
    }

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

    // 1. Calcualte weights extracting beginning and ending position.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) ) {
      return false;  // e.g. input array does not have enough data.
    }

    // 2. filtersArray
    let outChannelSubBegin;
    if ( this.bEmbedVocabularyId )
      outChannelSubBegin = 1;
    else
      outChannelSubBegin = 0;

    this.boundsArraySet.output0.set_all_byLowerUpper( +Infinity, -Infinity );
    let outBoundsArray = this.boundsArraySet.output0.boundsArray;

    this.filtersArrayArray = Recyclable.OwnerArray.Pool.get_or_create_by( this.input_channelCount );

    let sourceIndex = weightElementOffsetBegin;

    let outChannel = 0;
    for ( let inChannel = 0; inChannel < this.input_channelCount; ++inChannel ) {

      let filtersArray = this.filtersArrayArray[ inChannel ]
        = Recyclable.Array.Pool.get_or_create_by( this.tensorWeightCountTotal );

      let filterIndex = 0;
      for ( let vocabularyId = 0; vocabularyId < this.vocabularyCountPerInputChannel; ++vocabularyId ) {

        if ( this.bEmbedVocabularyId ) {
          filtersArray[ filterIndex ] = vocabularyId; // Embed the vocabulary's id.
          ++filterIndex;

          outBoundsArray.enlarge_one_byN( outChannel, vocabularyId );
          ++outChannel;
        }

        for ( let outChannelSub = outChannelSubBegin; outChannelSub < this.channelMultiplier; ++outChannelSub ) {
          let filterValue = inputWeightArray[ sourceIndex ];
          ++sourceIndex;

          filtersArray[ filterIndex ] = filterValue;
          ++filterIndex;

          outBoundsArray.enlarge_one_byN( outChannel, filterValue );
          ++outChannel;
        }
      }
    }

    return true;
  }

}
