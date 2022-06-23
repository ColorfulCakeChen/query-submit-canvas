export { ConcatPointwiseConv };

import { ConcatGather } from "./ChannelShuffler_ConcatGather.js";

/**
 * Implement the channel shuffler by 1x1 tf.Conv2D() (i.e. pointwise convolution).
 *
 * Interestingly, although it looks like the most computing intensively (because many multiplications),
 * it is usually the fastest method (faster than concat-reshape-transpose-reshape-split, concat-gather,
 * split-concat) no matter in WebGL backend or CPU backend.
 *
 * Only when output group is one (i.e. no group; all one group), this pointwise-convolution method
 * may become second fastest.
 *
 * In both WebGL and CPU backend, the less the output group count is, the faster the shuffling is. That is,
 * one output group is faster than two (and four, eight, ...) output group. This behavior is the same as the
 * other shuffling method.
 *
 *
 * Concat-PointwiseConv-Split
 *
 * Another style of this implementation is PointwiseConv-Split (i.e. pointwise convolution by only one 1x1
 * filter and then split). Its performance, however, is slower than pointwise convolution of multiple 1x1
 * filters. The reason seems that the tf.split() is a slow operation (especially in mobile).
 *
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
 * @member {tf.tensor4d[]} filtersTensor4dArray
 *   The pointwise convolution filters. They are used to achieve shuffle-split, and will be released by calling disposeTensors().
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
class ConcatPointwiseConv {

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @return {boolean}
   *   If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ConcatGather
   */
  constructor( concatenatedShape, outputGroupCount ) {

    this.disposeTensors(); // So that distinguishable if re-initialization failed.

    let concatGather = new ConcatGather( concatenatedShape, outputGroupCount );

    // Build 1x1 convolution filters for channel shuffling. (as an array of tf.tensor4d).
    try {
      let filterHeight = 1; // Pointwise convolution is convolution 2d with 1 x 1 filter.
      let filterWidth = 1;
      let inDepth = concatGather.shuffleInfo.totalChannelCount;
      let outDepth = concatGather.shuffleInfo.channelCountPerGroup;

      // Every filter is a tensor3d [ filterHeight, filterWidth, inDepth ].
      // All filters composes a tensor4d.
      let filtersShape = [ filterHeight, filterWidth, inDepth, outDepth ];

      this.filtersTensor4dArray = tf.tidy( "ChannelShuffler.PointwiseConv.init.filtersTensor4dArray", () => {
        return concatGather.shuffledChannelIndicesTensor1dArray.map( ( shuffledChannelIndicesTensor1d ) => {
          return tf.tidy( "ChannelShuffler.PointwiseConv.init.filtersTensor4dArray.shuffledChannelIndicesTensor1d", () => {

            // Generate oneHotIndices (tensor2d, int32) by shuffledChannelIndices (tensor1d).
            let filtersOfOneGroupTensor2d_int32 = tf.oneHot( shuffledChannelIndicesTensor1d, inDepth );

            // Generate oneHotIndices (tensor2d, float32).
            //
            // The tf.oneHot() genetates tensor with ( dtype == "int32" ). However, in backend WASM, if tf.conv2d()
            // input tensor ( dtype == "float32" ) and filter tensor ( dtype == "int32" ), the result will be wrong.
            // This issue does not exist in backend CPU and WEBGL. For avoiding this problem, convert the filter
            // tensor from ( dtype == "int32" ) into ( dtype == "float32" ).
            //
            let filtersOfOneGroupTensor2d = tf.cast( filtersOfOneGroupTensor2d_int32, "float32" );

            // Transpose it so that the last axis is the outDepth (not inDepth) which conforms to the requirement
            // of tf.conv2d()'s filters.
            let filtersOfOneGroupTensor2d_transposed = filtersOfOneGroupTensor2d.transpose();

            // Reinterpret the tensor2d to tensor4d so that it can be used as tf.conv2d()'s filters.
            let filtersOfOneGroupTensor4d = filtersOfOneGroupTensor2d_transposed.reshape( filtersShape );
            return filtersOfOneGroupTensor4d;
          });
        });
      });

      if ( this.filtersTensor4dArray ) {
        for ( let i = 0; i < this.filtersTensor4dArray.length; ++i ) {
          let filtersTensor4d = this.filtersTensor4dArray[ i ];
          if ( filtersTensor4d ) {
//!!! (2022/06/08 Remarked) Use .size instead.
//            this.tensorWeightCountTotal += tf.util.sizeFromShape( filtersTensor4d.shape );
            this.tensorWeightCountTotal += filtersTensor4d.size;
          }
        }
      }

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    this.gather = this.gather_loop;
    this.concatGather = this.concatGather_dispose_finally_call_loop;
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.filtersTensor4dArray ) {
      tf.dispose( this.filtersTensor4dArray );
      this.filtersTensor4dArray = null;
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
    let shuffledSplitedTensorArray = new Array( this.filtersTensor4dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by pointwise convolution (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d( this.filtersTensor4dArray[ i ], 1, "valid" );
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
