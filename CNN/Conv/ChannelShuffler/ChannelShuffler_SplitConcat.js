export { SplitConcat };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ShuffleInfo } from "./ChannelShuffler_ShuffleInfo.js";
import { ConcatGather } from "./ChannelShuffler_ConcatGather.js";

/**
 * Implement the channel shuffler by tf.split() and tf.concat().
 *
 * When outputGroupCount is larger (e.g. 8), this may be faster than
 * concat-reshape-transpose-reshape-split and concat-gather.
 *
 * The extra cost is a pre-built channel index look up table (with integers,
 * not tensor1d).
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
 * @member {number[][]} shuffledChannelIndicesArray
 *   The look up table for tf.gather()'s channel index. This table is composed
 * of array of integers.
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
 * @member {function} splitConcat
 *   Concatenate, permute and split the input tensor by split-concat-gather. It
 * is a function pointer to one of this.splitConcat_XXX().
 */
class SplitConcat extends Recyclable.Root {

  /**
   * Used as default ChannelShuffler.SplitConcat provider provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ChannelShuffler.SplitConcatPool",
    SplitConcat, SplitConcat.setAsConstructor );

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
    SplitConcat.setAsConstructor_self.call( this,
      concatenatedShape, outputGroupCount );
  }

  /** @override */
  static setAsConstructor( concatenatedShape, outputGroupCount ) {
    super.setAsConstructor();
    SplitConcat.setAsConstructor_self.call( this,
      concatenatedShape, outputGroupCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( concatenatedShape, outputGroupCount ) {

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    let concatGather = ConcatGather.Pool.get_or_create_by(
      concatenatedShape, outputGroupCount );

    try {
      // Shuffled channel indices (one dimension integers) for SplitConcat()
      this.shuffledChannelIndicesArray
        = Recyclable.Array.Pool.get_or_create_by(
            concatGather.shuffledChannelIndicesTensor1dArray.length );
      for (
        let i = 0;
        i < concatGather.shuffledChannelIndicesTensor1dArray.length;
        ++i ) {

        let shuffledChannelIndicesTensor1d
          = concatGather.shuffledChannelIndicesTensor1dArray[ i ];
        let shuffledChannelIndices
          = shuffledChannelIndicesTensor1d.arraySync(); // Download from GPU memory.

        // Sorting from small to large for improving memory locality (and
        // memory access performance).
        this.shuffledChannelIndicesArray[ i ]
          = shuffledChannelIndices.sort( ( n1, n2 ) => ( n1 - n2 ) );
      }

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.
      concatGather.shuffleInfo = null; // (Because ownership has been transferred.)

      // Shared pre-allocate memory could speed up the process of splitting.
      this.singleChannelTensorArray = Recyclable.Array.Pool.get_or_create_by(
        this.shuffleInfo.totalChannelCount );
      this.tensorArrayForOneGroup = Recyclable.Array.Pool.get_or_create_by(
        this.shuffleInfo.channelCountPerGroup );

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      // Always release the look up table (by tensor1d).
      concatGather.disposeResources_and_recycleToPool();
      concatGather = null;
    }

    this.splitConcat = this.splitConcat_loop;
  }

  /** @override */
  disposeResources() {

    this.splitConcat = null;

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

    this.tensorArrayForOneGroup.length = 0; // Avoid dangling tensors.
    this.tensorArrayForOneGroup.disposeResources_and_recycleToPool();
    this.tensorArrayForOneGroup = null;

    this.singleChannelTensorArray.length = 0; // Avoid dangling tensors.
    this.singleChannelTensorArray.disposeResources_and_recycleToPool();
    this.singleChannelTensorArray = null;

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeResources_and_recycleToPool();
      this.shuffleInfo = null;
    }

    if ( this.shuffledChannelIndicesArray ) {

      for ( let i = 0; i < this.shuffledChannelIndicesArray.length; ++i ) {
        //let shuffledChannelIndices = this.shuffledChannelIndicesArray[ i ];
        this.shuffledChannelIndicesArray[ i ] = null;
      }

      this.shuffledChannelIndicesArray.disposeResources_and_recycleToPool();
      this.shuffledChannelIndicesArray = null;
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
   * Concatenate, permute and split the input tensor by split-concat-gather.
   *
   * @param {tf.tensor[]} tensorArray
   *   An array of tensors to be processed. It should conform to
   * this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as
   * concatenated tensorArray, but their last dimensions are shuffled.
   */
  splitConcat_loop( tensorArray ) {

    // Become local variables for reducing access time.
    let lastAxisId = this.shuffleInfo.lastAxisId;
    let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;

    // Every element will be a single channel tensor3d.

    // Use shared pre-allocate memory for speeding up.
    let singleChannelTensorArray = this.singleChannelTensorArray;
    singleChannelTensorArray.length = 0; // Empty the array.

    // Split every group (a multiple channels tensor3d) into many single
    // channel tensor3d.
    for ( let i = 0; i < tensorArray.length; ++i ) {
      let tensor = tensorArray[ i ];
      singleChannelTensorArray.push(
        ...tensor.split( channelCountPerGroup, lastAxisId ) );
    }

    // An array for many single channel tensor3d of one group.
    //
    // Shared and re-used multiple times to reduce memory re-allocation.
    let tensorArrayForOneGroup = this.tensorArrayForOneGroup;

    // Shuffle (by re-arrange) and concat.
    let resultArray = new Array( this.shuffledChannelIndicesArray.length );
    try {
      for ( let i = 0; i < this.shuffledChannelIndicesArray.length; ++i ) {
        let shuffledChannelIndices = this.shuffledChannelIndicesArray[ i ];

        for ( let j = 0; j < shuffledChannelIndices.length; ++j ) {
          // The shuffledChannelIndices[ j ] is channelIndex.
          tensorArrayForOneGroup[ j ]
            = singleChannelTensorArray[ shuffledChannelIndices[ j ] ];
        }

        resultArray[ i ] = tf.concat( tensorArrayForOneGroup, lastAxisId );
      }

    } finally {
      // Release temporary single channel tensors.
      for ( let i = 0; i < singleChannelTensorArray.length; ++i ) {
        singleChannelTensorArray[ i ].dispose();
      }
    }

    // Although singleChannelTensorArray[] and tensorArrayForOneGroup[] still have tensors, they are disposed tensors and should not be used.

    return resultArray;
  }

}

