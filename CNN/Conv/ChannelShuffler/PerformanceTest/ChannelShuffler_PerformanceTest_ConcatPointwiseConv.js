export { ConcatPointwiseConv };

import * as Pool from "../../../util/Pool.js";
import { ConcatPointwiseConv as ChannelShuffler_ConcatPointwiseConv }
  from "../ChannelShuffler_ConcatPointwiseConv.js";

/**
 *
 */
class ConcatPointwiseConv extends ChannelShuffler_ConcatPointwiseConv {

  /**
   * Used as default ChannelShuffler.PerformanceTest.ConcatPointwiseConv
   * provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "ChannelShuffler.PerformanceTest.ConcatPointwiseConvPool",
    ConcatPointwiseConv, ConcatPointwiseConv.setAsConstructor );

  /**
   */
  constructor( concatenatedShape, outputGroupCount ) {
    super( concatenatedShape, outputGroupCount );
    this.#setAsConstructor_self( concatenatedShape, outputGroupCount );
  }

  /** @override */
  setAsConstructor( concatenatedShape, outputGroupCount ) {
    super.setAsConstructor( concatenatedShape, outputGroupCount );
    this.#setAsConstructor_self( concatenatedShape, outputGroupCount );
  }

  /**  */
  #setAsConstructor_self( concatenatedShape, outputGroupCount ) {
  }

  /** @override */
  disposeResources() {
   super.disposeResources();
  }

  gather_map( concatenatedTensor ) {
    // shuffle and split by pointwise convolution (one operation achieves two
    // operations).
    return this.filtersTensor4dArray.map(
      filtersTensor4d =>
        concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
    );
  }

  concatGather_dispose_direct_call_loop( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = this.gather_loop( concatenatedTensor );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_call_map( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      return this.gather_map( concatenatedTensor );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_call_map( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    let shuffledSplitedTensorArray = this.gather_map( concatenatedTensor );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_loop( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      // shuffle and split by pointwise convolution (one operation achieves two
      // operations).
      let shuffledSplitedTensorArray
        = new Array( this.filtersTensor4dArray.length );
      for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
        shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d(
          this.filtersTensor4dArray[ i ], 1, "valid" );
      }

      return shuffledSplitedTensorArray;

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_loop( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    // shuffle and split by pointwise convolution (one operation achieves two
    // operations).
    let shuffledSplitedTensorArray
      = new Array( this.filtersTensor4dArray.length );
    for ( let i = 0; i < shuffledSplitedTensorArray.length; ++i ) {
      shuffledSplitedTensorArray[ i ] = concatenatedTensor.conv2d(
        this.filtersTensor4dArray[ i ], 1, "valid" );
    }

    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_dispose_finally_map( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    try {
      // shuffle and split by pointwise convolution (one operation achieves two operations).
      return this.filtersTensor4dArray.map(
        filtersTensor4d =>
          concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
      );

    } finally {
      concatenatedTensor.dispose();
    }
  }

  concatGather_dispose_direct_map( tensorArray ) {
    let concatenatedTensor
      = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

    // shuffle and split by pointwise convolution (one operation achieves two
    // operations).
    let shuffledSplitedTensorArray = this.filtersTensor4dArray.map(
      filtersTensor4d =>
        concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
    );
    concatenatedTensor.dispose();

    return shuffledSplitedTensorArray;
  }


  concatGather_tidy_map( tensorArray ) {
    return tf.tidy( "ChannelShuffler.PointwiseConv.concatGather", () => {
      let concatenatedTensor
        = tf.concat( tensorArray, this.shuffleInfo.lastAxisId );

      // shuffle and split by pointwise convolution (one operation achieves two
      // operations).
      return this.filtersTensor4dArray.map(
        filtersTensor4d =>
          concatenatedTensor.conv2d( filtersTensor4d, 1, "valid" )
      );
    });
  }

}
