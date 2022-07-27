export { AddGatherReshape };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { FiltersArray_One } from "./Embedding_FiltersArray_One.js";

/**
 *
 *
 * @member {boolean} bKeepInputTensor
 *   If true, .apply() will not dispose inputTensor (i.e. keep). For another example, the input image
 * needs be shared across many neural networks.
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
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel = 256, bEmbedVocabularyId = true,
    bKeepInputTensor
  ) {
    super(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    AddGatherReshape.setAsConstructor_self.call( this, bKeepInputTensor );
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

    if ( this.vocabularyTableTensor2d ) {
      this.vocabularyTableTensor2d.dispose();
      this.vocabularyTableTensor2d = null;
    }

    if ( this.vocabularyTableShape ) {
      this.vocabularyTableShape.dispose();
      this.vocabularyTableShape = null;
    }

    if ( this.channelValueOffsetTensor3d ) {
      this.channelValueOffsetTensor3d.dispose();
      this.channelValueOffsetTensor3d = null;
    }

    if ( this.channelValueOffsetShape ) {
      this.channelValueOffsetShape.dispose();
      this.channelValueOffsetShape = null;
    }

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

    // 2.
    {
      // Build a tensor3d for shifting every value of every input channels of inputTensor3d. So that they can be used for
      // indexing the one merged longer vocabulary table tensor2d.
      //
      // Channel                  0: ( channelValue + (                  0 * vocabularyCountPerInputChannel ) )
      // Channel                  1: ( channelValue + (                  1 * vocabularyCountPerInputChannel ) )
      // Channel                  2: ( channelValue + (                  2 * vocabularyCountPerInputChannel ) )
      //   :
      // Channel ( inChannels - 1 ): ( channelValue + ( ( inChannels - 1 ) * vocabularyCountPerInputChannel ) )
      {
        let channelValueOffsetArray = Recyclable.Array.Pool.get_or_create( this.input_channelCount );
        for ( let i = 0; i < channelValueOffsetArray.length; ++i )
          channelValueOffsetArray[ i ] = i * this.vocabularyCountPerInputChannel;

        this.channelValueOffsetShape = Recyclable.Array.Pool.get_or_create( 1, 1, this.input_channelCount );
        this.channelValueOffsetTensor3d
          = tf.tensor3d( channelValueOffsetArray, this.channelValueOffsetShape , "int32" ); // For one pixel's all input channels.

        channelValueOffsetArray.disposeResources_and_recycleToPool();
        channelValueOffsetArray = null;

        // Note: Because .channelValueOffsetShape will be kept by .channelValueOffsetTensor3d internally,
        //       it can not be released here.
      }

      this.tensorWeightCountTotal += this.channelValueOffsetTensor3d.size;
    }

    // 3.
    {
      {
        let vocabularyCountTotal = this.vocabularyCountPerInputChannel * this.input_channelCount;

        this.vocabularyTableShape
          = Recyclable.Array.Pool.get_or_create( vocabularyCountTotal, this.channelMultiplier );

        this.vocabularyTableTensor2d = tf.tensor2d( this.filtersArray, this.vocabularyTableShape );

        // Note: Because .vocabularyTableShape will be kept by .vocabularyTableTensor2d internally,
        //       it can not be released here.
      }

      this.tensorWeightCountTotal += this.vocabularyTableTensor2d.size;

      { // Release filtersArray for reducing memory footprint.
        this.filtersArray.disposeResources_and_recycleToPool();
        this.filtersArray = null;
      }
    }
  }

  /**
   * Process input, destroy or keep input, return result.
   *
   * @param {tf.tensor3d} inputTensor
   *   The source input image ( height x width x channel ) which will be processed. This inputTensor may or may not be disposed
   * according to .bKeepInputTensor.
   *
   * @return {tf.tensor3d}
   *   Return a new tensor. All other intermediate tensors were disposed.
   */
  apply( inputTensor ) {

//!!! ...unfinished... (2022/07/27)

  }

}
