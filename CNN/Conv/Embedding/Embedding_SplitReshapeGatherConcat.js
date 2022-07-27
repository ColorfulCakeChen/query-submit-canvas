export { Embedding_SplitReshapeGatherConcat as SplitReshapeGatherConcat };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import { FiltersArray_Multi } from "./Embedding_FiltersArray_Multi.js";

/**
 * @member {boolean} bKeepInputTensor
 *   If true, .apply() will not dispose inputTensor (i.e. keep). For another example, the input image
 * needs be shared across many neural networks.
 * 
 * @member {function} apply
 *   Process the input and produce output by looking up the weights of this embedding layer. This is a
 * data member to a function. The function inputs a tensor3d data (e.g. height-width-color for color image,
 * or 1-width-1 for text) with this.inChannels (e.g. 4 for r-g-b-a, or 1 for text) channels. The
 * inputTensor3d.dtype must be int32 (i.e. can not be float32) so that they can be used as tf.gather()'s
 * indices. If ( this.bKeepInputTensor == false ), the inputTensor3d will be disposed. If
 * ( this.bKeepInputTensor == true ), the inputTensor3d will be kept.It is one of keep_input_return_copy(),
 * return_input_directly(), apply_gather_reshape_and_keep(), apply_gather_reshape_and_destroy(),
 * apply_add_gather_reshape_and_keep(), apply_add_gather_reshape_and_destroy().
 *
 * @see Embedding.FiltersArray_Multi
 *
 */
class Embedding_SplitReshapeGatherConcat extends ReturnOrClone.Base( FiltersArray_Multi ) {

  /**
   * Used as default Embedding.SplitReshapeGatherConcat provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.SplitReshapeGatherConcat.Pool",
    Embedding_SplitReshapeGatherConcat, Embedding_SplitReshapeGatherConcat.setAsConstructor );

  /**
   *
   */
   constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_SplitReshapeGatherConcat.setAsConstructor_self.call( this,
      bKeepInputTensor,
      // this.output_height, this.output_width, this.output_channelCount
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    Embedding_SplitReshapeGatherConcat.setAsConstructor_self.call( this,
      bKeepInputTensor,
      // this.output_height, this.output_width, this.output_channelCount
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    bKeepInputTensor,
    // output_height, output_width, output_channelCount
  ) {
    this.bKeepInputTensor = bKeepInputTensor;

!!! ...unfinished... (2022/07/27)

  }

  /** @override */
  disposeResources() {
    this.bKeepInputTensor = undefined;


!!! ...unfinished... (2022/07/27)

    super.disposeResources();
  }

  /**
   * Initialize this object.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   */
   init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) {

    // 1. Extract weights.
    if ( !super.init( inputWeightArray, weightElementOffsetBegin, inputScaleBoundsArray ) ) {
      return false;  // e.g. input array does not have enough data.
    }


!!! ...unfinished... (2022/07/27)

    Embedding_AddGatherReshape.setup_apply_embedding.call( this );
    return true;
  }

  /** Determine this.apply data members.
   *
   * @param {Embedding_AddGatherReshape} this
   *   The Embedding_AddGatherReshape object to be determined and modified.
   */
  static setup_apply_embedding() {

!!! ...unfinished... (2022/07/27)

  }

  /** */
  static apply_Xxx_and_keep( inputTensor ) {

!!! ...unfinished... (2022/07/27)

  }

  /** */
  static apply_Xxx_and_destroy( inputTensor ) {

!!! ...unfinished... (2022/07/27)

  }


}
