export { Base };

//!!! ...unfinished... (2021/05/30) may inherit from Pointwise?

/**
 * Add two tensor3d. They should have the same dimensions ( height x width x channel ). It could destroy one or two of the input tensors.
 *
 * @member {boolean} bKeepInputTensor0
 *   If false, the first input tensor will be disposed after adding. If true, the first input tensor will be kept after adding.
 *
 * @member {boolean} bKeepInputTensor1
 *   If false, the second input tensor will be disposed after adding. If true, the second input tensor will be kept after adding.
 *
 * @member {function} pfnAdd
 *   This is a method. It has two parameter ( inputTensor0, inputTensor1 ) and return a outputTensor. Both the inputTensor0 and
 * inputTensor1 are tf.tensor3d and represents an images ( height x width x channel ) which will be added. They should have the same
 * ( height x width x channel ). The outputTensor (tf.tensor3d) represents the result of adding the two inputs. The inputTensor may
 * or may not be disposed. In fact, this method calls one of Add_and_keep0_keep1(), Add_and_keep0_destroy1(), Add_and_destroy0_keep1(),
 * Add_and_destroy0_destroy1() according to the parameters.
 *
 */
class Base {

  constructor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnAdd.call( this );
  }

  /**
   * Adjust this.pfnAdd so that this.pfnAdd() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfnAdd.call( this );
  }

  /**
   * Adjust this.pfnAdd so that this.pfnAdd() will or will not dispose its inputTensors.
   */
  setKeepInputTensor1( bKeepInputTensor1 ) {
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnAdd.call( this );
  }

  /**
   * Adjust this.pfnAdd so that this.pfnAdd() will or will not dispose its inputTensors.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnAdd.call( this );
  }

  /** Set this.pfnAdd according to this.bKeepInputTensor0 and this.bKeepInputTensor1. */
  static adjust_pfnAdd() {
    if ( this.bKeepInputTensor0 ) {
      if ( this.bKeepInputTensor1 ) {
        this.pfnAdd = Base.Add_and_keep0_keep1;
      } else {
        this.pfnAdd = Base.Add_and_keep0_destroy1;
      }
    } else {
      if ( this.bKeepInputTensor1 ) {
        this.pfnAdd = Base.Add_and_destroy0_keep1;
      } else {
        this.pfnAdd = Base.Add_and_destroy0_destroy1;
      }
    }
  }

//!!! ...unfinished... (2021/06/08) What if pointwise22 could be add-input-to-output but pointwise21 could not?
// Perhaps, AddTwoTensors should be able to handle no-op (no add but just return input).

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
