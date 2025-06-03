export { ConcatPointwiseConv };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ShuffleInfo } from "./ChannelShuffler_ShuffleInfo.js";
import { ConcatGather } from "./ChannelShuffler_ConcatGather.js";

/**
 * Implement the channel shuffler by 1x1 tf.Conv2D() (i.e. pointwise
 * convolution).
 *
 * Interestingly, although it looks like the most computing intensively
 * (because many multiplications), it is usually the fastest method (faster
 * than concat-reshape-transpose-reshape-split, concat-gather, split-concat)
 * no matter in WebGL backend or CPU backend.
 *
 * Only when output group is one (i.e. no group; all one group), this
 * pointwise-convolution method may become the 2nd fastest.
 *
 * In both WebGL and CPU backend, the less the output group count is, the
 * faster the shuffling is. That is, one output group is faster than two (and
 * four, eight, ...) output group. This behavior is the same as the other
 * shuffling method.
 *
 *
 * Concat-PointwiseConv-Split
 *
 * Another style of this implementation is PointwiseConv-Split (i.e. pointwise
 * convolution by only one 1x1 filter and then split). Its performance,
 * however, is slower than pointwise convolution of multiple 1x1 filters. The
 * reason seems that the tf.split() is a slow operation (especially in mobile
 * phone).
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
 *   The pointwise convolution filters. They are used to achieve shuffle-split,
 * and will be released by calling disposeResources().
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not
 * including Params, because they are not used in tensors. Not including
 * inferenced weights (even if they are used in tensors), because they are not
 * extracted from inputWeightArray.
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
class ConcatPointwiseConv extends Recyclable.Root {

  /**
   * Used as default ChannelShuffler.ConcatPointwiseConv provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelShuffler.ConcatPointwiseConvPool",
    ConcatPointwiseConv, ConcatPointwiseConv.setAsConstructor );

  /**
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @exception {Object} If failed (e.g. out of GPU memory).
   *
   * @see ConcatGather
   */
  constructor( concatenatedShape, outputGroupCount ) {
    super();
    ConcatPointwiseConv.setAsConstructor_self.call( this,
      concatenatedShape, outputGroupCount );
  }

  /** @override */
  static setAsConstructor( concatenatedShape, outputGroupCount ) {
    super.setAsConstructor();
    ConcatPointwiseConv.setAsConstructor_self.call( this,
      concatenatedShape, outputGroupCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( concatenatedShape, outputGroupCount ) {

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    let concatGather = ConcatGather.Pool.get_or_create_by(
      concatenatedShape, outputGroupCount );

    // Pointwise convolution is convolution 2d with 1 x 1 filter.
    const filterHeight = 1;
    const filterWidth = 1;
    const inDepth = concatGather.shuffleInfo.totalChannelCount;
    const outDepth = concatGather.shuffleInfo.channelCountPerGroup;

    // Every filter is a tensor3d [ filterHeight, filterWidth, inDepth ].
    // All filters composes a tensor4d [ filterHeight, filterWidth, inDepth,
    // outDepth ];
    //
    let filtersShape = Recyclable.Array.Pool.get_or_create_by( 4 );
    filtersShape[ 0 ] = filterHeight;
    filtersShape[ 1 ] = filterWidth;
    filtersShape[ 2 ] = inDepth;
    filtersShape[ 3 ] = outDepth;

    // Build 1x1 convolution filters for channel shuffling. (as an array of
    // tf.tensor4d).
    try {

      this.filtersTensor4dArray = Recyclable.Array.Pool.get_or_create_by(
        concatGather.shuffledChannelIndicesTensor1dArray.length );

      for ( let i = 0;
        i < concatGather.shuffledChannelIndicesTensor1dArray.length; ++i ) {

        let shuffledChannelIndicesTensor1d
          = concatGather.shuffledChannelIndicesTensor1dArray[ i ];

        // filters of one group.
        let filtersTensor2d_int32;
        let filtersTensor2d;
        let filtersTensor2d_transposed;
        try {

          // Generate oneHotIndices (tensor2d, int32) by
          // shuffledChannelIndices (tensor1d).
          filtersTensor2d_int32
            = tf.oneHot( shuffledChannelIndicesTensor1d, inDepth );

          // Generate oneHotIndices (tensor2d, float32).
          //
          // The tf.oneHot() genetates tensor with ( dtype == "int32" ).
          // However, in backend WASM, if tf.conv2d() input tensor
          // ( dtype == "float32" ) and filter tensor ( dtype == "int32" ), the
          // result will be wrong.
          //
          // This issue does not exist in backend CPU and/ WEBGL. For avoiding
          // this problem, convert the filter tensor from ( dtype == "int32" )
          // into ( dtype == "float32" ).
          //
          filtersTensor2d = tf.cast( filtersTensor2d_int32, "float32" );

          // Transpose it so that the last axis is the outDepth (not inDepth)
          // which conforms to the requirement of tf.conv2d()'s filters.
          filtersTensor2d_transposed = filtersTensor2d.transpose();

          // Reinterpret the tensor2d to tensor4d so that it can be used as
          // tf.conv2d()'s filters.
          let filtersTensor4d
            = filtersTensor2d_transposed.reshape( filtersShape );
          {
            this.filtersTensor4dArray[ i ] = filtersTensor4d;
            if ( filtersTensor4d )
              this.tensorWeightCountTotal += filtersTensor4d.size;
          }

        } catch ( e ) {
          throw e;

        } finally {
          if ( filtersTensor2d_int32 )
            filtersTensor2d_int32.dispose();
          if ( filtersTensor2d )
            filtersTensor2d.dispose();
          if ( filtersTensor2d_transposed )
            filtersTensor2d_transposed.dispose();
        }
      }

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

      // (Because ownership has been transferred.)
      concatGather.shuffleInfo = null;

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      filtersShape.disposeResources_and_recycleToPool();
      filtersShape = null;

      // Always release the look up table (by tensor1d).
      concatGather.disposeResources_and_recycleToPool();
      concatGather = null;
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

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeResources_and_recycleToPool();
      this.shuffleInfo = null;
    }

    if ( this.filtersTensor4dArray ) {
      for ( let i = 0; i < this.filtersTensor4dArray.length; ++i ) {
        tf.dispose( this.filtersTensor4dArray[ i ] );
        this.filtersTensor4dArray[ i ] = null;
      }
      this.filtersTensor4dArray.disposeResources_and_recycleToPool();
      this.filtersTensor4dArray = null;
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
      = new Array( this.filtersTensor4dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by pointwise convolution (one operation achieves
      // two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d(
        this.filtersTensor4dArray[ i ], 1, "valid" );
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
