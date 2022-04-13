export { Base };

//import * as FloatValue from "../Unpacker/FloatValue.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Concatenate two tensor3d along depth (i.e. axis id 2) and then channel shuffling and splitting.
 *
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
 *     - The channelShuffler.shuffleInfo.totalChannelCount should be the same as the channel count of the concatenated
 *         inputTensors[].
 *
 *     - The channelShuffler.filtersTensor4dArray[ 0 ] and channelShuffler.filtersTensor4dArray[ 1 ] will be used for
 *         channel shuffling and splitting.
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
 * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
 *   The element value bounds (per channel) of this concatenation operation's input0. It will be kept (not cloned) directly. So caller
 * should not modify them.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
 *   The element value bounds (per channel) of this concatenation operation's input1. It will be kept (not cloned) directly. So caller
 * should not modify them.
 *
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this concatenation operation.
 *
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
  constructor(
    channelShuffler, bShuffleSplit = true, bKeepInputTensor0, bKeepInputTensor1,
    inputScaleBoundsArray0, inputScaleBoundsArray1 ) {

    this.channelShuffler = channelShuffler;
    this.setShuffleSplit_KeepInputTensor( bShuffleSplit, bKeepInputTensor0, bKeepInputTensor1 );
    Base.setup_BoundsArraySetArray.call( this, inputScaleBoundsArray0, inputScaleBoundsArray1 );
  }

  /**
   * Set this.bShuffleSplit and adjust this.pfnShuffleSplit.
   */
  setShuffleSplit( bShuffleSplit ) {
    this.bShuffleSplit = bShuffleSplit;
    Base.adjust_pfnShuffleSplit.call( this );
  }

  /**
   * Set this.bKeepInputTensor0 and adjust this.pfnConcatShuffleSplit so that inputTensors[ 0 ] will or will not be disposed.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /**
   * Set this.bKeepInputTensor1 and adjust this.pfnConcatShuffleSplit so that inputTensors[ 1 ] will or will not be disposed.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /**
   * Set this.bKeepInputTensor0 and this.bKeepInputTensor1, and adjust this.pfnConcatShuffleSplit so that inputTensors[ 0 ]
   * and inputTensors[ 1 ] will or will not be disposed.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /** 
   * Set this.bShuffleSplit, this.bKeepInputTensor0, this.bKeepInputTensor1, and then adjust this.pfnShuffleSplit and
   * this.pfnConcatShuffleSplit.
   */
  setShuffleSplit_KeepInputTensor( bShuffleSplit, bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bShuffleSplit = bShuffleSplit;
    Base.adjust_pfnShuffleSplit.call( this );

    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcatShuffleSplit.call( this );
  }

  /** Set this.pfnShuffleSplit according to this.bShuffleSplit, this.channelShuffler. */
  static adjust_pfnShuffleSplit() {
    if ( ( this.bShuffleSplit ) && ( this.channelShuffler ) ) {

      tf.util.assert( ( this.channelShuffler instanceof ChannelShuffler.ConcatPointwiseConv ),
        `ConcatShuffleSplit.Base.adjust_pfnShuffleSplit(): `
          + `channelShuffler must be an instance of class ChannelShuffler.ConcatPointwiseConv.`
      );

      this.pfnShuffleSplit = Base.ShuffleSplit_do; // Want and could do channel shuffling and splitting.
    } else {
      this.pfnShuffleSplit = Base.ShuffleSplit_return_input_directly;
    }
  }

  /** Set this.pfnConcatShuffleSplit according to this.bShuffleSplit, this.channelShuffler, this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfnConcatShuffleSplit() {
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

  /** Create this.boundsArraySet. */
  static setup_BoundsArraySet( inputScaleBoundsArray0, inputScaleBoundsArray1 ) {

    // Concatenated value bounds array set.
    let concatBoundsArraySet;
    {
      concatBoundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, inputScaleBoundsArray1,
        1 // Arbitrarily set a legal (but temporary) outputChannelCount0. It will be adjusted later.
      );

      concatBoundsArraySet.set_outputs_all_by_concat_input0_input1(); // The outputChannelCount0 will be adjusted.
    }

    if ( ( this.bShuffleSplit ) && ( this.channelShuffler ) ) { // Want and could do channel shuffling and splitting.

      tf.util.assert( ( this.channelShuffler.outputGroupCount == 2 ),
        `ConcatShuffleSplit.Base.setup_BoundsArraySet(): `
          + `channelShuffler.outputGroupCount ( ${this.channelShuffler.outputGroupCount} ) must be 2 `
          + `( other outputGroupCount does not supperted ).`
      );

      // Shuffled value bounds array set.
      let shuffledBoundsArraySet;
      {
        shuffledBoundsArraySet = new BoundsArraySet.InputsOutputs( concatBoundsArraySet.output0, null,
          concatBoundsArraySet.output0.channelCount );

        let arrayTemp = new Array( concatBoundsArraySet.output0.channelCount );
        shuffledBoundsArraySet.set_outputs_all_byInterleave_asGrouptTwo( arrayTemp );
      }

      // Splitted value bounds array set.
      let splittedBoundsArraySet;
      {
        splittedBoundsArraySet = new BoundsArraySet.InputsOutputs( shuffledBoundsArraySet.output0, null,
          1, 1  // Arbitrarily set a legal (but temporary) outputChannelCount0 and outputChannelCount1. It will be adjusted later.
        );

        splittedBoundsArraySet.set_outputs_all_byBoundsArray_split_input0();
      }

      this.boundsArraySet = splittedBoundsArraySet;

    } else { // Only concatenation is needed.
      this.boundsArraySet = concatBoundsArraySet;
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


  /** Concatenate along axis id 2. (Both the inputTensors[ 0 ] and inputTensors[ 1 ] will not be disposed.
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

  /** Concatenate along axis id 2. (The inputTensors[ 0 ] will not be disposed. The inputTensors[ 1 ] will be disposed. */
  static ConcatShuffleSplit_and_keep0_destroy1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 1 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

  /** Concatenate along axis id 2. (The inputTensors[ 0 ] will be disposed. The inputTensors[ 1 ] will not be disposed. */
  static ConcatShuffleSplit_and_destroy0_keep1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 0 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

  /** Concatenate along axis id 2. (Both the inputTensors[ 0 ] and inputTensors[ 1 ] will be disposed. */
  static ConcatShuffleSplit_and_destroy0_destroy1( inputTensors, outputTensors ) {
    let t0 = tf.concat( inputTensors, 2 ); // AxisId = 2
    inputTensors[ 0 ].dispose();
    inputTensors[ 1 ].dispose();

    this.pfnShuffleSplit( t0, outputTensors );
  }

}
