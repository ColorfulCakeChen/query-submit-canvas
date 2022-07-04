export { ConcatAlongAxisId2 };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { Root } from "./Operation_Base.js";

/**
 * Concatenate two tensor3d ( height x width x channel ) always along the last axis (i.e. axisId = 2, along the channel axis). It could
 * destroy one or two of the input tensors.
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after concatenating. If true, the first input tensor will be kept after concatenating.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after concatenating. If true, the second input tensor will be kept after concatenating.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor and this.input1.realTensor as inputTensors. It puts to this.output0.realTensor
 * as outputTensor. Both inputTensors are tf.tensor3d and represents an images ( height x width x channel ) which will be concatenated.
 * They should have the same ( height x width ) but could have different channel count. The outputTensor (tf.tensor3d) represents
 * the result of concatenating the inputs along the last axis (i.e. the channel axis ( axisId = 2 ) ). The inputTensor may or may not
 * be disposed. In fact, this method calls one of Concat_and_keep0_keep1(), Concat_and_keep0_destroy1(), Concat_and_destroy0_keep1(),
 * Concat_and_destroy0_destroy1()
 * according to the parameters.
 *
 */
class ConcatAlongAxisId2 extends Root {

  /**
   * Used as default Operation.ConcatAlongAxisId2 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Operation.ConcatAlongAxisId2.Pool", ConcatAlongAxisId2, ConcatAlongAxisId2.setAsConstructor );

  /**
   */
  constructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );
    ConcatAlongAxisId2.setAsConstructor_self.call(
      this, inputTensorPlaceholder0, inputTensorPlaceholder1, bKeepInputTensor0, bKeepInputTensor1 );
  }

  /** @override */
  static setAsConstructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {
    super.setAsConstructor( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );
    ConcatAlongAxisId2.setAsConstructor_self.call(
      this, inputTensorPlaceholder0, inputTensorPlaceholder1, bKeepInputTensor0, bKeepInputTensor1 );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;

    this.inputTensors = Recyclable.Array.Pool.get_or_create_by( 2 ); // For reducing memory re-allocation.

    ConcatAlongAxisId2.adjust_pfn.call( this );
    ConcatAlongAxisId2.setup_BoundsArraySet.call( this );
    ConcatAlongAxisId2.setup_output0_TensorPlaceholder.call( this );
  }

  /** @override */
  disposeResources() {

    if ( this.boundsArraySet ) {
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }

    if ( this.inputTensors ) {
      this.inputTensors.lentth = 0; // Clear the dangling tensors.
      this.inputTensors.disposeResources_and_recycleToPool();
      this.inputTensors = null;
    }

    super.disposeResources();
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    ConcatAlongAxisId2.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    ConcatAlongAxisId2.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    ConcatAlongAxisId2.adjust_pfn.call( this );
  }


  /** Set this.apply according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfn() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.apply = ConcatAlongAxisId2.Concat_and_keep0_keep1;
      } else {
        this.apply = ConcatAlongAxisId2.Concat_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.apply = ConcatAlongAxisId2.Concat_and_destroy0_keep1;
      } else {
        this.apply = ConcatAlongAxisId2.Concat_and_destroy0_destroy1;
      }
    }
  }

  /** Create this.boundsArraySet. */
  static setup_BoundsArraySet() {
    let inputScaleBoundsArray0 = this.input0.scaleBoundsArray;
    let inputScaleBoundsArray1 = this.input1.scaleBoundsArray;

    this.boundsArraySet = BoundsArraySet.InputsOutputs.Pool.get_or_create_by( inputScaleBoundsArray0, inputScaleBoundsArray1, 1 );
    this.boundsArraySet.set_outputs_all_by_concat_input0_input1(); // The outputChannelCount0 will be adjusted.
  }

  /** Setup this.output0.
   * This method should be called after setup_BoundsArraySet() because it uses BoundsArrarySet.
   */
  static setup_output0_TensorPlaceholder() {

    // 1. Determine output0.height
    if ( this.input0.height != undefined ) {
      if ( this.input1.height != undefined ) {

        // If both inputs' height are known, they should be the same.
        if ( this.input0.height != this.input1.height )
          throw Error( `Operation.ConcatAlongAxisId2.setup_output0_TensorPlaceholder(): `
            + `input0.height ( ${this.input0.height} ) and `
            + `input1.height ( ${this.input1.height} ) `
            + `should be the same.`
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

    // 2. Determine output0.width
    if ( this.input0.width != undefined ) {
      if ( this.input1.width != undefined ) {

        // If both inputs' width are known, they should be the same.
        if ( this.input0.width != this.input1.width )
          throw Error( `Operation.ConcatAlongAxisId2.setup_output0_TensorPlaceholder(): `
            + `input0.width ( ${this.input0.width} ) and `
            + `input1.width ( ${this.input1.width} ) `
            + `should be the same.`
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

    // 3.

    // Note: This operation's lower half and higher half channel count information will be lost.

    this.output0.channelCount = this.input0.channelCount + this.input1.channelCount;
    this.output0.channelCount_lowerHalf = undefined;  // Note: After concatenation operation, the half channel information will be lost.
    this.output0.channelCount_higherHalf = undefined;
    this.output0.ScaleBoundsArray_set_without_clone( this.boundsArraySet.output0 );

    // Release for reducing memory usage. (Since it has been inside the output tensor placeholder.)
    {
      this.boundsArraySet.output0 = null; // Because it has already been transferred to TensorPlaceholder this.output0
      this.boundsArraySet.disposeResources_and_recycleToPool();
      this.boundsArraySet = null;
    }
  }


  /** Concatenate along axis id 2. (Both the input0 and input1 will not be disposed. */
  static Concat_and_keep0_keep1() {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    this.output0.realTensor = tf.concat( this.inputTensors, 2 ); // AxisId = 2
  }

  /** Concatenate along axis id 2. (The input0 will not be disposed. The input1 will be disposed. */
  static Concat_and_keep0_destroy1() {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    this.output0.realTensor = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input1.realTensor.dispose();
  }

  /** Concatenate along axis id 2. (The input0 will be disposed. The input1 will not be disposed. */
  static Concat_and_destroy0_keep1() {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    this.output0.realTensor = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input0.realTensor.dispose();
  }

  /** Concatenate along axis id 2. (Both the input0 and input1 will be disposed. */
  static Concat_and_destroy0_destroy1() {
    this.inputTensors[ 0 ] = this.input0.realTensor;
    this.inputTensors[ 1 ] = this.input1.realTensor;
    this.output0.realTensor = tf.concat( this.inputTensors, 2 ); // AxisId = 2
    this.input0.realTensor.dispose();
    this.input1.realTensor.dispose();
  }

}

