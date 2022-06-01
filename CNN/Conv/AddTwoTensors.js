export { Base };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Operation from "./Operation.js";
import * as BoundsArraySet from "./BoundsArraySet.js";

/**
 * Add two tensor3d. They should have the same dimensions ( height x width x channel ). It could destroy one or two of the input tensors.
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
 *   This is a method. It has two parameter ( inputTensor0, inputTensor1 ) and return a outputTensor. Both the inputTensor0 and
 * inputTensor1 are tf.tensor3d and represents an images ( height x width x channel ) which will be added. They should have the same
 * ( height x width x channel ). The outputTensor (tf.tensor3d) represents the result of adding the two inputs. The inputTensor may
 * or may not be disposed. In fact, this method calls one of Add_and_keep0_keep1(), Add_and_keep0_destroy1(), Add_and_destroy0_keep1(),
 * Add_and_destroy0_destroy1() according to the parameters.
 *
 */
class Base extends Operation.Base() {


//!!! ...unfinished... (2022/06/01) TensorPlaceholder

  /**
   *
   */
  constructor(
//!!! ...unfinished... (2022/05/21)
    inputTensorPlaceholder0, inputTensorPlaceholder1,
    bKeepInputTensor0, bKeepInputTensor1, inputScaleBoundsArray0, inputScaleBoundsArray1 ) {

    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 1 );

    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfn.call( this );
    Base.setup_BoundsArraySet.call( this, inputScaleBoundsArray0, inputScaleBoundsArray1 );
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

  /** Add. (Both the inputTensor0 and inputTensor1 will not be disposed. */
  static Add_and_keep0_keep1( inputTensor0, inputTensor1 ) {
    return tf.add( inputTensor0, inputTensor1 );
  }

  /** Add. (The inputTensors0 will not be disposed. The inputTensor1 will be disposed. */
  static Add_and_keep0_destroy1( inputTensor0, inputTensor1 ) {
    let t = tf.add( inputTensor0, inputTensor1 );
    inputTensor1.dispose();
    return t;
  }

  /** Add. (The inputTensor0 will be disposed. The inputTensor1 will not be disposed. */
  static Add_and_destroy0_keep1( inputTensor0, inputTensor1 ) {
    let t = tf.add( inputTensor0, inputTensor1 );
    inputTensor0.dispose();
    return t;
  }

  /** Add. (Both the inputTensor0 and inputTensor1 will be disposed. */
  static Add_and_destroy0_destroy1( inputTensor0, inputTensor1 ) {
    let t = tf.add( inputTensor0, inputTensor1 );
    inputTensor0.dispose();
    inputTensor1.dispose();
    return t;
  }

}
