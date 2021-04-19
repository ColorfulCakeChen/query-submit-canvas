export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";

/**
 * Handle depthwise convolution, bias and activation.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {boolean} bExisted
 *   If true, this pointwise convolution exist.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnOperation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Avg_and_destroy(), Avg_and_keep(), Max_and_destroy(), Max_and_keep(),
 * Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnOperationBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Operation_and_destroy_or_keep(), OperationBias_and_destroy_or_keep(),
 * OperationActivation_and_destroy_or_keep(), OperationBiasActivation_and_destroy_or_keep() according to the parameters.
 */
class Base extends ReturnOrClone_Activation.Base {

  constructor(
    inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, stridesPad, bBias, nActivationId,
    inputFloat32Array, byteOffsetBegin ) {

    this.inputChannelCount = inputChannelCount;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.stridesPad = stridesPad;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.inputFloat32Array = inputFloat32Array;
    this.byteOffsetBegin = byteOffsetBegin;
  }

  init() {
    this.disposeTensors();

    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false; // Assume no depthwise.
    this.outputChannelCount = this.inputChannelCount; // Assume no channel multiplier.

    this.filterWidth = this.filterHeight;  // Assume depthwise filter's width equals its height.

    if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling, or 1x1 MAX pooling, or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == true ) )
      //   - Just return input (i.e. ( this.pfnOperation == Base.return_input_directly ) )

      if ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) ) {
        this.pfnOperation = Base.return_input_directly; // Do nothing, because the result of 1x1 AVG or MAX pooling is just the same as input.
      } else {
        switch ( this.AvgMax_Or_ChannelMultiplier ) {
          case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
            this.bDepthwise = this.bDepthwiseAvg = true;
            this.pfnOperation = Base.Avg_and_destroy;
            break;

          case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
            this.bDepthwise = this.bDepthwiseMax = true;
            this.pfnOperation = Base.Max_and_destroy;
            break;
        }
      }

    } else {
      if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
        this.bDepthwise = this.bDepthwiseConv = true;

        this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

        this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.AvgMax_Or_ChannelMultiplier ];

        this.filtersWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.filtersShape );
        if ( !this.filtersWeights.extract() )
          return false;  // e.g. input array does not have enough data.

        this.byteOffsetEnd = this.filtersWeights.defaultByteOffsetEnd;

        this.filtersTensor4d = tf.tensor4d( this.filtersWeights.weights, this.filtersShape );
        this.pfnOperation = Base.Conv_and_destroy; // will dispose inputTensor.

      } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      }
    }

    switch ( this.stridesPad ) {
      case 0:  this.strides = 1; this.pad = "valid"; break;
      default:
      case 1:  this.strides = 1; this.pad = "same";  break;
      case 2:  this.strides = 2; this.pad = "same";  break;
    }

    this.pfnActivation = Base.getActivationFunction( this.nActivationId );

    this.filterHeightWidth = [ this.filterHeight, this.filterWidth ];
    this.biasesShape =       [ 1, 1, this.outputChannelCount ];

    if ( this.bDepthwise ) {

      if ( this.bBias ) {
        this.biasesWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.biasesShape );
        if ( !this.biasesWeights.extract() )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = this.biasesWeights.defaultByteOffsetEnd;

        this.biasesTensor3d = tf.tensor3d( this.biasesWeights.weights, this.biasesShape );

        if ( this.pfnActivation )
          this.pfnOperationBiasActivation = Base.OperationBiasActivation_and_destroy_or_keep;
        else
          this.pfnOperationBiasActivation = Base.OperationBias_and_destroy_or_keep;

      } else {

        if ( this.pfnActivation )
          this.pfnOperationBiasActivation = Base.OperationActivation_and_destroy_or_keep;
         else
          this.pfnOperationBiasActivation = Base.Operation_and_destroy_or_keep;

      }

    } else {
      // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
      this.pfnOperationBiasActivation = this.pfnOperation = Base.return_input_directly;
    }

    this.bInitOk = true;
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

    this.filtersWeights = this.biasesWeights = this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnOperation (and this.pfnOperationBiasActivation if need) so that this.pfnOperation() and this.pfnOperationBiasActivation()
   * will or will not dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    this.bKeepInputTensor = bKeepInputTensor;

    if ( bKeepInputTensor ) {

      switch ( this.pfnOperation ) {

        // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        case Base.return_input_directly: this.pfnOperation = this.pfnOperationBiasActivation = Base.keep_input_return_copy; break;

        case Base.Avg_and_destroy:       this.pfnOperation = Base.Avg_and_keep;  break;
        case Base.Max_and_destroy:       this.pfnOperation = Base.Max_and_keep;  break;
        case Base.Conv_and_destroy:      this.pfnOperation = Base.Conv_and_keep; break;

        // Just clone input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                         this.pfnOperation = this.pfnOperationBiasActivation = Base.keep_input_return_copy;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

//!!!
//       switch ( this.AvgMax_Or_ChannelMultiplier ) {
//
// //!!! (2021/04/19) What if Avg/Max but filter size is 1x1 (i.e. ( this.pfnOperation == Base.return_input_directly ) )?
//
// //           // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
// //           case Base.return_input_directly:     this.pfnOperation = Base.keep_input_return_copy; break;
//
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG: this.pfnOperation = Base.Avg_and_keep; break;
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX: this.pfnOperation = Base.Max_and_keep; break;
//
//         // i.e. ( false == this.bExisted ). Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE:
//           this.pfnOperationBiasActivation = this.pfnOperation = Base.keep_input_return_copy;
//           break;
//
//         default: this.pfnOperation = Base.Conv_and_keep; break;
//       }

    } else {

      switch ( this.pfnOperation ) {

        // Just return input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        case Base.keep_input_return_copy: this.pfnOperation = this.pfnOperationBiasActivation = Base.return_input_directly; break;

        case Base.Avg_and_keep:           this.pfnOperation = Base.Avg_and_destroy;  break;
        case Base.Max_and_keep:           this.pfnOperation = Base.Max_and_destroy;  break;
        case Base.Conv_and_keep:          this.pfnOperation = Base.Conv_and_destroy; break;

        // Just return input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                          this.pfnOperation = this.pfnOperationBiasActivation = Base.return_input_directly;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

//!!!
//       switch ( this.AvgMax_Or_ChannelMultiplier ) {
//
// //!!! (2021/04/19) What if Avg/Max but filter size is 1x1 (i.e. ( this.pfnOperation == Base.return_input_directly ) )?
//
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG: this.pfnOperation = Base.Avg_and_destroy; break;
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX: this.pfnOperation = Base.Max_and_destroy; break;
//
//         // i.e. ( false == this.bExisted ). Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
//         case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE:
//           this.pfnOperationBiasActivation = this.pfnOperation = Base.return_input_directly;
//           break;
//
//         default: this.pfnOperation = Base.Conv_and_destroy; break;
//       }

    }
  }

  /** Depthwise Average Pooling. */
  static Avg_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.filterHeightWidth, "avg", this.pad, 1, this.strides ); // dilations = 1
  }

  static Avg_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.filterHeightWidth, "avg", this.pad, 1, this.strides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Max Pooling. */
  static Max_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.filterHeightWidth, "max", this.pad, 1, this.strides ); // dilations = 1
  }

  static Max_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.filterHeightWidth, "max", this.pad, 1, this.strides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Convolution. */
  static Conv_and_keep( inputTensor ) {
    return tf.depthwiseConv2d( inputTensor, this.filtersTensor4d, this.strides, this.pad );
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.depthwiseConv2d( inputTensor, this.filtersTensor4d, this.strides, this.pad );
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Operation, Bias and Activation. */
  static Operation_and_destroy_or_keep( inputTensor ) {
    return this.pfnOperation( inputTensor ); // may destroy or keep.
  }

  static OperationBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static OperationActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static OperationBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
