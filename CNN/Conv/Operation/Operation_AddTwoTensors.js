export { AddTwoTensors };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { Base } from "./Operation_Base.js";

/**
 * Add two tensor3d. They should have the same channel count. Their ( height x width ) should be either the same or one is ( 1 x 1 ).
 * It could destroy one or two of the input tensors.
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after adding. If true, the first input tensor will be kept after adding.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after adding. If true, the second input tensor will be kept after adding.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
 *   The element value bounds (per channel) of this add-two-tensors operation's input0. It will be kept (not cloned) directly. So caller
 * should not modify them.
 *
 * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
 *   The element value bounds (per channel) of this add-two-tensors operation's input1. It will be kept (not cloned) directly. So caller
 * should not modify them.
 *
 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds (per channel) of this concatenation operation.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor and this.input1.realTensor as inputTensors. It put to this.output0.realTensor
 * as outputTensor. Both inputTensors are tf.tensor3d and represents an images ( height x width x channel ) which will be added. They
 * should have the same channel count. Their ( height x width ) should be either the same or one is ( 1 x 1 ). The outputTensor
 * (tf.tensor3d) represents the result of adding the two inputs. The inputTensors may or may not be disposed. In fact, this method
 * calls one of Add_and_keep0_keep1(), Add_and_keep0_destroy1(), Add_and_destroy0_keep1(), Add_and_destroy0_destroy1() according to the parameters.
 *
 */
class AddTwoTensors extends Base() {

  /**
   *
   */
  constructor(
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    inputScaleBoundsArray0, inputScaleBoundsArray1,
    bKeepInputTensor0, bKeepInputTensor1
  ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );

    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfn.call( this );
    Base.setup_BoundsArraySet.call( this, inputScaleBoundsArray0, inputScaleBoundsArray1 );
    Base.setup_output0_TensorPlaceholder.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfn.call( this );
  }

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfn.call( this );
  }

  /** Set this.apply according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfn() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.apply = Base.Add_and_keep0_keep1;
      } else {
        this.apply = Base.Add_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.apply = Base.Add_and_destroy0_keep1;
      } else {
        this.apply = Base.Add_and_destroy0_destroy1;
      }
    }
  }

  /** Create this.boundsArraySet. */
  static setup_BoundsArraySet( inputScaleBoundsArray0, inputScaleBoundsArray1 ) {

    tf.util.assert( ( inputScaleBoundsArray0.channelCount == inputScaleBoundsArray1.channelCount ),
      `AddTwoTensors.setup_BoundsArraySet(): `
        + `input0 channel count ( ${inputScaleBoundsArray0.channelCount} ) should be the same as `
        + `input1 channel count ( ${inputScaleBoundsArray1.channelCount} ).`
    );

    this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, inputScaleBoundsArray1,
      inputScaleBoundsArray0.channelCount
    );

    this.boundsArraySet.output0
      .set_all_byScaleBoundsArray( inputScaleBoundsArray0 )
      .add_all_byScaleBoundsArray_all( inputScaleBoundsArray1 );
  }

  /** Setup this.output0. */
  static setup_output0_TensorPlaceholder() {

    // 1. Only same channel count adding is supported.
    if ( this.input0.channelCount == this.input1.channelCount ) {

      this.output0.channelCount = this.input0.channelCount; // Result always has the same channel count.

      // 1.1 Adding two same dimension tensors. The result dimension is the same of any one.
      if ( ( this.input0.height == this.input1.height ) && ( this.input0.width == this.input1.width ) ) {
        this.output0.height = this.input0.height;
        this.output0.width = this.input0.width;

      // 1.2 Adding by broadcasting input0 to input1. The result dimension is the same as input1 (the larger one).
      } else if ( ( this.input0.height == 1 ) && ( this.input0.width == 1 ) ) {
        this.output0.height = this.input1.height;
        this.output0.width = this.input1.width;

      // 1.3 Adding by broadcasting input1 to input0. The result dimension is the same as input0 (the larger one).
      } else if ( ( this.input1.height == 1 ) && ( this.input1.width == 1 ) ) {
        this.output0.height = this.input0.height;
        this.output0.width = this.input0.width;

      // 1.4 Unsupported adding (height and width).
      } else {
        tf.util.assert( false,
          `Operation.AddTwoTensors.setup_output0_TensorPlaceholder(): `
            + `input0 ( height, width ) = ( ${this.input0.height}, ${this.input0.width} ) and `
            + `input1 ( height, width ) = ( ${this.input1.height}, ${this.input1.width} ) `
            + `should be either the same or one is ( 1, 1 ) for broadcating.`
        );
      }

      // Only if both inputs' lower half and higher half channel count are the same, they are passed through to output.
      // Otherwise, absent them in the output.
      {
        if ( this.input0.channelCount_lowerHalf == this.input1.channelCount_lowerHalf ) {
          if ( this.input0.channelCount_lowerHalf != undefined )
            this.output0.channelCount_lowerHalf = this.this.input0.channelCount_lowerHalf;
        }

        if ( this.input0.channelCount_higherHalf == this.input1.channelCount_higherHalf ) {
          if ( this.input0.channelCount_higherHalf != undefined )
            this.output0.channelCount_higherHalf = this.this.input0.channelCount_higherHalf;
        }
      }

    // 2. Unsupported adding (different channel count).
    } else {
      tf.util.assert( false,
        `Operation.AddTwoTensors.setup_output0_TensorPlaceholder(): `
          + `input0 channel count ( ${this.input0.channelCount} ) and `
          + `input1 channel count ( ${this.input1.channelCount} ) `
          + `should be the same.`
      );
    }
  }


  /** Add. (Both the inputTensor0 and inputTensor1 will not be disposed. */
  static Add_and_keep0_keep1() {
    this.output0.realTensor = tf.add( this.input0.realTensor, this.input1.realTensor );
  }

  /** Add. (The inputTensors0 will not be disposed. The inputTensor1 will be disposed. */
  static Add_and_keep0_destroy1() {
    this.output0.realTensor = tf.add( this.input0.realTensor, this.input1.realTensor );
    this.input1.realTensor.dispose();
  }

  /** Add. (The inputTensor0 will be disposed. The inputTensor1 will not be disposed. */
  static Add_and_destroy0_keep1() {
    this.output0.realTensor = tf.add( this.input0.realTensor, this.input1.realTensor );
    this.input0.realTensor.dispose();
  }

  /** Add. (Both the inputTensor0 and inputTensor1 will be disposed. */
  static Add_and_destroy0_destroy1() {
    this.output0.realTensor = tf.add( this.input0.realTensor, this.input1.realTensor );
    this.input0.realTensor.dispose();
    this.input1.realTensor.dispose();
  }

}
