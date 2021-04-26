export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";

/**
 * Concatenate two tensor3d ( height x width x channel ) always along the last axis (i.e. axisId = 2, along the channel axis). It could
 * destroy one or two of the input tensors.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
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

 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 */
class Base extends ReturnOrClone_Activation.Base {

  constructor( bKeepInputTensor0, bKeepInputTensor1 ) {
//!!! ...unfinished... (2021/04/23)
//     this.bKeepInputTensor0 = bKeepInputTensor0;
//     this.bKeepInputTensor1 = bKeepInputTensor1;

//!!! ...unfinished... (2021/04/23)
    this.setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 );
  }

//!!! ...unfinished... (2021/04/23)

//!!! ...unfinished... (2021/04/23) Who is responsible for keep or destroy inputTensors[ 1 ]?
// Perhaps, need Concat.Base. It has setKeepInputTensor0() and setKeepInputTensor1() control whether destroy
// or keep individual inputTensors[] elements

  /**
   * Adjust this.pfnConcat so that this.pfnConcat() will or will not dispose its inputTensors.
   */
  setKeepInputTensor0( bKeepInputTensor0 ) {
//!!! ...unfinished... (2021/04/23)

  }

  setKeepInputTensor1( bKeepInputTensor1 ) {
//!!! ...unfinished... (2021/04/23)

  }

  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
//!!! ...unfinished... (2021/04/26)
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;

    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {
      if ( bKeepInputTensor ) {
        this.pfnConv = Base.Conv_and_keep;
      } else {
        this.pfnConv = Base.Conv_and_destroy;
      }
    } else {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      if ( bKeepInputTensor ) {
        this.pfnConvBiasActivation = this.pfnConv = Base.keep_input_return_copy;
      } else {
        this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      }
    }
  }


//!!! ...unfinished... (2021/04/26)

  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will not be disposed. */
  static Concat_and_keep0_keep1( inputTensorsArray ) {
    return tf.concat( inputTensorsArray, 2 ); // AxisId = 2
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will not be disposed. The inputTensorsArray[ 1 ] will be disposed. */
  static Concat_and_keep0_destroy1( inputTensorsArray ) {
    try {
      return tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    } finally {
      inputTensorsArray[ 1 ].dispose();
    }
  }

  /** Concatenate along axis id 2. (The inputTensorsArray[ 0 ] will be disposed. The inputTensorsArray[ 1 ] will not be disposed. */
  static Concat_and_destroy0_keep1( inputTensorsArray ) {
    try {
      return tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    } finally {
      inputTensorsArray[ 0 ].dispose();
    }
  }

  /** Concatenate along axis id 2. (Both the inputTensorsArray[ 0 ] and inputTensorsArray[ 1 ] will be disposed. */
  static Concat_and_destroy0_destroy1( inputTensorsArray ) {
    try {
      return tf.concat( inputTensorsArray, 2 ); // AxisId = 2
    } finally {
      inputTensorsArray[ 0 ].dispose();
      inputTensorsArray[ 1 ].dispose();
    }
  }

}
