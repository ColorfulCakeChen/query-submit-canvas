export { MultiplyTwoTensors };
export { MultiplyTwoTensorsPool };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { Root } from "./Operation_Base.js";

/**
 * Multiply two tensor3d. They should have the same channel count. Their ( height x width ) should be either the same or one is ( 1 x 1 ).
 * It could destroy one or two of the input tensors.
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after multiplying. If true, the first input tensor will be kept after multiplying.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after multiplying. If true, the second input tensor will be kept after multiplying.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor and this.input1.realTensor as inputTensors. It puts to this.output0.realTensor
 * as outputTensor. Both inputTensors are tf.tensor3d and represents an images ( height x width x channel ) which will be multiplied. They
 * should have the same channel count. Their ( height x width ) should be either the same or one is ( 1 x 1 ). The outputTensor
 * (tf.tensor3d) represents the result of multiplying the two inputs. The inputTensors may or may not be disposed. In fact, this method
 * calls one of Multiply_and_keep0_keep1(), Multiply_and_keep0_destroy1(), Multiply_and_destroy0_keep1(), Multiply_and_destroy0_destroy1()
 * according to the parameters.
 *
 */
class MultiplyTwoTensors extends Root {

  /**
   *
   */
  constructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );

    this.setAsConstructor( inputTensorPlaceholder0, inputTensorPlaceholder1, bKeepInputTensor0, bKeepInputTensor1 );
  }

  /**
   * @return {AddTwoTensors}
   *   Return the this object.
   */
  setAsConstructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );

    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    MultiplyTwoTensors.adjust_pfn.call( this );
    MultiplyTwoTensors.setup_BoundsArraySet.call( this );
    MultiplyTwoTensors.setup_output0_TensorPlaceholder.call( this );
    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    MultiplyTwoTensorsPool.Singleton.recycle( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    MultiplyTwoTensors.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    MultiplyTwoTensors.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    MultiplyTwoTensors.adjust_pfn.call( this );
  }


  /** Set this.apply according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfn() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.apply = MultiplyTwoTensors.Multiply_and_keep0_keep1;
      } else {
        this.apply = MultiplyTwoTensors.Multiply_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.apply = MultiplyTwoTensors.Multiply_and_destroy0_keep1;
      } else {
        this.apply = MultiplyTwoTensors.Multiply_and_destroy0_destroy1;
      }
    }
  }

  /** Create this.boundsArraySet. */
  static setup_BoundsArraySet() {
    let inputScaleBoundsArray0 = this.input0.scaleBoundsArray;
    let inputScaleBoundsArray1 = this.input1.scaleBoundsArray;

    tf.util.assert( ( inputScaleBoundsArray0.channelCount == inputScaleBoundsArray1.channelCount ),
      `MultiplyTwoTensors.setup_BoundsArraySet(): `
        + `input0 channel count ( ${inputScaleBoundsArray0.channelCount} ) should be the same as `
        + `input1 channel count ( ${inputScaleBoundsArray1.channelCount} ).`
    );

    this.boundsArraySet = BoundsArraySet.InputsOutputsPool.Singleton.get_or_create_by( inputScaleBoundsArray0, inputScaleBoundsArray1,
      inputScaleBoundsArray0.channelCount
    );

    this.boundsArraySet.output0
      .set_all_byScaleBoundsArray( inputScaleBoundsArray0 )
      .multiply_all_byScaleBoundsArray_all( inputScaleBoundsArray1 );
  }

  /** Setup this.output0.
   * This method should be called after setup_BoundsArraySet() because it uses BoundsArrarySet.
   */
  static setup_output0_TensorPlaceholder() {

    // 1. Only same channel count multiplying is supported.
    if ( this.input0.channelCount == this.input1.channelCount ) {

      this.output0.channelCount = this.input0.channelCount; // Result always has the same channel count.

      // 1.1 Multiplying two same dimension tensors. The result dimension is the same of any one.
      if ( ( this.input0.height == this.input1.height ) && ( this.input0.width == this.input1.width ) ) {
        this.output0.height = this.input0.height;
        this.output0.width = this.input0.width;

      // 1.2 Multiplying by broadcasting input0 to input1. The result dimension is the same as input1 (the larger one).
      } else if ( ( this.input0.height == 1 ) && ( this.input0.width == 1 ) ) {
        this.output0.height = this.input1.height;
        this.output0.width = this.input1.width;

      // 1.3 Multiplying by broadcasting input1 to input0. The result dimension is the same as input0 (the larger one).
      } else if ( ( this.input1.height == 1 ) && ( this.input1.width == 1 ) ) {
        this.output0.height = this.input0.height;
        this.output0.width = this.input0.width;

      // 1.4 Unsupported multiplying (height and width).
      } else {
        tf.util.assert( false,
          `Operation.MultiplyTwoTensors.setup_output0_TensorPlaceholder(): `
            + `input0 ( height, width ) = ( ${this.input0.height}, ${this.input0.width} ) and `
            + `input1 ( height, width ) = ( ${this.input1.height}, ${this.input1.width} ) `
            + `should be either the same or one is ( 1, 1 ) for broadcating.`
        );
      }

      // Only if both inputs' lower half and higher half channel count are the same, they are passed through to output.
      // Otherwise, absent them in the output.
      {
        if ( this.input0.channelCount_lowerHalf == this.input1.channelCount_lowerHalf ) {
          this.output0.channelCount_lowerHalf = this.input0.channelCount_lowerHalf;
        } else {
          this.output0.channelCount_lowerHalf = undefined;
        }

        if ( this.input0.channelCount_higherHalf == this.input1.channelCount_higherHalf ) {
          this.output0.channelCount_higherHalf = this.input0.channelCount_higherHalf;
        } else {
          this.output0.channelCount_higherHalf = undefined;
        }
      }

      this.output0.scaleBoundsArray = this.boundsArraySet.output0;

      // Release for reducing memory usage. (Since it has been inside the output tensor placeholder.)
      {
        this.boundsArraySet.output0 = null; // Because it has already been transferred to TensorPlaceholder this.output0
        BoundsArraySet.InputsOutputsPool.Singleton.recycle( this.boundsArraySet );
        this.boundsArraySet = null;
      }

    // 2. Unsupported multiplying (different channel count).
    } else {
      tf.util.assert( false,
        `Operation.MultiplyTwoTensors.setup_output0_TensorPlaceholder(): `
          + `input0 channel count ( ${this.input0.channelCount} ) and `
          + `input1 channel count ( ${this.input1.channelCount} ) `
          + `should be the same.`
      );
    }
  }


  /** Multiply. (Both the inputTensor0 and inputTensor1 will not be disposed. */
  static Multiply_and_keep0_keep1() {
    this.output0.realTensor = tf.mul( this.input0.realTensor, this.input1.realTensor );
  }

  /** Multiply. (The inputTensors0 will not be disposed. The inputTensor1 will be disposed. */
  static Multiply_and_keep0_destroy1() {
    this.output0.realTensor = tf.mul( this.input0.realTensor, this.input1.realTensor );
    this.input1.realTensor.dispose();
  }

  /** Multiply. (The inputTensor0 will be disposed. The inputTensor1 will not be disposed. */
  static Multiply_and_destroy0_keep1() {
    this.output0.realTensor = tf.mul( this.input0.realTensor, this.input1.realTensor );
    this.input0.realTensor.dispose();
  }

  /** Multiply. (Both the inputTensor0 and inputTensor1 will be disposed. */
  static Multiply_and_destroy0_destroy1() {
    this.output0.realTensor = tf.mul( this.input0.realTensor, this.input1.realTensor );
    this.input0.realTensor.dispose();
    this.input1.realTensor.dispose();
  }

}


/**
 * Providing Operation.MultiplyTwoTensors
 *
 */
class MultiplyTwoTensorsPool extends Pool.Root {

  constructor() {
    super( MultiplyTwoTensors, MultiplyTwoTensors.setAsConstructor );
  }

}

/**
 * Used as default Operation.AddTwoTensors provider.
 */
MultiplyTwoTensorsPool.Singleton = new MultiplyTwoTensorsPool();

