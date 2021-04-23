export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";

/**
 * Handle concatenate two tensors. It could destroy one or two of the input tensors.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *

//!!! ...unfinished... (2021/04/23)

 * @member {boolean} bExisted
 *   If true, this pointwise convolution exist.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnConv
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnConvBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy_or_keep(), ConvBias_and_destroy_or_keep(),
 * ConvActivation_and_destroy_or_keep(), ConvBiasActivation_and_destroy_or_keep() according to the parameters.
 */
class Base extends ReturnOrClone_Activation.Base {


//!!! ...unfinished... (2021/04/23)

  constructor( inputChannelCount, outputChannelCount, bBias, nActivationId, inputFloat32Array, byteOffsetBegin ) {
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.inputFloat32Array = inputFloat32Array;
    this.byteOffsetBegin = byteOffsetBegin;
  }


//!!! ...unfinished... (2021/04/23)

  init() {
    this.disposeTensors();

    this.bExisted = ( this.outputChannelCount > 0 );
    this.pfnActivation = Base.getActivationFunction( this.nActivationId );

    if ( this.bExisted ) {

      //this.filterHeightWidth = [ 1, 1 ];
      this.filtersShape =      [ 1, 1, this.inputChannelCount, this.outputChannelCount ];
      this.biasesShape =       [ 1, 1, this.outputChannelCount ];

      this.filtersWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.filtersShape );
      if ( !this.filtersWeights.extract() )
        return false;  // e.g. input array does not have enough data.

      this.byteOffsetEnd = this.filtersWeights.defaultByteOffsetEnd;

      this.filtersTensor4d = tf.tensor4d( this.filtersWeights.weights, this.filtersShape );
      this.pfnConv = Base.Conv_and_destroy; // will dispose inputTensor.

      if ( this.bBias ) {
        this.biasesWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.biasesShape );
        if ( !this.pointwise1BiasesWeights.extract() )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = this.biasesWeights.defaultByteOffsetEnd;

        this.biasesTensor3d = tf.tensor3d( this.biasesWeights.weights, this.pointwise1BiasesShape );

        if ( this.pfnActivation )
          this.pfnConvBiasActivation = Base.ConvBiasActivation_and_destroy_or_keep;
        else
          this.pfnConvBiasActivation = Base.ConvBias_and_destroy_or_keep;

      } else {

        if ( this.pfnActivation )
          this.pfnConvBiasActivation = Base.ConvActivation_and_destroy_or_keep;
         else
          this.pfnConvBiasActivation = Base.Conv_and_destroy_or_keep;

      }

    } else {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
    }

    this.bInitOk = true;
  }


//!!! ...unfinished... (2021/04/23)

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

    this.filtersWeights = this.biasesWeights = this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation = null;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

//!!! ...unfinished... (2021/04/23) Who is responsible for keep or destroy inputTensors[ 1 ]?
// Perhaps, need Concat.Base. It has setKeepInputTensor0() and setKeepInputTensor1() control whether destroy
// or keep individual inputTensors[] elements

  /**
   * Adjust this.pfnConv (and this.pfnConvBiasActivation if need) so that this.pfnConv() and this.pfnConvBiasActivation() will or will not
   * dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
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


//!!! ...unfinished... (2021/04/23)

  /** Pointwise Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep( inputTensor ) {
    return this.pfnConv( inputTensor );
  }

  static ConvBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static ConvActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
