export { Dummy };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import { Root } from "./Operation_Base.js";

/**
 * A dummy operation which could pass its input to its output (with properly cloning or disposing according to keep-intput-tensor flags).
 *
 *
 * @member {function} apply
 *   This is a data member which is a pointer to a function. The function processes .input0.realTensor (and .input1.realTensor) as
 * inputTensor(s). It puts to .output0.realTensor as outputTensor. They are tf.tensor3d and just be passed from input to output.
 * The inputTensors may or may not be disposed according to setKeepInputTensor(). Default is setKeepInputTensor( false, false )
 * which will destroy all inputs. Usually, sub-class should override this data member.
 *
 * @see Operation.Base
 */
class Dummy extends Root {

  /**
   * Used as default Operation.Dummy provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Operation.Dummy.Pool", Dummy, Dummy.setAsConstructor );

  /**
   */
  constructor( input0, input1, outputTensorCount, ...restArgs ) {
    super( input0, input1, outputTensorCount, ...restArgs );
    Dummy.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( input0, input1, outputTensorCount, ...restArgs ) {
    super.setAsConstructor( input0, input1, outputTensorCount, ...restArgs );
    Dummy.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    Dummy.setup_apply_dummy.call( this, false, false ); // Default is destroy0 and destroy1.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /**
   * Adjust according to specified keep-input-tensor flag(s). So that calling .apply() will generate correct result without memory leakage.
   *
   * The this.setKeepInputTensor_IfNotFinalOperation_Or_In() will call this method. This method should adjust
   * this.apply so that this.apply() will or will not dispose its inputTensors.
   *
   * Sub-class should override this method.
   *
   * @param {boolean} bKeepInputTensor0
   *   Whether the .input0's tensor should be destroyed by this operation. It is ignored if .input0 does not exist.
   *
   * @param {boolean} bKeepInputTensor1
   *   Whether the .input1's tensor should be destroyed by this operation. It is ignored if .input1 does not exist.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    Dummy.setup_apply_dummy.call( this, bKeepInputTensor0, bKeepInputTensor1 );
  }

  /**
   * Determine this.apply data members according to whether .inputX and .outputX exist and whether they are required to be kept.
   * The .apply will just pass through from input to output (but handle keep-input-tensor flag correctly).
   *
   *
   * @param {Dummy} this
   *   The Dummy object to be determined and modified.
   *
   * @param {boolean} bKeepInputTensor0
   *   Whether the .input0's tensor should be destroyed by this operation. It is ignored if .input0 does not exist.
   *
   * @param {boolean} bKeepInputTensor1
   *   Whether the .input1's tensor should be destroyed by this operation. It is ignored if .input1 does not exist.
   */
  static setup_apply_dummy( bKeepInputTensor0, bKeepInputTensor1 ) {

    // Note: Do not use function declared in function because they may generate new function object every time.

    if ( this.input0 ) {
      if ( this.input1 ) {
        if ( this.output0 ) {
          if ( this.output1 ) { //  1. ( .input0, .input1 ) => ( .output0, .output1 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            if ( bKeepInputTensor0 ) {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o0_o1__k0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o0_o1__k0_d1;
            } else {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o0_o1__d0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o0_o1__d0_d1;
            }
          } else {              //  2. ( .input0, .input1 ) => ( .output0 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            if ( bKeepInputTensor0 ) {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o0__k0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o0__k0_d1;
            } else {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o0__d0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o0__d0_d1;
            }
          }
        } else {
          if ( this.output1 ) { //  3. ( .input0, .input1 ) => ( , .output1 )
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            if ( bKeepInputTensor0 ) {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o1__k0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o1__k0_d1;
            } else {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__o1__d0_k1;
              else
                this.apply = Dummy.apply__i0_i1__o1__d0_d1;
            }
          } else {              //  4. ( .input0, .input1 ) => (  )
            if ( bKeepInputTensor0 ) {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__k0_k1;
              else
                this.apply = Dummy.apply__i0_i1__k0_d1;
            } else {
              if ( bKeepInputTensor1 )
                this.apply = Dummy.apply__i0_i1__d0_k1;
              else
                this.apply = Dummy.apply__i0_i1__d0_d1;
            }
          }
        }
      } else {
        if ( this.output0 ) {
          if ( this.output1 ) { //  5. ( .input0 ) => ( .output0, .output1 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            if ( bKeepInputTensor0 ) {
              this.apply = Dummy.apply__i0__o0_o1__k0;
            } else {
              this.apply = Dummy.apply__i0__o0_o1__d0;
            }
          } else {              //  6. ( .input0 ) => ( .output0 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            if ( bKeepInputTensor0 ) {
              this.apply = Dummy.apply__i0__o0__k0;
            } else {
              this.apply = Dummy.apply__i0__o0__d0;
            }
          }
        } else {
          if ( this.output1 ) { //  7. ( .input0 ) => ( , .output1 )
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );
            if ( bKeepInputTensor0 ) {
              this.apply = Dummy.apply__i0__o1__k0;
            } else {
              this.apply = Dummy.apply__i0__o1__d0;
            }
          } else {              //  8. ( .input0 ) => (  )
            if ( bKeepInputTensor0 ) {
              this.apply = Dummy.apply__i0__k0;
            } else {
              this.apply = Dummy.apply__i0__d0;
            }
          }
        }
      }
    } else {
      if ( this.input1 ) {
        if ( this.output0 ) {
          if ( this.output1 ) { //  9. ( , .input1 ) => ( .output0, .output1 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            if ( bKeepInputTensor1 ) {
              this.apply = Dummy.apply__i1__o0_o1__k1;
            } else {
              this.apply = Dummy.apply__i1__o0_o1__d1;
            }
          } else {              // 10. ( , .input1 ) => ( .output0 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            if ( bKeepInputTensor1 ) {
              this.apply = Dummy.apply__i1__o0__k1;
            } else {
              this.apply = Dummy.apply__i1__o0__d1;
            }
          }
        } else {
          if ( this.output1 ) { // 11. ( , .input1 ) => ( , .output1 )
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input1 );
            if ( bKeepInputTensor1 ) {
              this.apply = Dummy.apply__i1__o1__k1;
            } else {
              this.apply = Dummy.apply__i1__o1__d1;
            }
          } else {              // 12. ( , .input1 ) => (  )
            if ( bKeepInputTensor1 ) {
              this.apply = Dummy.apply__i1__k1;
            } else {
              this.apply = Dummy.apply__i1__d1;
            }
          }
        }
      } else { // no input0, no input1.
        if ( this.output0 ) {
          if ( this.output1 ) { // 13. (  ) => ( .output0, .output1 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
            this.apply = Dummy.apply__o0_o1;
          } else {              // 14. (  ) => ( .output0 )
            this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
            this.apply = Dummy.apply__o0;
          }
        } else {
          if ( this.output1 ) { // 15. (  ) => ( , .output1 )
            this.output1.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( null );
            this.apply = Dummy.apply__o1;
          } else {              // 16. (  ) => (  )
            this.apply = Dummy.apply__;
          }
        }

        //!!! (2022/06/02 Remarked) It can be supported. Just put null to output should be enough.
        //if ( this.input0 == this.input1 )
        //  throw Error( `Operation.Dummy.setup_apply_dummy(): `
        //    + `input0 ( ${this.input0} ) and input1 ( ${this.input1} ) should at least one is non-null.`
        //  );
      }
    }
  }


  /*
   * The apply__XXX() function name meaning:
   * - The i0 means has .input0
   * - The i1 means has .input1
   * - The o0 means has .output0
   * - The o1 means has .output1
   * - The k0 means keep .input0 tensor
   * - The k1 means keep .input1 tensor
   * - The d0 means dispose .input0 tensor
   * - The d1 means dispose .input1 tensor
   *
   */
  static apply__i0_i1__o0_o1__k0_k1() { this.output0.realTensor = this.input0.realTensor.clone(); this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i0_i1__o0_o1__k0_d1() { this.output0.realTensor = this.input0.realTensor.clone(); this.output1.realTensor = this.input1.realTensor; }
  static apply__i0_i1__o0_o1__d0_k1() { this.output0.realTensor = this.input0.realTensor; this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i0_i1__o0_o1__d0_d1() { this.output0.realTensor = this.input0.realTensor; this.output1.realTensor = this.input1.realTensor; }

  static apply__i0_i1__o0__k0_k1() { this.output0.realTensor = this.input0.realTensor.clone(); }
  static apply__i0_i1__o0__k0_d1() { this.output0.realTensor = this.input0.realTensor.clone(); this.input1.realTensor.dispose(); }
  static apply__i0_i1__o0__d0_k1() { this.output0.realTensor = this.input0.realTensor; }
  static apply__i0_i1__o0__d0_d1() { this.output0.realTensor = this.input0.realTensor; this.input1.realTensor.dispose(); }
  
  static apply__i0_i1__o1__k0_k1() { this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i0_i1__o1__k0_d1() { this.output1.realTensor = this.input1.realTensor; }
  static apply__i0_i1__o1__d0_k1() { this.input0.realTensor.dispose(); this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i0_i1__o1__d0_d1() { this.input0.realTensor.dispose(); this.output1.realTensor = this.input1.realTensor; }

  static apply__i0_i1__k0_k1() {}
  static apply__i0_i1__k0_d1() { this.input1.realTensor.dispose(); }
  static apply__i0_i1__d0_k1() { this.input0.realTensor.dispose(); }
  static apply__i0_i1__d0_d1() { this.input0.realTensor.dispose(); this.input1.realTensor.dispose(); }

  static apply__i0__o0_o1__k0() { this.output0.realTensor = this.input0.realTensor.clone(); this.output1.realTensor = this.input0.realTensor.clone(); }
  static apply__i0__o0_o1__d0() { this.output0.realTensor = this.input0.realTensor; this.output1.realTensor = this.input0.realTensor.clone(); }

  static apply__i0__o0__k0() { this.output0.realTensor = this.input0.realTensor.clone(); }
  static apply__i0__o0__d0() { this.output0.realTensor = this.input0.realTensor; }

  static apply__i0__o1__k0() { this.output1.realTensor = this.input0.realTensor.clone(); }
  static apply__i0__o1__d0() { this.output1.realTensor = this.input0.realTensor; }

  static apply__i0__k0() {}
  static apply__i0__d0() { this.input0.realTensor.dispose(); }

  static apply__i1__o0_o1__k1() { this.output0.realTensor = this.input1.realTensor.clone(); this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i1__o0_o1__d1() { this.output0.realTensor = this.input1.realTensor; this.output1.realTensor = this.input1.realTensor.clone(); }

  static apply__i1__o0__k1() { this.output0.realTensor = this.input1.realTensor.clone(); }
  static apply__i1__o0__d1() { this.output0.realTensor = this.input1.realTensor; }

  static apply__i1__o1__k1() { this.output1.realTensor = this.input1.realTensor.clone(); }
  static apply__i1__o1__d1() { this.output1.realTensor = this.input1.realTensor; }

  static apply__i1__k1() {}
  static apply__i1__d1() { this.input1.realTensor.dispose(); }

  static apply__o0_o1() { this.output0.realTensor = null; this.output1.realTensor = null; }

  static apply__o0() { this.output0.realTensor = null; }

  static apply__o1() { this.output1.realTensor = null; }

  static apply__() {}

}

