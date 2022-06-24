export { ConcatGather };
export { ConcatGatherPool };

import * as Pool from "../../../util/Pool.js";
import { ConcatGather as ChannelShuffler_ConcatGather } from "../ChannelShuffler_ConcatGather.js";

/**
 *
 */
class ConcatGather extends ChannelShuffler_ConcatGather {

  init( concatenatedShape, outputGroupCount ) {
    return super.init( concatenatedShape, outputGroupCount );
  }


  gather_map( concatenatedTensor ) {
    // shuffle and split by gather (one operation achieves two operations).
    return this.shuffledChannelIndicesTensor1dArray.map(
      shuffledChannelIndicesTensor1d =>
        concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
    );
  }


  concatGather_dispose_direct_call_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = this.gather_loop( concatenatedTensor );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_call_map( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_map( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_call_map( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = this.gather_map( concatenatedTensor );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
      for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
        // shuffle and split by gather (one operation achieves two operations).
        shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
      }

      return shuffledSplitedTensorArray;

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_loop( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = new Array( this.shuffledChannelIndicesTensor1dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      // shuffle and split by gather (one operation achieves two operations).
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.gather( this.shuffledChannelIndicesTensor1dArray[ i ], this.shuffleInfo.lastAxisId );
    }

    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_map( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      // shuffle and split by gather (one operation achieves two operations).
      let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
        shuffledChannelIndicesTensor1d =>
          concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
      );
      return shuffledSplitedTensorArray;

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_map( tensorArray ) {
    let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    // shuffle and split by gather (one operation achieves two operations).
    let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
      shuffledChannelIndicesTensor1d =>
        concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
    );

    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_tidy_map( tensorArray ) {
    return tf.tidy( "ChannelShuffler.ConcatGather.concatGather", () => {
      let concatenatedTensor = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

      // shuffle and split by gather (one operation achieves two operations).
      let shuffledSplitedTensorArray = this.shuffledChannelIndicesTensor1dArray.map(
        shuffledChannelIndicesTensor1d =>
          concatenatedTensor.gather( shuffledChannelIndicesTensor1d, this.shuffleInfo.lastAxisId )
      );
      return shuffledSplitedTensorArray;
    });
  }

}


/**
 * Providing ChannelShuffler.PerformanceTest.ConcatGather
 *
 */
class ConcatGatherPool extends Pool.Root {

  constructor() {
    super( "ChannelShuffler.PerformanceTest.ConcatGatherPool", ConcatGather, ConcatGather.setAsConstructor );
  }

}

/**
 * Used as default ChannelShuffler.PerformanceTest.ConcatGather provider.
 */
ConcatGatherPool.Singleton = new ConcatGatherPool();

