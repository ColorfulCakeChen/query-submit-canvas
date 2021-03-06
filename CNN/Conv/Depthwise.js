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
 *   If true, this depthwise operation exists. The same as this.bDepthwise.
 *
 * @member {boolean} bDepthwise
 *   If true, this depthwise operation exists. The same as this.bExisted.
 *
 * @member {boolean} bDepthwiseAvg
 *   If true, this depthwise operation exists. And it is depthwise average pooling.
 *
 * @member {boolean} bDepthwiseMax
 *   If true, this depthwise operation exists. And it is depthwise maximum pooling.
 *
 * @member {boolean} bDepthwiseConv
 *   If true, this depthwise operation exist. And it is depthwise convolution.
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

    super();
    this.inputChannelCount = inputChannelCount;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.stridesPad = stridesPad;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.inputFloat32Array = inputFloat32Array;
    this.byteOffsetBegin = byteOffsetBegin;
  }

  /**
   * @return {boolean} Return true, if succeeded.
   */
  init() {
    this.disposeTensors();

    this.byteOffsetEnd = this.byteOffsetBegin;
    this.outputChannelCount = this.inputChannelCount; // Assume no channel multiplier.
    this.filterWidth = this.filterHeight;  // Assume depthwise filter's width equals its height.

    switch ( this.stridesPad ) {
      case 0:  this.strides = 1; this.pad = "valid"; break;
      default:
      case 1:  this.strides = 1; this.pad = "same";  break;
      case 2:  this.strides = 2; this.pad = "same";  break;
    }

    if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling ( and strides is 1 ), or 1x1 MAX pooling ( and strides is 1 ), or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == false ) )
      //   - Just return input (i.e. ( this.pfnOperation == Base.return_input_directly ) )

      // When 1x1 AVG or MAX pooling (and strides is 1), the result of depthwise operation (not include bias and activation) is the same as input.
      let bSameAsInput = ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) && ( 1 == this.strides ) );

//!!! (2021/07/07 Remarked) Although result is the same as input, it might still has bias and/or activation.
//       // Although filter size 1x1, it perhaps can not do nothing if considering strides and pad.
//       if ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) && ( 1 == this.strides ) ) {
//         // Do nothing, because the result of 1x1 AVG or MAX pooling (when strides is 1) is just the same as input.
//         this.pfnOperation = Base.return_input_directly;
//       } else {
      switch ( this.AvgMax_Or_ChannelMultiplier ) {
        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
          this.bDepthwise = this.bDepthwiseAvg = true;
          if ( bSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (but it might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Avg_and_destroy;
          break;

        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
          this.bDepthwise = this.bDepthwiseMax = true;
          if ( bSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (but it might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Max_and_destroy;
          break;
      }
//!!! (2021/07/07 Remarked) Although result is the same as input, it might still has bias and/or activation.
//      }

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

    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

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
    return true;
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
    this.outputChannelCount = this.strides = this.pad = null;
    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false; // Assume no depthwise.
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnOperation (and this.pfnOperationBiasActivation if need) so that this.pfnOperation() and this.pfnOperationBiasActivation()
   * will or will not dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;
    if ( bKeepInputTensor ) {

      switch ( this.pfnOperation ) {

//!!! (2021/07/07 Remarked) pfnOperationBiasActivation should not be changed because there might be bias and activation.
//         // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
//         // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
//         case Base.return_input_directly: this.pfnOperation = this.pfnOperationBiasActivation = Base.keep_input_return_copy; break;

        // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: pfnOperationBiasActivation should not be changed here because there might be bias and activation.
        case Base.return_input_directly: this.pfnOperation = Base.keep_input_return_copy; break;

        case Base.Avg_and_destroy:       this.pfnOperation = Base.Avg_and_keep;  break;
        case Base.Max_and_destroy:       this.pfnOperation = Base.Max_and_keep;  break;
        case Base.Conv_and_destroy:      this.pfnOperation = Base.Conv_and_keep; break;

        // Just clone input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                         this.pfnOperation = this.pfnOperationBiasActivation = Base.keep_input_return_copy;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

    } else {

      switch ( this.pfnOperation ) {

//!!! (2021/07/07 Remarked) pfnOperationBiasActivation should not be changed because there might be bias and activation.
//         // Just return input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
//         // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
//         case Base.keep_input_return_copy: this.pfnOperation = this.pfnOperationBiasActivation = Base.return_input_directly; break;

        // Just return input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: pfnOperationBiasActivation should not be changed here because there might be bias and activation.
        case Base.keep_input_return_copy: this.pfnOperation = Base.return_input_directly; break;

        case Base.Avg_and_keep:           this.pfnOperation = Base.Avg_and_destroy;  break;
        case Base.Max_and_keep:           this.pfnOperation = Base.Max_and_destroy;  break;
        case Base.Conv_and_keep:          this.pfnOperation = Base.Conv_and_destroy; break;

        // Just return input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                          this.pfnOperation = this.pfnOperationBiasActivation = Base.return_input_directly;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

    }
  }

  get bExisted() {
    return this.bDepthwise;
  }

  /**
   * @return {boolean}
   *   If the ( height, width ) of this depthwise operation output is the same as its input, return true.
   */
  is_Output_Same_HeightWidth_As_Input() {

    // If this depthwise operation does not existed, the output will have the same ( height, width ) as input.
    // In fact, they are the same one in this case.
    if ( !this.bDepthwise )
      return true;

    if ( this.strides != 1 )
      return false; // If strides is not 1, it is impossible to output same ( height, width ) as input.

    if ( this.pad == "same" )
      return true; // If ( strides is 1 ) and ( pad is "same" ), the output will have the same ( height, width ) as input.

    // Or, although ( strides is 1 ) and ( pad is "valid" ) but ( filter size is 1x1 ), the output will have the same ( height, width ) as input.
    if ( ( this.pad == "valid" ) && ( this.filterHeight == 1 ) && ( this.filterWidth == 1 ) )
      return true;

    return false;
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
