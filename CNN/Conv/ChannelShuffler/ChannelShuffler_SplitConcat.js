export { SplitConcat };
export { SplitConcatPool };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ShuffleInfo, ShuffleInfoPool } from "./ChannelShuffler_ShuffleInfo.js";
import { ConcatGather, ConcatGatherPool } from "./ChannelShuffler_ConcatGather.js";

/**
 * Implement the channel shuffler by tf.split() and tf.concat().
 *
 * When outputGroupCount is larger (e.g. 8), this may be faster than concat-reshape-transpose-reshape-split and
 * concat-gather.
 *
 * The extra cost is a pre-built channel index look up table (with integers, not tensor1d).
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
 *   The look up table for tf.gather()'s channel index. This table is composed of array of integers.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {function} splitConcat
 *   Concatenate, permute and split the input tensor by split-concat-gather. It is a function pointer to one of
 * this.splitConcat_XXX().
 */
class SplitConcat extends Recyclable.Root {

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
  constructor( concatenatedShape, outputGroupCount, ...restArgs ) {
    super( ...restArgs );
    SplitConcat.setAsConstructor.call( this, concatenatedShape, outputGroupCount );
  }

  /**
   *
   * @param {ShuffleInfo} this
   *   The object to be initialized.
   *
   * @param {number[]} concatenatedShape
   *   Used to calculate shuffleInfo.
   *
   * @param {number} outputGroupCount
   *   Used to calculate shuffleInfo.
   *
   * @exception {Object} If failed (e.g. out of GPU memory).
   *
   * @return {SplitConcat}
   *   Return the this object.
   *
   * @see ConcatGather
   */
  static setAsConstructor( concatenatedShape, outputGroupCount ) {

    this.tensorWeightCountExtracted = 0;
    this.tensorWeightCountTotal = 0;

    let concatGather = ConcatGather.Pool.get_or_create_by( concatenatedShape, outputGroupCount );

    try {
      // Shuffled channel indices (one dimension integers) for SplitConcat()
      this.shuffledChannelIndicesArray = Recyclable.Array.Pool.get_or_create_by( concatGather.shuffledChannelIndicesTensor1dArray.length );
      for ( let i = 0; i < concatGather.shuffledChannelIndicesTensor1dArray.length; ++i ) {
        let shuffledChannelIndicesTensor1d = concatGather.shuffledChannelIndicesTensor1dArray[ i ];
        let shuffledChannelIndices = shuffledChannelIndicesTensor1d.arraySync(); // Download from GPU memory.

        // Sorting from small to large for improving memory locality (and memory access performance).
        this.shuffledChannelIndicesArray[ i ] = shuffledChannelIndices.sort( ( n1, n2 ) => ( n1 - n2 ) );
      }

      this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.
      concatGather.shuffleInfo = null; // (Because ownership has been transferred.)

      // Shared pre-allocate memory could speed up the process of splitting.
      this.singleChannelTensorArray = Recyclable.Array.Pool.get_or_create_by( this.shuffleInfo.totalChannelCount );
      this.tensorArrayForOneGroup = Recyclable.Array.Pool.get_or_create_by( this.shuffleInfo.channelCountPerGroup );

    // Exception if failed (e.g. out of (GPU) memory).
    } catch ( e ) {
      throw e;

    } finally {
      concatGather.disposeResources_and_recycleToPool(); // Always release the look up table (by tensor1d).
      concatGather = null;
    }

    this.splitConcat = this.splitConcat_loop;

    return this;
  }

  /**
   * Release tf.tensor.
   *
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {

    this.splitConcat = null;

    this.tensorWeightCountTotal = 0;
    this.tensorWeightCountExtracted = 0;

//!!! (2022/06/24 Remarked) empty it should be faster.
//    this.tensorArrayForOneGroup.fill( undefined ); // Avoid dangling tensors.
    this.tensorArrayForOneGroup.length = 0; // Avoid dangling tensors.
    this.tensorArrayForOneGroup.disposeResources_and_recycleToPool();
    this.tensorArrayForOneGroup = null;

//!!! (2022/06/24 Remarked) empty it should be faster.
//    this.singleChannelTensorArray.fill( undefined ); // Avoid dangling tensors.
    this.singleChannelTensorArray.length = 0; // Avoid dangling tensors.
    this.singleChannelTensorArray.disposeResources_and_recycleToPool();
    this.singleChannelTensorArray = null;

    if ( this.shuffleInfo ) {
      this.shuffleInfo.disposeResources_and_recycleToPool();
      this.shuffleInfo = null;
    }

    if ( this.shuffledChannelIndicesArray ) {

      for ( let i = 0; i < this.shuffledChannelIndicesArray.length; ++i ) {
        let shuffledChannelIndices = this.shuffledChannelIndicesArray[ i ];

//!!! (2022/06/25 Remarked) Now only Recyclable.Array could be recycled.
//        // Note: This array is generated by tensorflow.js (i.e. not by Pool.Array). Although it could be recycled by Pool.Array,
//        //       however, this could result in more and more array being cumulated (and then out of memory). So do not recycle it.
//        //
//        //Pool.Array.Singleton.recycle( shuffledChannelIndices );

        this.shuffledChannelIndicesArray[ i ] = null;
      }

      this.shuffledChannelIndicesArray.disposeResources_and_recycleToPool();
      this.shuffledChannelIndicesArray = null;
    }

    //super.disposeResources();
  }

//!!! (2022/06/25 Remarked) Inherits from Recyclable.Base instead.
//   /**
//    * After calling this method, this object should be viewed as disposed and should not be operated again.
//    *
//    * Sub-class should override this method for recycling to its pool (and NEVER call super.disposeResources_and_recycleToPool()).
//    */
//   disposeResources_and_recycleToPool() {
//     this.disposeResources();
//     SplitConcatPool.Singleton.recycle( this );
//   }

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
   *   An array of tensors to be processed. It should conform to this.concatenatedShape.
   *
   * @return {tf.tensor[]}
   *   An array of shuffled tensors. Their total channel count is the same as concatenated tensorArray, but their
   * last dimensions are shuffled.
   */
  splitConcat_loop( tensorArray ) {

    // Become local variables for reducing access time.
    let lastAxisId = this.shuffleInfo.lastAxisId;
    let channelCountPerGroup = this.shuffleInfo.channelCountPerGroup;

    // Every element will be a single channel tensor3d.
    let singleChannelTensorArray = this.singleChannelTensorArray; // Use shared pre-allocate memory for speeding up.
    singleChannelTensorArray.length = 0; // Empty the array.

    // Split every group (a multiple channels tensor3d) into many single channel tensor3d.
    for ( let i = 0; i < tensorArray.length; ++i ) {
      let tensor = tensorArray[ i ];
      singleChannelTensorArray.push( ...tensor.split( channelCountPerGroup, lastAxisId ) );
    }

    // An array for many single channel tensor3d of one group.
    //
    // Shared and re-used multiple times to reduce memory re-allocation.
    let tensorArrayForOneGroup = this.tensorArrayForOneGroup;

    // Shuffle (by re-arrange) and concat.
    let resultArray = new Array( this.shuffledChannelIndicesArray.length );
    for ( let i = 0; i < this.shuffledChannelIndicesArray.length; ++i ) {
      let shuffledChannelIndices = this.shuffledChannelIndicesArray[ i ];

      for ( let j = 0; j < shuffledChannelIndices.length; ++j ) {
        tensorArrayForOneGroup[ j ] = singleChannelTensorArray[ shuffledChannelIndices[ j ] ]; // The shuffledChannelIndices[ j ] is channelIndex.
      }

      resultArray[ i ] = tf.concat( tensorArrayForOneGroup, lastAxisId );
    }

    // Release temporary single channel tensors.
    for ( let i = 0; i < singleChannelTensorArray.length; ++i ) {
      singleChannelTensorArray[ i ].dispose();
    }

    // Although singleChannelTensorArray[] and tensorArrayForOneGroup[] still have tensors, they are disposed tensors and should not be used.

    return resultArray;
  }

}


/**
 * Providing ChannelShuffler.SplitConcat
 *
 */
class SplitConcatPool extends Pool.Root {

  constructor() {
    super( "ChannelShuffler.SplitConcatPool", SplitConcat, SplitConcat.setAsConstructor );
  }

}


/**
 * Used as default ChannelShuffler.SplitConcat provider provider for conforming to Recyclable interface.
 */
SplitConcat.Pool = new SplitConcatPool();

