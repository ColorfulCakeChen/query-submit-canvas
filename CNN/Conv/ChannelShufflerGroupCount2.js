export { Base };

//import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * A special channel shuffler for ( outputGroupCount == 2 ). Its pfnConcatShuffleSplitShuffleSplit() does not use loop and not create new array.
 * So its performance should be better.

//!!! ...unfinished... (2021/08/20)

 *   - Concatenate two tensor3d ( height x width x channel ) always along the last axis (i.e. axisId = 2, along the channel axis).
 *   - Shuffle. (may not exist.)
 *   - Split. (may not exist.)
 *
 * It could destroy one or two of the input tensors.
 *
 *
 * @member {ChannelShuffler.ConcatPointwiseConv} channelShuffler
 *   It must be implemented by ChannelShuffler.ConcatPointwiseConv with ( outputGroupCount == 2 ). It will not be disposed by
 * this object (i.e. it is supposed to be shared with outter callers).
 *
 *     - The channelShuffler.filtersTensor4dArray[ 0 ] and channelShuffler.filtersTensor4dArray[ 1 ] will be used from channel
 *         shuffling and splitting.
 *
 *     - The channelShuffler.shuffleInfo.totalChannelCount should be the same as the channel count of the concatenated
 *         inputTensorsArray[].
 *
 * @member {boolean} bShuffleSplit
 *   If false, there will be no channel shuffling and not splitting after concatenation.
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after concatenating. If true, the first input tensor will be kept after concatenating.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after concatenating. If true, the second input tensor will be kept after concatenating.
 *

//!!! ...unfinished... (2021/08/20)

 * @member {function} pfnConcatShuffleSplit
 *   This is a method. It has two parameters inputTensors[] and outputTensors[]. The inputTensors[] (tf.tensor3d[]) represents
 * all the images ( height x width x channel ) which will be concatenated, shuffle, split. They should have the same ( height x width )
 * but could have different channel count. The outputTensors[] (tf.tensor3d[]) represents the result The inputTensor may or may
 * not be disposed. In fact, this method calls one of ConcatShuffleSplit_and_keep0_keep1(), ConcatShuffleSplit_and_keep0_destroy1(),
 * ConcatShuffleSplit_and_destroy0_keep1(), ConcatShuffleSplit_and_destroy0_destroy1() according to the parameters.
 *
 */
class Base {

  /**
   *
   */
  constructor( channelShuffler, bShuffleSplit, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.channelShuffler = channelShuffler;
    this.setShuffleSplit_KeepInputTensor( bShuffleSplit, bKeepInputTensor0, bKeepInputTensor1 );
  }

  disposeTensors() {
//!!! ...unfinished... (2021/08/19)
  }

  /**
   * Adjust this.pfnConcatShuffleSplit so that this.pfnConcatShuffleSplit() will or will not dispose its inputTensors.
   */
  setShuffleSplit( bShuffleSplit ) {
    this.bShuffleSplit = bShuffleSplit;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /**
   * Adjust this.pfnConcatShuffleSplit so that this.pfnConcatShuffleSplit() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /**
   * Adjust this.pfnConcatShuffleSplit so that this.pfnConcatShuffleSplit() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /**
   * Adjust this.pfnConcatShuffleSplit so that this.pfnConcatShuffleSplit() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /** Set this.bShuffleSplit, this.bKeepInputTensor0, this.bKeepInputTensor1, and then adjust this.pfnConcatShuffleSplit. */
  setShuffleSplit_KeepInputTensor( bShuffleSplit, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bShuffleSplit = bShuffleSplit;
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /** Set this.pfnConcatShuffleSplit according to this.bShuffleSplit, this.channelShuffler, this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfnConcatShuffleSplit() {

    // 1.
    if ( ( this.bShuffleSplit ) && ( this.channelShuffler ) ) {
      this.pfnShuffleSplit = Base.ShuffleSplit_do; // Want and could do channel shuffling and splitting.
    } else {
      this.pfnShuffleSplit = Base.ShuffleSplit_return_input_directly;
    }

    // 2.
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.pfnConcatShuffleSplit = Base.ConcatShuffleSplit_and_keep0_keep1;
      } else {
        this.pfnConcatShuffleSplit = Base.ConcatShuffleSplit_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.pfnConcatShuffleSplit = Base.ConcatShuffleSplit_and_destroy0_keep1;
      } else {
        this.pfnConcatShuffleSplit = Base.ConcatShuffleSplit_and_destroy0_destroy1;
      }
    }
  }

  /**
   *
   * @param {tf.tensor3d} inputTensor
   *   The tensor to be shuffled and splitted.
   *
   * @param {tf.tensor3d[]} outputTensors
   *   An array for returning the result (output) tensors.
   */
  static ShuffleSplit_do( inputTensor, outputTensors ) {

    // Since there is only two output group (i.e. ( outputGroupCount == 2 ) ), do not use loop (i.e. use unrolled-loop)
    // so the performance could be better a little.
    outputTensors[ 0 ] = tf.conv2d( inputTensor, this.channelShuffler.filtersTensor4dArray[ 0 ], 1, "valid" );
    outputTensors[ 1 ] = tf.conv2d( inputTensor, this.channelShuffler.filtersTensor4dArray[ 1 ], 1, "valid" );

    // Always destroy input. Because tf.concat() has always been done before this method is called, the keep-input has already bee
    // done by it.
    inputTensor.dispose();
  }

  /** Just return inputTensor at outputTensors[ 0 ] ( outputTensors[ 1 ] will be null). */
  static ShuffleSplit_return_input_directly( inputTensor, outputTensors ) {
    outputTensors[ 0 ] = inputTensor;
    outputTensors[ 1 ] = null;

    // Do not call inputTensor.dispose(). In fact, because inputTensor is returned directly, it is the same as been disposed already.
  }


  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will not be disposed.
   *
   *
   *
   *
   * @param {tf.tensor3d[]} inputTensors
   *   An array of tensors. The inputTensors[ 0 ] and inputTensors[ 1 ] should exist.
   *
   * @param {tf.tensor3d[]} outputTensors
   *   An array for returning the result (output) tensors.
   */
  static ConcatShuffleSplit_and_keep0_keep1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    this.pfnShuffleSplit( t0, outputTensors );
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will not be disposed. The inputTensorsArray[ 1 ] will be disposed. */
  static ConcatShuffleSplit_and_keep0_destroy1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 1 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will be disposed. The inputTensorsArray[ 1 ] will not be disposed. */
  static ConcatShuffleSplit_and_destroy0_keep1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 0 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will be disposed. */
  static ConcatShuffleSplit_and_destroy0_destroy1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 0 ].dispose();
    inputTensors[ 1 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

}
