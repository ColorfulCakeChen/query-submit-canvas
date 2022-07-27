export { AddGatherReshape };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_One } from "./Embedding_FiltersArray_One.js";


//!!! ...unfinished... (2022/07/26)
// Embedding assert if input bounds per channel larger than vocabulary count per table.


//!!! ...unfinished... (2022/07/25)
// Perhaps, provide a parameter control whether different input channel uses the same
// or different look-up (i.e. vocabulary) table.

/**
 *
 *
 * @member {function} destroy_or_keep_input
 *   This is a function pointer to one of destroy_input(), keep_input(). If ( this.bKeepInputTensor == false ),
 * it pointer to destroy_input(). If ( this.bKeepInputTensor == true ), it pointer to keep_input().
 *
 * @member {function} apply_and_destroy_or_keep
 *   Process the input and produce output by looking up the weights of this embedding layer. This is a function pointer
 * to one of keep_input_return_copy(), return_input_directly(), apply_and_destroy_or_keep_SplitGatherConcat().
 * It inputs a tensor3d data (e.g. height-width-color for color image, or 1-width-1 for text) with this.inChannels
 * (e.g. 4 for r-g-b-a, or 1 for text) channels. The inputTensor3d.dtype must be int32 (i.e. can not be float32)
 * so that they can be used as tf.gather()'s indices. If ( this.bKeepInputTensor == false ), the inputTensor3d
 * will be disposed. If ( this.bKeepInputTensor == true ), the inputTensor3d will be kept.
 *
 * @see Embedding.FiltersArray_One
 *
 */
class AddGatherReshape extends FiltersArray_One {

  /**
   * Used as default Embedding.AddGatherReshape provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.AddGatherReshape.Pool", AddGatherReshape, AddGatherReshape.setAsConstructor );

  /**
   *
   */
  constructor(
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super(
      input_channelCount,
      channelMultiplier,
      vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    AddGatherReshape.setAsConstructor_self.call( this, bKeepInputTensor );
  }

  /** @override */
  static setAsConstructor(
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      input_channelCount,
      channelMultiplier,
      vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    AddGatherReshape.setAsConstructor_self.call( this, bKeepInputTensor );
  }

  /** @override */
  static setAsConstructor_self() {
    this.bKeepInputTensor = bKeepInputTensor;
    return this;
  }

  /** @override */
  disposeResources() {
    this.bKeepInputTensor = undefined;

!!! ...unfinished... (2022/07/17)

    super.disposeResources();
  }

  /**
   * Generator for initializing this object.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Stage value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean}
   *   Return true, if successfully. Return false, if failed.
   *
   */
  * init( inputWeightArray, weightElementOffsetBegin,
    input_channelCount,
    channelMultiplier,
    vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor,
    inputScaleBoundsArray0
  ) {

   
 
  }

}
