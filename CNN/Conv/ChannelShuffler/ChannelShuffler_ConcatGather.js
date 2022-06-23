export { ConcatGather };

import { ShuffleInfo } from "./ChannelShuffler_ShuffleInfo.js";

/**
 * Implement the channel shuffler by tf.concat() and tf.gather().
 *
 * When outputGroupCount is smaller (e.g. 2), this may be faster than concat-reshape-transpose-reshape-split and
 * split-concat because the total operations (and memory access) are smaller.
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
 *   The look up table for tf.gather()'s channel index. This table is composed of tensor1d so should be released
 * by calling disposeTensors().
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} gather
 *   Permute and split the input tensor by gather. It is a function pointer to one of this.gather_XXX().
 *
 * @member {function} concatGather
 *   Concatenate, permute and split the input tensor by concat-gather. It is a function pointer to one of
 * this.concatGather_XXX().
 */
class ConcatGather {

  /**
   *
   * @param {number[]} concatenatedShape  Used to calculate shuffleInfo.
   * @param {number}   outputGroupCount   Used to calculate shuffleInfo.
   * @return {boolean} If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ShuffleInfo
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    this.shuffleInfo = new ShuffleInfo( concatenatedShape, outputGroupCount );

    // Build shuffled channel index table (as an array of tf.tensor1d).
    //
    // It can be used by algorithm ConcatGather().
    // They should be integers so that can be used as tf.gather()'s index.
    //
    // Not like SplitConcat, the channel indexes will not be sorted here. According to testing, sorted
    // channel seems slow down memory access when using them as tf.gather()'s index list.
    {
      this.shuffledChannelIndicesTensor1dArray
        = tf.tidy( "ChannelShuffler.ConcatGather.init.shuffledChannelIndicesTensor1dArray", () => {
          let channelIndices = tf.range( 0, this.shuffleInfo.totalChannelCount, 1, "int32" );
          let channelIndicesShuffleInfo = new ShuffleInfo( channelIndices.shape, outputGroupCount );
          return channelIndicesShuffleInfo.reshapeTransposeReshapeSplit( channelIndices );
        });

      // Calculate total weight count.
      for ( let i = 0; i < this.shuffledChannelIndicesTensor1dArray.length; ++i ) {
        let shuffledChannelIndicesTensor1d = this.shuffledChannelIndicesTensor1dArray[ i ];
        if ( shuffledChannelIndicesTensor1d ) {
//!!! (2022/06/08 Remarked) Use .size instead.
//          this.tensorWeightCountTotal += tf.util.sizeFromShape( shuffledChannelIndicesTensor1d.shape );
          this.tensorWeightCountTotal += shuffledChannelIndicesTensor1d.size;
        }
      }

    // Exception if failed (e.g. out of (GPU) memory).
    }

    this.gather = this.gather_loop;
    this.concatGather = this.concatGather_dispose_finally_call_loop;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.shuffledChannelIndicesTensor1dArray ) {
      tf.dispose( this.shuffledChannelIndicesTensor1dArray );
      this.shuffledChannelIndicesTensor1dArray = null;
    }

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeTensors();
      this.shuffleInfo = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
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
   *   An single tensor (not array) to be processed. It should conform to this.shuffleInfo.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  gather_loop( concatenatedTensor ) {
    let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
    }
    return shuffledSplitedTensorArray;
  }

  /**
   * Concatenate, permute and split the input tensor by concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  concatGather_dispose_finally_call_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_loop( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }
}

