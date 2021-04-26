export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";

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
 * @member {function} pfnConcat
 *   This is a method. It has one parameter inputTensorsArray and return a outputTensor. The inputTensorsArray (tf.tensor3d[]) represents
 * all the images ( height x width x channel ) which will be concatenated. They should have the same ( height x width ) but could
 * different channel count. The outputTensor (tf.tensor3d) represents the result of concatenating the inputs along the last axis
 * (i.e. the channel axis ( axisId = 2 ) ). The inputTensor may or may not be disposed. In fact, this method calls one of

//!!! ...unfinished... (2021/04/23)

 * Base.return_input_directly(), Base.keep_input_return_copy(), Concat_and_keep0_keep1(), Concat_and_keep0_destroy1(),
 * Concat_and_destroy0_keep1(), Concat_and_destroy0_destroy1() according to the parameters.
 *
 */

//!!! ...unfinished... (2021/04/26) need ReturnOrClone_Activation.Base?

class Base extends ReturnOrClone_Activation.Base {

  constructor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    Base.adjust_pfnConcat.call( this );
  }


//!!! ...unfinished... (2021/04/23) Who is responsible for keep or destroy inputTensors[ 1 ]?
// Perhaps, need Concat.Base. It has setKeepInputTensor0() and setKeepInputTensor1() control whether destroy
// or keep individual inputTensors[] elements

  setKeepInputTensor0( bKeepInputTensor0 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    Base.adjust_pfnConcat.call( this );
  }

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

}
