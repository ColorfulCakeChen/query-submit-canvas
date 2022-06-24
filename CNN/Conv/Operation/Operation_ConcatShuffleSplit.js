export { ConcatShuffleSplit };
export { ConcatShuffleSplitPool };

import * as Pool from "../../util/Pool.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import { Root } from "./Operation_Base.js";

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
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor and this.input1.realTensor as inputTensors. It puts to this.output0.realTensor
 * as outputTensor. Both inputTensors are tf.tensor3d and represents an images ( height x width x channel ) which will be concatenated,
 * shuffle, split. They should have the same ( height x width ) but could have different channel count. The outputTensor (tf.tensor3d)
 * represents the result. The inputTensor may or may not be disposed. In fact, this method calls one of ConcatShuffleSplit_and_keep0_keep1(),
 * ConcatShuffleSplit_and_keep0_destroy1(), ConcatShuffleSplit_and_destroy0_keep1(), ConcatShuffleSplit_and_destroy0_destroy1() according
 * to the parameters.
 *
 */
class ConcatShuffleSplit extends Root {

  /**
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   */
  constructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    channelShuffler, bShuffleSplit = true,
    arrayTemp_forInterleave_asGrouptTwo,
    bKeepInputTensor0, bKeepInputTensor1
  ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0 ); // .outputX will be created later.

    ConcatShuffleSplit.setAsConstructor.call( this,
      inputTensorPlaceholder0, inputTensorPlaceholder1,
      channelShuffler, bShuffleSplit,
      arrayTemp_forInterleave_asGrouptTwo,
      bKeepInputTensor0, bKeepInputTensor1
    );
  }

  /**
   * @param {TwinArray} this
   *   The object to be initialized.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {ConcatShuffleSplit}
   *   Return the this object.
   */
  static setAsConstructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    channelShuffler, bShuffleSplit = true,
    arrayTemp_forInterleave_asGrouptTwo,
    bKeepInputTensor0, bKeepInputTensor1
  ) {

    let bShouldShuffleSplit = ( ( bShuffleSplit ) && ( channelShuffler ) ); // Want and could do channel shuffling and splitting.

    let outputTensorCount;
    if ( bShouldShuffleSplit )
      outputTensorCount = 2; // Only if splitting is required (and possible), the output1 does exist.
    else
      outputTensorCount = 1;

    super.setAsConstructor.call( this, inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );

    this.channelShuffler = channelShuffler;

    // Note: If bShuffleSplit is changed, the BoundsArraySet and outputs' TensorPlacehoder will also be changed.
    //       Then the inputScaleBoundsArray0, inputScaleBoundsArray1, arrayTemp_forInterleave_asGrouptTwo will be
    //       required again. That is difficult. So forbid to change bShuffleSplit.
    //
    this.bShuffleSplit = bShuffleSplit;
    this.bShouldShuffleSplit = bShouldShuffleSplit;

    this.inputTensors = Pool.Array.Singleton.get_or_create_by( 2 ); // For reducing memory re-allocation to improve performance.

    ConcatShuffleSplit.adjust_pfn.call( this );
    ConcatShuffleSplit.setup_BoundsArraySet.call( this, arrayTemp_forInterleave_asGrouptTwo );
    ConcatShuffleSplit.setup_outputs_TensorPlaceholder.call( this );

    this.setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 );
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    if ( this.inputTensors ) {
      for ( let i = 0; i < this.inputTensors.length; ++i ) {
        this.inputTensors[ i ] = null;
      }
      Pool.Array.Singleton.recycle( this.inputTensors );
      this.inputTensors = null;
    }
    super.disposeResources();
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    ConcatShuffleSplitPool.Singleton.recycle( this );
  }

  /**
   * Set this.bKeepInputTensor0 and adjust this.apply so that inputTensors[ 0 ] will or will not be disposed.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    ConcatShuffleSplit.adjust_apply.call( this );
  }

  /**
   * Set this.bKeepInputTensor1 and adjust this.apply so that inputTensors[ 1 ] will or will not be disposed.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    ConcatShuffleSplit.adjust_apply.call( this );
  }

  /**
   * Set this.bKeepInputTensor0 and this.bKeepInputTensor1, and adjust this.apply so that inputTensors[ 0 ]
   * and inputTensors[ 1 ] will or will not be disposed.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    ConcatShuffleSplit.adjust_apply.call( this );
  }


  /** Set this.pfnShuffleSplit according to this.bShuffleSplit, this.channelShuffler. */
  static adjust_pfn() {
    if ( this.bShouldShuffleSplit ) {

      if ( !( this.channelShuffler instanceof ChannelShuffler.ConcatPointwiseConv ) )
        throw Error( `Operation.ConcatShuffleSplit.adjust_pfn(): `
          + `channelShuffler must be an instance of class ChannelShuffler.ConcatPointwiseConv.`
        );

      this.pfnShuffleSplit = ConcatShuffleSplit.ShuffleSplit_do; // Want and could do channel shuffling and splitting.
    } else {
      this.pfnShuffleSplit = ConcatShuffleSplit.ShuffleSplit_return_input_directly;
    }
  }

  /** Set this.apply according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_apply() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.apply = ConcatShuffleSplit.ConcatShuffleSplit_and_keep0_keep1;
      } else {
        this.apply = ConcatShuffleSplit.ConcatShuffleSplit_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.apply = ConcatShuffleSplit.ConcatShuffleSplit_and_destroy0_keep1;
      } else {
        this.apply = ConcatShuffleSplit.ConcatShuffleSplit_and_destroy0_destroy1;
      }
    }
  }

  /** Create this.boundsArraySet. */
  static setup_BoundsArraySet( arrayTemp_forInterleave_asGrouptTwo ) {

    this.boundsArraySet = BoundsArraySet.InputsOutputsPool.Singleton.sessionCall( () => {

      let inputScaleBoundsArray0 = this.input0.scaleBoundsArray;
      let inputScaleBoundsArray1 = this.input1.scaleBoundsArray;

      // Concatenated value bounds array set.
      let concatBoundsArraySet;
      {
        concatBoundsArraySet = BoundsArraySet.InputsOutputsPool.Singleton.get_or_create_by( inputScaleBoundsArray0, inputScaleBoundsArray1,
          1 // Arbitrarily set a legal (but temporary) outputChannelCount0. It will be adjusted later.
        );

        concatBoundsArraySet.set_outputs_all_by_concat_input0_input1(); // The outputChannelCount0 will be adjusted.
      }

      if ( this.bShouldShuffleSplit ) { // Want and could do channel shuffling and splitting.

        if ( this.channelShuffler.outputGroupCount != 2 )
          throw Error( `Operation.ConcatShuffleSplit.setup_BoundsArraySet(): `
            + `channelShuffler.outputGroupCount ( ${this.channelShuffler.outputGroupCount} ) must be 2 `
            + `( other outputGroupCount does not supperted ).`
          );

        // Shuffled value bounds array set.
        let shuffledBoundsArraySet;
        {
          shuffledBoundsArraySet = BoundsArraySet.InputsOutputsPool.Singleton.get_or_create_by( concatBoundsArraySet.output0, null,
            concatBoundsArraySet.output0.channelCount );

          shuffledBoundsArraySet.output0.set_all_byScaleBoundsArray( concatBoundsArraySet.output0 );
          shuffledBoundsArraySet.set_outputs_all_byInterleave_asGrouptTwo( arrayTemp_forInterleave_asGrouptTwo );
        }

        // Splitted value bounds array set.
        let splittedBoundsArraySet;
        {
          splittedBoundsArraySet = BoundsArraySet.InputsOutputsPool.Singleton.get_or_create_by( shuffledBoundsArraySet.output0, null,
            1, 1  // Arbitrarily set a legal (but temporary) outputChannelCount0 and outputChannelCount1. It will be adjusted later.
          );

          splittedBoundsArraySet.set_outputs_all_byBoundsArray_split_input0();
        }

        return splittedBoundsArraySet;

      } else { // Only concatenation is needed.
        return concatBoundsArraySet;
      }

    } );
  }

  /** Setup this.output0 and this.output1.
   * This method should be called after setup_BoundsArraySet() because it uses BoundsArrarySet.
   */  
  static setup_outputs_TensorPlaceholder() {

    // 0.

    // 0.1 Determine output0.height
    if ( this.input0.height != undefined ) {
      if ( this.input1.height != undefined ) {

        // If both inputs' height are known, they should be the same.
        if ( this.input0.height != this.input1.height )
          throw Error( `Operation.ConcatShuffleSplit.setup_outputs_TensorPlaceholder(): `
            + `input0.height ( ${this.input0.height} ) and input1.height ( ${this.input1.height} ) should be the same.`
          );

        this.output0.height = this.input0.height;
      } else {
        this.output0.height = this.input0.height;
      }
    } else {
      if ( this.input1.height != undefined ) {
        this.output0.height = this.input1.height;
      } else {
        this.output0.height = undefined;
      }
    }

    // 0.2 Determine output0.width
    if ( this.input0.width != undefined ) {
      if ( this.input1.width != undefined ) {

        // If both inputs' width are known, they should be the same.
        if ( this.input0.width != this.input1.width )
          throw Error( `Operation.ConcatShuffleSplit.setup_outputs_TensorPlaceholder(): `
            + `input0.width ( ${this.input0.width} ) and input1.width ( ${this.input1.width} ) should be the same.`
          );

        this.output0.width = this.input0.width;
      } else {
        this.output0.width = this.input0.width;
      }
    } else {
      if ( this.input1.height != undefined ) {
        this.output0.width = this.input1.width;
      } else {
        this.output0.width = undefined;
      }
    }

    // 1. 
    this.output0.channelCount_lowerHalf = undefined;  // Note: After concatenation operation, the half channel information are always lost.
    this.output0.channelCount_higherHalf = undefined;
    this.output0.scaleBoundsArray = this.boundsArraySet.output0;

    // 2.
    if ( this.bShouldShuffleSplit ) { // Only if splitting is required, the output1 does exist.
      this.output1.height = this.output0.height;
      this.output1.width = this.output0.width;

      // Because only tensor3d and ChannelShuffler.ConcatPointwiseConv and ( outputGroupCount == 2 ) are supported,
      // using the pointwise convolution filters' shape for output channel count.
      const outputChannelCount_filterAxisId = 3;
      this.output0.channelCount = this.channelShuffler.filtersTensor4dArray[ 0 ].shape[ outputChannelCount_filterAxisId ];
      this.output1.channelCount = this.channelShuffler.filtersTensor4dArray[ 1 ].shape[ outputChannelCount_filterAxisId ];

      this.output1.channelCount_lowerHalf = undefined;  // Note: After concatenation operation, the half channel information are always lost.
      this.output1.channelCount_higherHalf = undefined;

      this.output1.scaleBoundsArray = this.boundsArraySet.output1;

    } else { // Only concatenation.
      this.output0.channelCount = this.input0.channelCount + this.input1.channelCount;
    }

    // 3. Release for reducing memory usage. (Since it has been inside the output tensor placeholder.)
    {
      this.boundsArraySet.output0 = null; // Because it has already been transferred to TensorPlaceholder this.output0
      this.boundsArraySet.output1 = null;
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }
  }


  /**
   * Outputs are placed in this.output0.realTensor and this.output1.realTensor directly.
   *
   * @param {tf.tensor3d} inputTensor
   *   The tensor to be shuffled and splitted.
   */
  static ShuffleSplit_do( inputTensor ) {

    // Since there is only two output group (i.e. ( outputGroupCount == 2 ) ), do not use loop (i.e. use unrolled-loop)
    // so the performance could be better a little.
    this.output0.realTensor = tf.conv2d( inputTensor, this.channelShuffler.filtersTensor4dArray[ 0 ], 1, "valid" );
    this.output1.realTensor = tf.conv2d( inputTensor, this.channelShuffler.filtersTensor4dArray[ 1 ], 1, "valid" );

    // Always destroy input. Because tf.concat() has always been done before this method is called, the keep-input has already be
    // done by it.
    inputTensor.dispose();
  }

  /** Just return inputTensor at this.output0.realTensor. */
  static ShuffleSplit_return_input_directly( inputTensor ) {
    this.output0.realTensor = inputTensor;

    // Do not call inputTensor.dispose(). In fact, because inputTensor is returned directly, it is the same as been disposed already.
  }


  /** Concatenate along axis id 2. (Both the input0 and input1 will not be disposed.) */
  static ConcatShuffleSplit_and_keep0_keep1( inputTensors, outputTensors ) {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    let t0 = tf.concat( this.inputTensors, 2 ); // AxisId = 2

    this.pfnShuffleSplit( t0 );
  }

  /** Concatenate along axis id 2. (The input0 will not be disposed. The input1 will be disposed.) */
  static ConcatShuffleSplit_and_keep0_destroy1( inputTensors, outputTensors ) {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    let t0 = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input1.realTensor.dispose();

    this.pfnShuffleSplit( t0 );
  }

  /** Concatenate along axis id 2. (The input0 will be disposed. The input1 will not be disposed.) */
  static ConcatShuffleSplit_and_destroy0_keep1( inputTensors, outputTensors ) {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    let t0 = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input0.realTensor.dispose();

    this.pfnShuffleSplit( t0 );
  }

  /** Concatenate along axis id 2. (Both the input0 and input1 will be disposed.) */
  static ConcatShuffleSplit_and_destroy0_destroy1( inputTensors, outputTensors ) {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    let t0 = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input0.realTensor.dispose();
    this.input1.realTensor.dispose();

    this.pfnShuffleSplit( t0 );
  }

}


/**
 * Providing Operation.ConcatShuffleSplit
 *
 */
class ConcatShuffleSplitPool extends Pool.Root {

  constructor() {
    super( "Operation.ConcatShuffleSplitPool", ConcatShuffleSplit, ConcatShuffleSplit.setAsConstructor );
  }

}

/**
 * Used as default Operation.ConcatShuffleSplit provider.
 */
ConcatShuffleSplitPool.Singleton = new ConcatShuffleSplitPool();

