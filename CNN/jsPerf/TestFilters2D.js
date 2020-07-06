import * as ShuffleNetV2_MobileNetV2_Block from "../Layer/ShuffleNetV2_MobileNetV2_Block.js";

export { Base };


/**
 * Testing Filters of multiple blocks.
 *
 * @member {string} name This test filters' name.
 */
class Base {

  /**
   * @param sourceHeight        The height (and width) of the source image which will be processed by apply().
   * @param sourceChannelCount  The channel count of the source image.
   * @param targetHeight        The taregt image height (and width).
   * @param filterHeight        The height (and width) of each depthwise convolution.
   *
   * @param {number} channelMultiplierBlock0
   *   The first block (Block 0) will expand input channel by this factor.
   *
   * @param {number} stepCountPerBlock
   *   If zero or negative (<= 0), every block will use only one tf.depthwiseConv2d( strides = 1, pad = "valid" ) for shrinking sourceHeight
   * (minus ( filterHeight - 1 )). If positive (>= 1), every block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   * (half downsample) and use ( stageCountPerBlock - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" ) until the block end.
   *
   * @param strAvgMaxConv
   *   Depthwise operation. "Avg" or "Max" or "Conv" for average pooling, max pooling, depthwise convolution.
   *
   * @param bDepthwiseBias
   *   If true, there will be a bias after depthwise convolution.
   *
   * @param depthwiseActivationName
   *   The activation function name after depthwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   *
   * @param bPointwise2
   *   If true, there will be pointwise convolution after every layer of depthwise convolution.
   *
   * @param bPointwise2Bias
   *   If true, there will be a bias after pointwise convolution. If ( bPointwise2 == false ), this will be also ignored.
   *
   * @param pointwise2ActivationName
   *   The activation function name after pointwise convolution. One of the following "", "relu", "relu6", "sigmoid", "tanh", "sin".
   * If ( bPointwise2 == false ), this activation function will be also ignored.
   */
  init(
    channelExpansionFactor,
    sourceHeight, sourceChannelCount, targetHeight,
    filterHeight, channelMultiplierBlock0,
    stepCountPerBlock,
    strAvgMaxConv, bDepthwiseBias, depthwiseActivationName,
    bPointwise2, bPointwise2Bias, pointwise2ActivationName ) {

    this.disposeTensors();

    this.stepCountPerBlock = stepCountPerBlock;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = filterHeight;

    this.channelMultiplier = channelMultiplierBlock0;
    this.channelCountBlock0 = sourceChannelCount * channelMultiplierBlock0;  // the channel count of the first block (Block 0).

//!!! ...unfinished...

    // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
    let heightReducedPerStep = filterHeight - 1;

    if ( stepCountPerBlock >= 1 ) {
      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
      this.blockCount = Math.floor( Math.log2( sourceHeight ) );
    } else {
      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerStep );
    }

//!!! ...unfinished... should use Block0 info (instead of this)

    // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
    this.name = `C${sourceChannelCount}_${this.channelCountBlock0}`
      + `__D${strAvgMaxConv}_${filterHeight}x${filterHeight}`
      + `${ ( this.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
      + `${ ( this.depthwiseActivationFunction ) ? ( "_" + depthwiseActivationName ) : "" }`
      + `${ ( this.bPointwise2 ) ? "__PConv" : "" }`
      + `${ ( this.bPointwise2 && this.bPointwise2Bias ) ? ( "_PBias" ) : "" }`
      + `${ ( this.bPointwise2 && this.pointwise2ActivationFunction ) ? ( "_" + pointwise2ActivationName ) : "" }`
      + `__Block_${this.blockCount}`
      + `__Step${stepCountPerBlock}`
    ;

    // Depthwise Filters and Biases

    this.depthwiseFilterHeightWidth = [ filterHeight, filterWidth ];

    // First block's depthwise filters will expand channel count from sourceChannelCount to ( sourceChannelCount * channelMultiplierBlock0 ).
    this.depthwiseFiltersShapeFirst = [ filterHeight, filterWidth,      sourceChannelCount, channelMultiplierBlock0 ];
    this.depthwiseFiltersShape =      [ filterHeight, filterWidth, this.channelCountBlock0,                       1 ];
    this.depthwiseBiasesShape =       [            1,           1, this.channelCountBlock0 ];

    // Every element (Tensor4d) is a depthwiseFilters for one block.
    this.depthwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, this.depthwiseFiltersShapeFirst, this.depthwiseFiltersShape, this.bDepthwiseConv );

    // Every element (Tensor3d) is a depthwiseBiases for one block.
    this.depthwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, null, this.depthwiseBiasesShape, ( this.bDepthwiseConv && bDepthwiseBias ) );


    // Pointwise Filters and Biases

    let pointwiseInputDepth =  this.channelCountBlock0;
    let pointwiseOutputDepth = this.channelCountBlock0; // Assume output depth is the same as input.

    this.pointwiseFilterHeightWidth = [ 1, 1 ];
    this.pointwiseFiltersShape = [ 1, 1, pointwiseInputDepth, pointwiseOutputDepth ];

    // Both input depth and output depth of pointwise bias are the same as pointwise convolution output.
    this.pointwiseBiasesShape =  [ 1, 1, pointwiseOutputDepth ];

    // Every element (Tensor4d) is a pointwiseFilters for one block.
    this.pointwiseFiltersTensor4dArray
      = Base.generateTensorArray( this.blockCount, null, this.pointwiseFiltersShape, bPointwise2 );

    // Every element (Tensor3d) is a pointwiseBiases for one block.
    this.pointwiseBiasesTensor3dArray
      = Base.generateTensorArray( this.blockCount, null, this.pointwiseBiasesShape, ( bPointwise2 && bPointwise2Bias ) );
  }

  disposeTensors() {
    if ( this.depthwiseFiltersTensor4dArray ) {
      tf.dispose( this.depthwiseFiltersTensor4dArray );
      this.depthwiseFiltersTensor4dArray = null;
    }

    if ( this.depthwiseBiasesTensor3dArray ) {
      tf.dispose( this.depthwiseBiasesTensor3dArray );
      this.depthwiseBiasesTensor3dArray = null;
    }

    if ( this.pointwiseFiltersTensor4dArray ) {
      tf.dispose( this.pointwiseFiltersTensor4dArray );
      this.pointwiseFiltersTensor4dArray = null;
    }

    if ( this.pointwiseBiasesTensor3dArray ) {
      tf.dispose( this.pointwiseBiasesTensor3dArray );
      this.pointwiseBiasesTensor3dArray = null;
    }
  }


  /**
   * @param sourceImage
   *   The image which will be processed.
   *
   * @param bReturn
   *   If true, the result convoluiotn will be returned.
   *
   * @return
   *   If ( bReturn == true ), return the convolution result (tensor). Otheriwse, reurn null.
   */
  apply( sourceImage, bReturn ) {
    return tf.tidy( () => {

//!!! ...unfinished... fromPixels(). so that we can always dispose all tensors.

      let t, tNew;

      // Layer 0
      //
      // So that every layer could dispose previous result without worry about mis-dispose source.

      if ( this.bDepthwiseAvg ) {
        t = sourceImage.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
      } else if ( this.bDepthwiseMax ) {
        t = sourceImage.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
      } else if ( this.bDepthwiseConv ) {
        t = sourceImage.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ 0 ], 1, "valid" );  // Stride = 1
      }
      // NOTE: Do not dispose the original data.

      t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( t, 0 );

      // Layer 1, ...
      if ( this.bDepthwiseAvg ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "avg", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      } else if ( this.bDepthwiseMax ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.pool( this.depthwiseFilterHeightWidth, "max", "valid", 1, 1 );
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      } else if ( this.bDepthwiseConv ) {

        for ( let i = 1; i < this.blockCount; ++i ) {
          tNew = t.depthwiseConv2d( this.depthwiseFiltersTensor4dArray[ i ], 1, "valid" );  // Stride = 1
          t.dispose();                                           // Dispose all intermediate (temporary) data.
          t = this.apply_Depthwise_Bias_Activation_Pointwise_Bias_Activation( tNew, i );
        }

      }

      if ( bReturn )
        return t;
    });
  }

}

