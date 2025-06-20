export { ConcatGather };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ShuffleInfo } from "./ChannelShuffler_ShuffleInfo.js";

/**
 * Implement the channel shuffler by tf.concat() and tf.gather().
 *
 * When outputGroupCount is smaller (e.g. 2), this may be faster than
 * concat-reshape-transpose-reshape-split and split-concat because the total
 * operations (and memory access) are smaller.
 *
 * The extra cost is a pre-built channel index look up table (with tensor1d).
 *
 *
 * @member {number[]} concatenatedShape
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {number} outputGroupCount
 *   (Please see ShuffleInfo explanation.)
 *
 * @member {ShuffleInfo} shuffleInfo
 *   The information calculated from concatenatedShape and outputGroupCount.
 *
 * @member {tf.tensor1d[]} shuffledChannelIndicesTensor1dArray
 *   The look up table for tf.gather()'s channel index. This table is composed
 * of tensor1d so should be released by calling disposeResources().
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not
 * including Params, because they are not used in tensors. Not including
 * inferenced weights (even if they are used in tensors), because they are not
 *  extracted from inputWeightArray.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they
 * are not used in tensors. Including inferenced weights, if they are used in
 * tensors.
 *
 * @member {function} gather
 *   Permute and split the input tensor by gather. It is a function pointer to
 * one of this.gather_XXX().
 *
 * @member {function} concatGather
 *   Concatenate, permute and split the input tensor by concat-gather. It is a
 * function pointer to one of this.concatGather_XXX().
 */
class ConcatGather extends Recyclable.Root {

  /**
   * Used as default ChannelShuffler.ConcatGather provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelShuffler.ConcatGatherPool",
    ConcatGather );

  /**
   *
   * @param {number[]} concatenatedShape  Used to calculate shuffleInfo.
   * @param {number}   outputGroupCount   Used to calculate shuffleInfo.
   * @exception {Object} If failed (e.g. out of GPU memory).
   *
   * @see ShuffleInfo
   */
  constructor( concatenatedShape, outputGroupCount ) {
    super();
    this.#setAsConstructor_self( concatenatedShape, outputGroupCount );
  }

  /** @override */
  setAsConstructor( concatenatedShape, outputGroupCount ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( concatenatedShape, outputGroupCount );
  }

  /**  */
  #setAsConstructor_self( concatenatedShape, outputGroupCount ) {

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    this.shuffleInfo = ShuffleInfo.Pool.get_or_create_by(
      concatenatedShape, outputGroupCount );

    // Build shuffled channel index table (as an array of tf.tensor1d).
    //
    // It can be used by algorithm ConcatGather().
    // They should be integers so that can be used as tf.gather()'s index.
    //
    // Not like SplitConcat, the channel indexes will not be sorted here.
    // According to testing, sorted channel seems slow down memory access when
    // using them as tf.gather()'s index list.
    {
      this.shuffledChannelIndicesTensor1dArray = tf.tidy(
        "ChannelShuffler.ConcatGather.init.shuffledChannelIndicesTensor1dArray",
        () => {
          let channelIndices
            = tf.range( 0, this.shuffleInfo.totalChannelCount, 1, "int32" );
          return Pool.All.sessionCall( () => {
            let channelIndicesShuffleInfo
              = ShuffleInfo.Pool.get_or_create_by(
                  channelIndices.shape, outputGroupCount );
            return channelIndicesShuffleInfo.reshapeTransposeReshapeSplit(
              channelIndices );
          });
        });

      // Calculate total weight count.
      for ( let i = 0;
        i < this.shuffledChannelIndicesTensor1dArray.length; ++i ) {

        let shuffledChannelIndicesTensor1d
          = this.shuffledChannelIndicesTensor1dArray[ i ];

        if ( shuffledChannelIndicesTensor1d ) {
          this.tensorWeightCountTotal += shuffledChannelIndicesTensor1d.size;
        }
      }

    // Exception if failed (e.g. out of (GPU) memory).
    }

    this.gather = this.gather_loop;
    this.concatGather = this.concatGather_dispose_finally_call_loop;
  }

  /**
   * Release tf.tensor.
   *
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {
    this.concatGather = null;
    this.gather = null;

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

    if ( this.shuffledChannelIndicesTensor1dArray ) {
      for ( let i = 0;
        i < this.shuffledChannelIndicesTensor1dArray.length; ++i ) {

        tf.dispose( this.shuffledChannelIndicesTensor1dArray[ i ] );
        this.shuffledChannelIndicesTensor1dArray[ i ] = null;
      }

      this.shuffledChannelIndicesTensor1dArray = null;
    }

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeResources_and_recycleToPool();
      this.shuffleInfo = null;
    }

    super.disposeResources();
  }

  get concatenatedShape() {
    return this.shuffleInfo.concatenatedShape;
  }

  get outputGroupCount() {
    return this.shuffleInfo.outputGroupCount;
  }

  /**
   * Permute and split the input tensor by gather.
   *
   * @param {tf.tensor} concatenatedTensor
   *   An single tensor (not array) to be processed. It should conform to
   * this.shuffleInfo.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as
   * concatenated tensorArray, but their last dimensions are shuffled.
   */
  gather_loop( concatenatedTensor ) {
    let shuffledSplitedTensorArray
      = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather(
        this.shuffledChannelIndicesTensor1dArray[ i ],
        this.shuffleInfo.lastAxisId );
    }
    return shuffledSplitedTensorArray;
  }

  /**
   * Concatenate, permute and split the input tensor by concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to
   * this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as
   * concatenated tensorArray, but their last dimensions are shuffled.
   */
  concatGather_dispose_finally_call_loop( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_loop( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }
}
