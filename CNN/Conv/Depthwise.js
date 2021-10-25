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
 * @member {number} depthwise_AvgMax_Or_ChannelMultiplier   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier)
 * @member {number} depthwiseFilterHeight The height of the depthwise convolution's filter.
 * @member {number} depthwiseFilterWidth  The width of the depthwise convolution's filter.
 * @member {number} depthwiseStridesPad   The strides and padding of depthwise convolution. (PointDepthPoint.Params.depthwiseStridesPad)
 *
 * @member {number} channelMultiplier     The channel multiplier of the depthwise operation (according to depthwise_AvgMax_Or_ChannelMultiplier).
 *
 * @member {number} dilationHeight        The depthwise filters's dilation across height dimension.
 * @member {number} dilationWidth         The depthwise filters's dilation across width dimension.
 *
 * @member {number} effectFilterHeight    The effect height of the depthwise convolution's filter including the dilationHeight.
 * @member {number} effectFilterWidth     The effect width of the depthwise convolution's filter including the dilationWidth.
 * @member {number} effectFilterSize      The effect size of the depthwise convolution's filter. (= effectFilterHeight * effectFilterWidth)
 *
 * @member {number} depthwiseStrides      The strides along the image's height and width dimension (according to depthwiseStridesPad).
 * @member {number} stridesHeight         The strides along the image's height dimension (according to depthwiseStridesPad).
 * @member {number} stridesWidth          The strides along the image's width dimension (according to depthwiseStridesPad).

 * @member {number} depthwisePad          The padding along the image's height and width dimension (according to depthwiseStridesPad).
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
  
  constructor(
    imageInHeight, imageInWidth, imageInDepth,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad ) {

    this.imageInHeight = imageInHeight;
    this.imageInWidth = imageInWidth;
    this.imageInDepth = imageInDepth;
    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseStridesPad = depthwiseStridesPad;

//!!! ...unfinished... (2021/03/17) What about ( depthwiseFilterHeight <= 0 )?

    this.channelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    if (   ( ValueDesc.depthwise_AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.depthwise_AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      this.channelMultiplier = 1;
    }

    this.depthwiseFilterWidth = depthwiseFilterHeight; // Assume filter's width equals height.

    // Strides and Padding.
    switch ( depthwiseStridesPad ) {
      case 0:  this.depthwiseStrides = 1; this.depthwisePad = "valid"; break;
      default:
      case 1:  this.depthwiseStrides = 1; this.depthwisePad = "same";  break;
      case 2:  this.depthwiseStrides = 2; this.depthwisePad = "same";  break;
    }

    // Assume strides width equals strides height.
    this.stridesHeight = this.depthwiseStrides;
    this.stridesWidth = this.depthwiseStrides;

    // Currently, we can only handle dilation = 1.
    this.dilationHeight = 1;
    this.dilationWidth = 1;

    // Effect filter size (includes dilation).
    this.effectFilterHeight = this.dilationHeight * ( this.depthwiseFilterHeight - 1 ) + 1;
    this.effectFilterWidth =  this.dilationWidth  * ( this.depthwiseFilterWidth  - 1 ) + 1;
    this.effectFilterSize = this.effectFilterHeight * this.effectFilterWidth;

    // (The following codes for output image height and width and padding calculation are copied from
    // https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts)
    {
      // Determine output image height and width without padding.
      if ( this.depthwisePad == "valid" ) {
        this.imageOutHeight = Math.ceil( ( imageInHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.imageOutWidth =  Math.ceil( ( imageInWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

      // Determine output image height and width with padding around the input image height and width.
      } else if ( this.depthwisePad == "same" ) {
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
 */
class PassThrough {

  /**
   */
  constructor(
    imageInHeight, imageInWidth, imageInDepth,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bBias ) {

    this.padInfo = new PadInfoCalculator( imageInHeight, imageInWidth, imageInDepth,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad );

    this.bBias = bBias;

    if (   ( ValueDesc.depthwise_AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.depthwise_AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) ) {
      return; // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    }

    let { depthwiseFilterWidth, channelMultiplier, dilationHeight, dilationWidth,
          stridesHeight, stridesWidth, padHeightTop, padWidthLeft,
          imageOutHeight, imageOutWidth, imageOutDepth, imageOutLength } = this.padInfo;

    // There is only one position (inside the effect depthwise filter) with value one. All other positions of the filter should be zero.
    let oneEffectFilterY = padHeightTop;
    let oneEffectFilterX = padWidthLeft;

    // Make up a depthwise convolution filter which 
    this.depthwiseFiltersArray = new Array( depthwiseFilterHeight * depthwiseFilterWidth * imageInDepth * channelMultiplier );

    // Note: Unfortunately, this does not work for ( dilation > 1 ). So, only ( dilation == 1 ) is supported.
    for ( let inChannel = 0; inChannel < imageInDepth; ++inChannel ) {

      for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub ) {

        for ( let filterY = 0, effectFilterY = 0; filterY < depthwiseFilterHeight; ++filterY ) {
          for ( let dilationFilterY = 0; dilationFilterY < dilationHeight; ++dilationFilterY, ++effectFilterY ) {
            let filterIndexBaseX = ( filterY * depthwiseFilterWidth );

            for ( let filterX = 0, effectFilterX = 0; filterX < depthwiseFilterWidth; ++filterX ) {
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

    let filtersShape = [ depthwiseFilterHeight, depthwiseFilterWidth, imageInDepth, channelMultiplier ];
    let biasesShape =  [ 1, 1, imageOutDepth ];

    // Generate depthwise filters for just pass input to output.
    this.filtersTensor4d = tf.tensor( this.depthwiseFiltersArray, filtersShape );

    // Generate bias for just adding zero. (i.e. equals no bias).
    if ( this.bBias ) {
      this.biasesTensor3d = tf.zero( biasesShape );
    }
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
 *     - If ( channelShuffler == null ), the filters for the input channels between 0 and ( Math.ceil( outputChannelCount / 2 ) - 1 )
 *         are depthwise1, between Math.ceil( outputChannelCount / 2 ) and ( outputChannelCount - 1 ) are depthwise2. These
 *         two filters (and biases) will be extracted in sequence, but they will be combined into one larger filters (and biases).
 *         This makes these filters' weights are arranged the same as ShuffleNetV2's head. So that the same filters weights could
 *         be used in these two architectures for comparing performance. (i.e. bHigherHalfDepthwise2, for depthwise1 of
 *         ShuffleNetV2_ByMopbileNetV1's head)
 *
 *     - If ( channelShuffler != null ), the filters for the output channels between Math.ceil( outputChannelCount / 2 )
 *         to ( outputChannelCount - 1 ) will just pass through the input to output. (i.e. bHigherHalfPassThrough, for
 *         for depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
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
  }

//!!! ...unfinished... (2021/10/22)
// In ShuffleNetV2's head, the filters and biases of depthwise2 are after depthwise1.
// In ShuffleNetV2_ByMobileNetV1's head, although depthwise1 and depthwise2 are combined into depthwise1,
// they should be extracted in sequence and then combined. So that they could use the same filters and biases weights array
// to generate the same result.

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
    this.outputChannelCount = this.inputChannelCount; // Assume no channel multiplier.
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

    let higherHalfPassThrough;
    try {


//!!! ...unfinished... (2021/10/25)
//  * @member {boolean} bHigherHalfDepthwise2
//  *   If ( bHigherHalfDifferent == true ) and ( channelShuffler == null ), this will be true.
//  *
//  * @member {boolean} bHigherHalfPassThrough
//  *   If ( bHigherHalfDifferent == true ) and ( channelShuffler != null ), this will be true.
//
//     this.bHigherHalfPassThrough = ( channelShuffler != null );


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

        this.filterHeightWidth = [ this.filterHeight, this.filterWidth ];

        // In normal depthwise avg/max pooling, use specified specified channel count as extracted channel count.
        // Although they are not used to extract avg/max filters, they will be used for extracting bias.
        this.inputChannelCount_toBeExtracted = this.inputChannelCount;
        this.outputChannelCount_toBeExtracted = this.outputChannelCount;

      } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
        this.bDepthwise = this.bDepthwiseConv = true;

        this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

        if ( this.bHigherHalfPassThrough ) {
          this.inputChannelCount_toBeExtracted // The lower half filters have half the output channel count as input and output.
            = this.outputChannelCount_toBeExtracted = Math.ceil( this.outputChannelCount / 2 );

          let outputChannelCount_higherHalf = this.outputChannelCount - this.inputChannelCount_toBeExtracted;
          higherHalfPassThrough = new PassThrough(
            this.imageInHeight, this.imageInWidth, outputChannelCount_higherHalf,
            this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseStridesPad, this.bBias );

        } else { // Normal depthwise convolution. Use specified input and output channel count.
          this.inputChannelCount_toBeExtracted = this.inputChannelCount;
          this.outputChannelCount_toBeExtracted = this.outputChannelCount;
        }

        let filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount_toBeExtracted, this.AvgMax_Or_ChannelMultiplier ];
        let filtersWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, this.filtersShape );
        if ( !filtersWeights.extract() )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = filtersWeights.defaultByteOffsetEnd;

        this.filtersTensor4d = tf.tensor4d( filtersWeights.weights, filtersShape );
        this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.filtersTensor4d.shape );

        if ( this.bHigherHalfPassThrough ) {
          let allFiltersArray = [ this.filtersTensor4d, higherHalfPassThrough.filtersTensor4d ];
          let allFiltersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).

          this.filtersTensor4d.dispose();
          this.filtersTensor4d = allFiltersTensor4d;
        }

        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersTensor4d.shape ); // After combining the pass-through filters, it is total.

        this.pfnOperation = Base.Conv_and_destroy; // will dispose inputTensor.

      } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      }

//!!! ...unfinished... (2021/10/25)
      this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

      if ( this.bDepthwise ) {

        if ( this.bBias ) {

          let biasesShape = [ 1, 1, this.outputChannelCount_toBeExtracted ];
          let biasesWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, biasesShape );
          if ( !biasesWeights.extract() )
            return false;  // e.g. input array does not have enough data.
          this.byteOffsetEnd = biasesWeights.defaultByteOffsetEnd;

          this.biasesTensor3d = tf.tensor3d( biasesWeights.weights, biasesShape );
          this.tensorWeightCountExtracted += tf.util.sizeFromShape( this.biasesTensor3d.shape );

          if ( this.bHigherHalfPassThrough ) {
            let allBiasesArray = [ this.biasesTensor3d, higherHalfPassThrough.biasesTensor3d ];
            let allBiasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

            this.biasesTensor3d.dispose();
            this.biasesTensor3d = allBiasesTensor3d;
          }

          this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesTensor3d.shape ); // After combining the pass-through biases, it is total.

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

!!!
      Base.Setup_pfn.call( this );

    } finally {
      if ( higherHalfPassThrough )
        higherHalfPassThrough.disposeTensors();
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

    if ( this.channelShuffler ) {
      this.channelShuffler = null; // Do not dispose channel shuffler here. Just set to null.
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
//!!! (2021/10/19 Remarked) So that inputFloat32Array could be released.
//    this.filtersWeights = this.biasesWeights = this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;
    this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;
    this.outputChannelCount = this.strides = this.pad
      = this.bHigherHalfDepthwise2 = this.bHigherHalfPassThrough
      = this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted
      = this.imageInHeight = this.imageInWidth = this.imageInDepth
      = this.filterHeightWidth
      = undefined;
    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false; // Assume no depthwise.
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /** Determine this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined (i.e. modified).
   */
  static Setup_pfn() {
    this.pfnActivation = Base.getActivationFunctionById( this.nActivationId );

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
