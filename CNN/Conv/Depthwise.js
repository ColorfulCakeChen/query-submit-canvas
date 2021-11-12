export { PadInfoCalculator, PassThrough, Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone_Activation from "./ReturnOrClone_Activation.js";


/**
 * According to input image size and depthwise convolution parameters, calculate the padding information of the depthwise convolution.
 *
 * @member {number} imageInHeight         Input image height.
 * @member {number} imageInWidth          Input image width.
 * @member {number} imageInDepth          Input image channel count.
 * @member {number} AvgMax_Or_ChannelMultiplier   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier)
 * @member {number} filterHeight          The height of the depthwise convolution's filter.
 * @member {number} filterWidth           The width of the depthwise convolution's filter.
 * @member {number} stridesPad            The strides and padding of depthwise convolution. (PointDepthPoint.Params.depthwiseStridesPad)
 *
 * @member {number} channelMultiplier     The channel multiplier of the depthwise operation (according to AvgMax_Or_ChannelMultiplier).
 *
 * @member {number} dilationHeight        The depthwise filters's dilation across height dimension.
 * @member {number} dilationWidth         The depthwise filters's dilation across width dimension.
 *
 * @member {number} effectFilterHeight    The effect height of the depthwise convolution's filter including the dilationHeight.
 * @member {number} effectFilterWidth     The effect width of the depthwise convolution's filter including the dilationWidth.
 * @member {number} effectFilterSize      The effect size of the depthwise convolution's filter. (= effectFilterHeight * effectFilterWidth)
 *
 * @member {number} strides               The strides along the image's height and width dimension (according to stridesPad).
 * @member {number} stridesHeight         The strides along the image's height dimension (according to stridesPad).
 * @member {number} stridesWidth          The strides along the image's width dimension (according to stridesPad).

 * @member {number} pad                   The padding along the image's height and width dimension (according to stridesPad).
 * @member {number} padHeight             The padding along the input image's height dimension.
 * @member {number} padHeightTop          The padding along the input image's height dimension at the top.
 * @member {number} padHeightBottom       The padding along the input image's height dimension at the bottom.
 * @member {number} padWidth              The padding along the input image's width dimension.
 * @member {number} padWidthLeft          The padding along the input image's width dimension at the left.
 * @member {number} padWidthRight         The padding along the input image's width dimension at the right.
 *
 * @member {number} imageOutHeight        Output image height.
 * @member {number} imageOutWidth         Output image width.
 * @member {number} imageOutDepth         Output image channel count.
 * @member {number} imageOutLength        Output image elements count (= ( imageOutHeight * imageOutWidth * imageOutDepth ) ).
 */
class PadInfoCalculator {
  
  constructor( imageInHeight, imageInWidth, imageInDepth, AvgMax_Or_ChannelMultiplier, filterHeight, stridesPad ) {
    this.imageInHeight = imageInHeight;
    this.imageInWidth = imageInWidth;
    this.imageInDepth = imageInDepth;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.stridesPad = stridesPad;

//!!! ...unfinished... (2021/03/17) What about ( filterHeight <= 0 )?

    this.channelMultiplier = AvgMax_Or_ChannelMultiplier;
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {
      this.channelMultiplier = 1;
    }

    this.filterWidth = filterHeight; // Assume filter's width equals height.

    // Strides and Padding.
    switch ( stridesPad ) {
      case 0:  this.strides = 1; this.pad = "valid"; break;
      default:
      case 1:  this.strides = 1; this.pad = "same";  break;
      case 2:  this.strides = 2; this.pad = "same";  break;
    }

    // Assume strides width equals strides height.
    this.stridesHeight = this.strides;
    this.stridesWidth = this.strides;

    // Currently, we can only handle dilation = 1.
    this.dilationHeight = 1;
    this.dilationWidth = 1;

    // Effect filter size (includes dilation).
    this.effectFilterHeight = this.dilationHeight * ( this.filterHeight - 1 ) + 1;
    this.effectFilterWidth =  this.dilationWidth  * ( this.filterWidth  - 1 ) + 1;
    this.effectFilterSize = this.effectFilterHeight * this.effectFilterWidth;

    // (The following codes for output image height and width and padding calculation are copied from
    // https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts)
    {
      // Determine output image height and width without padding.
      if ( this.pad == "valid" ) {
        this.imageOutHeight = Math.ceil( ( imageInHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.imageOutWidth =  Math.ceil( ( imageInWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

      // Determine output image height and width with padding around the input image height and width.
      } else if ( this.pad == "same" ) {
        this.imageOutHeight = Math.ceil( imageInHeight / this.stridesHeight );
        this.imageOutWidth =  Math.ceil( imageInWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0, ( this.imageOutHeight - 1 ) * this.stridesHeight + this.effectFilterHeight - imageInHeight );
        this.padWidth =  Math.max( 0, ( this.imageOutWidth  - 1 ) * this.stridesWidth  + this.effectFilterWidth  - imageInWidth  );

        this.padHeightTop =    Math.floor( this.padHeight / 2 );
        this.padHeightBottom = this.padHeight - this.padHeightTop;
        this.padWidthLeft =    Math.floor( this.padWidth /  2 );
        this.padWidthRight =   this.padWidth  - this.padWidthLeft;
      }
    }

    this.imageOutDepth = imageInDepth * this.channelMultiplier;
    this.imageOutLength = ( this.imageOutHeight * this.imageOutWidth * this.imageOutDepth );
  }

}


/**
 * A depthwise convolution and bias which just pass the input to output.
 *
 * It is usually used in passing the higher half channels of the input to output (for achieving ShuffleNetV2_ByMopbileNetV1's body/tail).
 *
 *
 * @member {number[]} depthwiseFiltersArray
 *   The depthwise convolution filter which could pass the input to output unchangely.
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. constructor()) successfully.
 */
class PassThrough {

  /**
   */
  constructor( imageInHeight, imageInWidth, imageInDepth, AvgMax_Or_ChannelMultiplier, filterHeight, stridesPad, bBias ) {

    this.padInfo = new PadInfoCalculator( imageInHeight, imageInWidth, imageInDepth,
      AvgMax_Or_ChannelMultiplier, filterHeight, stridesPad );

    this.bBias = bBias;

    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {
      return; // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    }

    let { filterWidth, channelMultiplier, dilationHeight, dilationWidth,
          stridesHeight, stridesWidth, padHeightTop, padWidthLeft,
          imageOutHeight, imageOutWidth, imageOutDepth, imageOutLength } = this.padInfo;

    // There is only one position (inside the effect depthwise filter) with value one. All other positions of the filter should be zero.
    let oneEffectFilterY = padHeightTop;
    let oneEffectFilterX = padWidthLeft;

    // Make up a depthwise convolution filter which 
    this.depthwiseFiltersArray = new Array( filterHeight * filterWidth * imageInDepth * channelMultiplier );

    // Note: Unfortunately, this does not work for ( dilation > 1 ). So, only ( dilation == 1 ) is supported.
    for ( let inChannel = 0; inChannel < imageInDepth; ++inChannel ) {

      for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub ) {

        for ( let filterY = 0, effectFilterY = 0; filterY < filterHeight; ++filterY ) {
          for ( let dilationFilterY = 0; dilationFilterY < dilationHeight; ++dilationFilterY, ++effectFilterY ) {
            let filterIndexBaseX = ( filterY * filterWidth );

            for ( let filterX = 0, effectFilterX = 0; filterX < filterWidth; ++filterX ) {
              for ( let dilationFilterX = 0; dilationFilterX < dilationWidth; ++dilationFilterX, ++effectFilterX ) {

                // The filter's dilation part can not be manipulated. (They are always zero.)
                if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                  continue;

                let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * imageOutDepth );
                let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * channelMultiplier );

                let filterIndex = filterIndexBaseSubC + outChannelSub;

                if ( ( effectFilterY == oneEffectFilterY ) && ( effectFilterX == oneEffectFilterX ) ) {
                  this.depthwiseFiltersArray[ filterIndex ] = 1; // The only one position with value one.
                } else {
                  this.depthwiseFiltersArray[ filterIndex ] = 0; // All other positions of the filter are value zero.
                }
              }
            }
          }
        }
      }
    }

    let filtersShape = [ filterHeight, filterWidth, imageInDepth, channelMultiplier ];
    let biasesShape =  [ 1, 1, imageOutDepth ];

    [ this.filtersTensor4d, this.biasesTensor3d ] = tf.tidy( () => {

      // Generate depthwise filters for just pass input to output.
      let filtersTensor4d = tf.tensor( this.depthwiseFiltersArray, filtersShape );

      // Generate bias for just adding zero. (i.e. equals no bias).
      let biasesTensor3d;
      if ( this.bBias ) {
        biasesTensor3d = tf.zero( biasesShape );
      }

      this.bInitOk = true;

      return [ filtersTensor4d, biasesTensor3d ];
    });
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
  }
}


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
 * @member {boolean} bHigherHalfDifferent
 *   - If false, it is just a normal depthwise convolution.
 *
 *   - If true:
 *
 *     - Can not be used when:
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier )
 *
 *     - If ( channelShuffler == null ), the filters for the input channels between 0 and ( Math.ceil( inputChannelCount / 2 ) - 1 )
 *         are depthwise1, between Math.ceil( inputChannelCount / 2 ) and ( inputChannelCount - 1 ) are depthwise2. These
 *         two filters (and biases) will be extracted in sequence, but they will be combined into one larger filters (and biases).
 *         This makes these filters' weights are arranged the same as ShuffleNetV2's head. So that the same filters weights could
 *         be used in these two architectures for comparing performance and correctness. (i.e. bHigherHalfDepthwise2, for depthwise1
 *         of ShuffleNetV2_ByMopbileNetV1's head)
 *
 *     - If ( channelShuffler != null ), the filters for the input channels between Math.ceil( inputChannelCount / 2 )
 *         and ( inputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for depthwise1
 *         of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 * @member {ChannelShuffler.Xxx} channelShuffler
 *   Only be used if ( bHigherHalfDifferent == true ). If not null, it is viewed as ( bHigherHalfPassThrough == true ). The
 * channelShuffler.concatenatedShape[ 0 ] and channelShuffler.concatenatedShape[ 1 ] will be used as imageInHeight and imageInWidth.
 * They are used to generate the higher-half-pass-through depthwise filters. The channelShuffler will not be disposed by this object.
 * (for depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 *
 * @member {boolean} bHigherHalfDepthwise2
 *   If ( bHigherHalfDifferent == true ) and ( channelShuffler == null ), this will be true.
 *
 * @member {boolean} bHigherHalfPassThrough
 *   If ( bHigherHalfDifferent == true ) and ( channelShuffler != null ), this will be true.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
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

//!!! ...unfinished... (2021/10/28) Why not just pass imageHeight and imageWidth instead of channelShuffler?

  constructor(
    inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, stridesPad, bBias, nActivationId, bHigherHalfDifferent, channelShuffler ) {

    super();
    this.inputChannelCount = inputChannelCount;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.stridesPad = stridesPad;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.channelShuffler = channelShuffler;

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {
      
      if ( bHigherHalfDifferent ) {
        let msg = `Depthwise.constructor(): `
          + `bHigherHalfDifferent ( ${bHigherHalfDifferent} ) can not be true when `
          + `AvgMax_Or_ChannelMultiplier is ( ${ValueDesc.AvgMax_Or_ChannelMultiplier.singleton.getStringOf( AvgMax_Or_ChannelMultiplier )} )`
          ;

        throw msg;
      }
    }
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why are not filtersWeights and biasesWeights kept in this?
    // A2: So that inputFloat32Array could be released.

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;
    this.filterWidth = this.filterHeight;  // Assume depthwise filter's width equals its height.

    if ( this.channelShuffler ) {
      this.imageInHeight = this.channelShuffler.concatenatedShape[ 0 ];
      this.imageInWidth = this.channelShuffler.concatenatedShape[ 1 ];
      this.imageInDepth = this.channelShuffler.concatenatedShape[ 2 ];
    }

    switch ( this.stridesPad ) {
      case 0:  this.strides = 1; this.pad = "valid"; break;
      default:
      case 1:  this.strides = 1; this.pad = "same";  break;
      case 2:  this.strides = 2; this.pad = "same";  break;
    }

    Base.Setup_bDepthwise_pfn.call( this );

    if ( !this.bDepthwise ) {
      this.bInitOk = true;
      return true; // no operation at all. No depthwise (e.g. zero or negative number) (so no channel multiplier, too).
    }

//!!! ...unfinished... (2021/11/12) What if ( bHigherHalfDifferent == true ) when average/maximum pooling?

    if ( this.bDepthwiseAvg || this.bDepthwiseMax ) { // 1. Depthwise by AVG or MAX pooling (so no channel multiplier).
      this.bInitOk = Base.extractAs_AvgMaxPooling.call( this, inputFloat32Array );

    } else if ( this.bDepthwiseConv ) { // 2. Depthwise by convolution (with channel multiplier).

      if ( this.bHigherHalfDifferent == true ) {

        if ( this.channelShuffler == null ) { // 2.1 i.e. bHigherHalfDepthwise2
          this.bInitOk = Base.extractAs_HigherHalfDepthwise2.call( this, inputFloat32Array );

        } else { // 2.2 ( channelShuffler != null ), i.e. bHigherHalfPassThrough
          this.bInitOk = Base.extractAs_HigherHalfPassThrough.call( this, inputFloat32Array );
        }

      } else { // 2.3 Normal depthwise convolution.
        this.bInitOk = Base.extractAs_NormalDepthwise.call( this, inputFloat32Array );
      }
    }

    return this.bInitOk;
  }

  /** Release tensors.
   */
  disposeTensors() {
    if ( this.filtersTensor4d ) {
      this.filtersTensor4d.dispose();
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      this.biasesTensor3d.dispose();
      this.biasesTensor3d = null;
    }

    // Note: Do not clear (or dispose) channel shuffler here, because it is accepted parameter of constructor.

//!!! (2021/11/12 Remarked) Note: Do not clear (or dispose) channel shuffler here, because it is accepted parameter of constructor.
//     if ( this.channelShuffler ) {
//       this.channelShuffler = null; // Do not dispose channel shuffler here. Just set to null.
//     }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
//!!! (2021/10/19 Remarked) So that inputFloat32Array could be released.
//    this.filtersWeights = this.biasesWeights = this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;
    this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;

    // (2021/10/27 Remarked) If these properties does not exist, assigning value (even undefined) to them will create them. This is un-wanted.
    //this.outputChannelCount = this.strides = this.pad
    //  = this.bHigherHalfDepthwise2 = this.bHigherHalfPassThrough
    //  = this.inputChannelCount_lowerHalf = this.outputChannelCount_lowerHalf
    //  = this.inputChannelCount_higherHalf = this.outputChannelCount_higherHalf
    //  = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
    //  = this.imageInHeight = this.imageInWidth = this.imageInDepth
    //  = this.filterHeightWidth
    //  = undefined;

    // If these properties does not exist, assigning value (even undefined) to them will create them. Avoid it.
    {
      if ( this.bDepthwiseAvg )
        this.bDepthwiseAvg = undefined;

      if ( this.bDepthwiseMax )
        this.bDepthwiseMax = undefined;

      if ( this.bDepthwiseConv )
        this.bDepthwiseConv = undefined;
    }

    this.bDepthwise = false;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /** Determine this.bDepthwiseXxx and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static Setup_bDepthwise_pfn() {

    // 1.
    if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling ( and strides is 1 ), or 1x1 MAX pooling ( and strides is 1 ), or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == false ) )
      //   - Just return input (i.e. ( this.pfnOperation == Base.return_input_directly ) )

      // When 1x1 AVG or MAX pooling (and strides is 1), the result of depthwise operation (not include bias and activation) is the same as input.
      let bOperationResultSameAsInput = ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) && ( 1 == this.strides ) );

      switch ( this.AvgMax_Or_ChannelMultiplier ) {
        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
          this.bDepthwise = this.bDepthwiseAvg = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Avg_and_destroy;
          break;

        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
          this.bDepthwise = this.bDepthwiseMax = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Max_and_destroy;
          break;
      }

    } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
      this.bDepthwise = this.bDepthwiseConv = true;

      this.pfnOperation = Base.Conv_and_destroy; // will dispose inputTensor.

    } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
    }

    // 2.
    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

    // 3.
    if ( this.bDepthwise ) {
      if ( this.bBias ) {
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
  }

  /**
   * Extract depthwise convolution filters from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   * @param {number} filterHeight             The height of the depthwise convolution filters.
   * @param {number} filterWidth              The width of the depthwise convolution filters.
   * @param {number} inputChannelCount        The input channel count of the depthwise convolution filters.
   * @param {number} channelMultiplier        The channel multiplier of the depthwise convolution filters.
   *
   * @return {tf.tensor4d}                    The extracted depthwise filters. Return null, if failed.
   */
  static extractFilters( inputFloat32Array, filterHeight, filterWidth, inputChannelCount, channelMultiplier ) {
    let filtersShape = [ filterHeight, filterWidth, inputChannelCount, channelMultiplier ];
    return Base.extractTensor.call( this, inputFloat32Array, filtersShape );
  }

  /**
   * Extract biases of average/maximum pooling from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.filterHeight
   *   - this.filterWidth
   *   - this.inputChannelCount
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_AvgMaxPooling( inputFloat32Array ) {

    this.outputChannelCount = this.inputChannelCount; // No channel multiplier.

    this.filterHeightWidth = [ this.filterHeight, this.filterWidth ];

    // In normal depthwise avg/max pooling, use specified specified channel count as extracted channel count.
    // Although they are not used to extract avg/max filters, they will be used for extracting bias.
    this.inputChannelCount_toBeExtracted = this.inputChannelCount;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount;

    if ( this.bBias ) {
      this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_toBeExtracted );
      if ( !this.biasesTensor3d )
        return false;
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfDepthwise2 from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.filterHeight
   *   - this.filterWidth
   *   - this.inputChannelCount
   *   - this.AvgMax_Or_ChannelMultiplier
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfDepthwise2( inputFloat32Array ) {

    this.bHigherHalfDepthwise2 = true;

    this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

    this.inputChannelCount_lowerHalf = Math.ceil( this.inputChannelCount / 2 );
    this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

    this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
    this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

    // Extract filters and biases for the specified channel count, but in different sequence.
    this.inputChannelCount_toBeExtracted = this.inputChannelCount;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount;

    // The extraction order is important: filter1, bias1, filter2, bias2.
    //
    // In ShuffleNetV2's head, the filters and biases of depthwise2 are after depthwise1. In ShuffleNetV2_ByMobileNetV1's
    // head, although depthwise1 and depthwise2 are combined into depthwise1, they should be extracted in sequence and
    // then combined. So that they could use the same filters and biases weights array to generate the same result.
    let filtersTensor4d_lowerHalf, biasesTensor3d_lowerHalf, filtersTensor4d_higherHalf, biasesTensor3d_higherHalf;
    try {
      filtersTensor4d_lowerHalf = Base.extractFilters.call( this, inputFloat32Array,
        this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.AvgMax_Or_ChannelMultiplier );

      if ( !filtersTensor4d_lowerHalf )
        return false;

      if ( this.bBias ) {
        biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
        if ( !biasesTensor3d_lowerHalf )
          return false;
      }

      filtersTensor4d_higherHalf = Base.extractFilters.call( this, inputFloat32Array,
        this.filterHeight, this.filterWidth, this.inputChannelCount_higherHalf, this.AvgMax_Or_ChannelMultiplier );

      if ( !filtersTensor4d_higherHalf )
        return false;

      if ( this.bBias ) {
        biasesTensor3d_higherHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_higherHalf );
        if ( !biasesTensor3d_higherHalf )
          return false;
      }

      // Combine lower-half and higher-half.
      let allFiltersArray = [ filtersTensor4d_lowerHalf, filtersTensor4d_higherHalf ];
//!!! (2021/11/10 Remarked)
//      this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
      this.filtersTensor4d = tf.concat( allFiltersArray, 2 ); // Along the last second axis (i.e. input channel axis; axis id 2).

      if ( this.bBias ) {
        let allBiasesArray = [ biasesTensor3d_lowerHalf, biasesTensor3d_higherHalf ];
        this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
      }

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {

      if ( biasesTensor3d_higherHalf )
        biasesTensor3d_higherHalf.dispose();

      if ( filtersTensor4d_higherHalf )
        filtersTensor4d_higherHalf.dispose();

      if ( biasesTensor3d_lowerHalf )
        biasesTensor3d_lowerHalf.dispose();

      if ( filtersTensor4d_lowerHalf )
        filtersTensor4d_lowerHalf.dispose();
    }

    return true;
  }

  /**
   * Extract filters and biases of HigherHalfPassThrough from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.filterHeight
   *   - this.filterWidth
   *   - this.inputChannelCount
   *   - this.AvgMax_Or_ChannelMultiplier
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_HigherHalfPassThrough( inputFloat32Array ) {

    this.bHigherHalfPassThrough = true;

    this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

    this.inputChannelCount_lowerHalf = Math.ceil( this.inputChannelCount / 2 );
    this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

    this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
    this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

    // Just extract filters and biases for half of the specified channel count.
    this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

    let higherHalfPassThrough;
    try {

      // The other half is just filters and biases for pass-through.
      higherHalfPassThrough = new PassThrough(
        this.imageInHeight, this.imageInWidth, this.inputChannelCount_higherHalf,
        this.AvgMax_Or_ChannelMultiplier, this.filterHeight, this.stridesPad, this.bBias );

      if ( !higherHalfPassThrough.bInitOk )
        return false;

      let filtersTensor4d_lowerHalf;
      try {
        filtersTensor4d_lowerHalf = Base.extractFilters.call( this, inputFloat32Array,
          this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.AvgMax_Or_ChannelMultiplier );

        if ( !filtersTensor4d_lowerHalf )
          return false;

        let allFiltersArray = [ filtersTensor4d_lowerHalf, higherHalfPassThrough.filtersTensor4d ];
//!!! (2021/11/10 Remarked)
//      this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
        this.filtersTensor4d = tf.concat( allFiltersArray, 2 ); // Along the last second axis (i.e. input channel axis; axis id 2).

      } finally {
        if ( filtersTensor4d_lowerHalf )
          filtersTensor4d_lowerHalf.dispose();
      }

      if ( this.bBias ) {
        let biasesTensor3d_lowerHalf;
        try {
          biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
          if ( !biasesTensor3d_lowerHalf )
            return false;

          let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
          this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

        } finally {
          if ( biasesTensor3d_lowerHalf )
            biasesTensor3d_lowerHalf.dispose();
        }
      }

    } catch ( e ) {
      return false; // e.g. memory not enough.

    } finally {

      if ( higherHalfPassThrough ) {

        // Include the weights count of the higher-half-pass-through filters and biases.
        this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.filtersTensor4d.shape );
        if ( higherHalfPassThrough.biasesTensor3d ) {
          this.tensorWeightCountTotal += tf.util.sizeFromShape( higherHalfPassThrough.biasesTensor3d.shape );
        }

        higherHalfPassThrough.disposeTensors();
      }

    }

    return true;
  }

  /**
   * Extract filters and biases of normal dethwise convolution from inputFloat32Array.
   *
   * The following data members will be used:
   *   - this.byteOffsetEnd
   *   - this.filterHeight
   *   - this.filterWidth
   *   - this.inputChannelCount
   *   - this.AvgMax_Or_ChannelMultiplier
   *
   * The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *   - this.outputChannelCount
   *   - this.inputChannelCount_toBeExtracted
   *   - this.outputChannelCount_toBeExtracted
   *   - this.filtersTensor4d
   *   - this.biasesTensor3d
   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean}                        Return true, if succeeded. Return false, if failed.
   */
  static extractAs_NormalDepthwise( inputFloat32Array ) {

    this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

    this.inputChannelCount_toBeExtracted = this.inputChannelCount;
    this.outputChannelCount_toBeExtracted = this.outputChannelCount;

    this.filtersTensor4d = Base.extractFilters.call( this, inputFloat32Array,
      this.filterHeight, this.filterWidth, this.inputChannelCount_toBeExtracted, this.AvgMax_Or_ChannelMultiplier );

    if ( !this.filtersTensor4d )
      return false;

    if ( this.bBias ) {
      this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_toBeExtracted );
      if ( !this.biasesTensor3d )
        return false;
    }

    return true;
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
