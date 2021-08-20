export { Base };

import * as ChannelShuffler from "./ChannelShuffler.js";

//!!! ...unfinished... (2021/08/20) setConcatOnly() ?

/**
 * A special channel shuffler for ( outputGroupCount == 2 ). Its pfnConcatShuffleSplit() does not use loop and not create new array.
 * So its performance should be better.

//!!! ...unfinished... (2021/08/20)

 *   - Concatenate two tensor3d ( height x width x channel ) always along the last axis (i.e. axisId = 2, along the channel axis).
 *   - Shuffle. (may not exist.)
 *   - Split. (may not exist.)
 *
 * It could destroy one or two of the input tensors.
 *
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after concatenating. If true, the first input tensor will be kept after concatenating.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after concatenating. If true, the second input tensor will be kept after concatenating.
 *
 * @member {function} pfnConcatShuffleSplit
 *   This is a method. It has two parameters inputTensors[] and outputTensors[]. The inputTensors[] (tf.tensor3d[]) represents
 * all the images ( height x width x channel ) which will be concatenated, shuffle, split. They should have the same ( height x width )
 * but could have different channel count. The outputTensors[] (tf.tensor3d[]) represents the result The inputTensor may or may
 * not be disposed. In fact, this method calls one of

//!!! ...unfinished... (2021/08/20)

 * Concat_and_keep0_keep1(), Concat_and_keep0_destroy1(), Concat_and_destroy0_keep1(), Concat_and_destroy0_destroy1() according
 * to the parameters.
 *
 */
class Base {

  /**
   *
   * @see ChannelShuffler.ShuffleInfo
   */
  constructor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcat.call( this );

//!!! ...unfinished... (2021/08/19)
    let concatenatedShape = [ ];
    let outputGroupCount = 2;

    ChannelShuffler.ConcatPointwiseConv( 
//!!! ...unfinished... (2021/08/19)

  }

  disposeTensors() {
//!!! ...unfinished... (2021/08/19)
  }

  /**
   * Adjust this.pfnConcat so that this.pfnConcat() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfnConcat.call( this );
  }

  /**
   * Adjust this.pfnConcat so that this.pfnConcat() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcat.call( this );
  }

  /**
   * Adjust this.pfnConcat so that this.pfnConcat() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcat.call( this );
  }

  /** Set this.pfnConcat according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfnConcat() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.pfnConcat = Base.Concat_and_keep0_keep1;
      } else {
        this.pfnConcat = Base.Concat_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.pfnConcat = Base.Concat_and_destroy0_keep1;
      } else {
        this.pfnConcat = Base.Concat_and_destroy0_destroy1;
      }
    }
  }

  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will not be disposed. */
  static Concat_and_keep0_keep1( inputTensorsArray ) {
    return tf.concat( inputTensorsArray, 2 ); // AxisId = 2
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will not be disposed. The inputTensorsArray[ 1 ] will be disposed. */
  static Concat_and_keep0_destroy1( inputTensorsArray ) {
    let t = tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    inputTensorsArray[ 1 ].dispose();
    return t;
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will be disposed. The inputTensorsArray[ 1 ] will not be disposed. */
  static Concat_and_destroy0_keep1( inputTensorsArray ) {
    let t = tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    inputTensorsArray[ 0 ].dispose();
    return t;
  }

  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will be disposed. */
  static Concat_and_destroy0_destroy1( inputTensorsArray ) {
    let t = tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    inputTensorsArray[ 0 ].dispose();
    inputTensorsArray[ 1 ].dispose();
    return t;
  }

//!!! ...unfinished... (2021/08/19) Use outputTensors[] instead of new created array as return value (for improving performance).
  apply( inputTensors, outputTensors ) {
// Since ( outputGroupCount == 2 ), use optimized (loop-unrolled).
  }

}
