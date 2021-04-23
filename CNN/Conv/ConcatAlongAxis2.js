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

//!!! ...unfinished... (2021/04/23)

  constructor( bKeepInputTensor0, bKeepInputTensor1 ) {
    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
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
    this.pfnConcat = null;
    this.bKeepInputTensor0 = this.bKeepInputTensor1 = false;  // Default will dispose input tensors.
    this.bInitOk = false;
  }

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
//!!! ...unfinished... (2021/04/23)

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
