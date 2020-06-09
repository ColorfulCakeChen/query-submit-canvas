import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Implement a block of ShuffleNetV2. It uses 2 output channel groups.
 *
 *
 *
 *
 * @see ChannelShuffler.ConcatGather
 */
class Base {

//   constructor() {
//   }

  /**
   *
   *
   * @param {number[]} concatenatedShape  Used to calculate shuffleInfo.
   * @return {boolean} If failed (e.g. out of GPU memory), return false. Otherwise, return true.
   *
   * @see ChannelShuffler.ConcatGather.init
   */
  init( concatenatedShape ) {

    this.disposeTensors();

    let outputGroupCount = 2;  // Just like ShuffleNetV2, always uses 2 output channel group.
    this.concatGather = new ChannelShuffler.ConcatGather();
    let initOk = this.concatGather.init( concatenatedShape, outputGroupCount );

    try {
      if ( initOk ) {

//        this.shuffleInfo = concatGather.shuffleInfo; // Need the shuffle info.

      }

    } finally {
//      concatGather.disposeTensors(); // Always release the look up table (by tensor1d).
    }

    return initOk;      
  }

  /** Release tf.tensor. */
  disposeTensors() {
    if ( this.concatGather ) {
      this.concatGather.disposeTensors();
      this.concatGather = null;
    }
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
  apply( tensorArray ) {

    // Keep data as local variables for improving performance.

    let lastAxisId = this.concatGather.shuffleInfo.lastAxisId;

    // There are exactly two output channel groups, take them out from array. (for reducing array access cost.)
    let group0_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 0 ];
    let group1_channelIndicesTensor1d = this.concatGather.shuffledChannelIndicesTensor1dArray[ 1 ];

//!!!
    return tf.tidy( "ShuffleNetBlock.Base.apply", () => {
      let concatenatedTensor = tf.concat( tensorArray, lastAxisId );

      // shuffle and split by gather (one operation achieves two operations).
      let group0_tensor = concatenatedTensor.gather( group0_channelIndicesTensor1d, lastAxisId );
      let group1_tensor = concatenatedTensor.gather( group0_channelIndicesTensor1d, lastAxisId );

//!!! ...unfinished...
    });
  }

}
