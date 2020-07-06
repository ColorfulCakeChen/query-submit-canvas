import * as ShuffleNetV2_MobileNetV2_Block from "../Layer/ShuffleNetV2_MobileNetV2_Block.js";

export { Base };

/**
 * Testing Filters of multiple blocks.
 *
 * @member {string} name This test filters' name.
 */
class Base {

  /**
   * @param {number} depthwiseChannelMultiplierBlock0Step0
   *   The depthwise convolution of the first step (Step 0) of the first block (Block 0) will expand input channel by this factor.
   *
   * @see ShuffleNetV2_MobileNetV2_Block.init 
   */
  init(
///    channelExpansionFactor,
    sourceHeight, sourceChannelCount, targetHeight,
//    filterHeight, channelMultiplierBlock0,
    stepCountPerBlock,
    bShuffleNetV2,

//     strAvgMaxConv, bDepthwiseBias, depthwiseActivationName,
//     bPointwise2, bPointwise2Bias, pointwise2ActivationName,

    strAvgMaxConv, depthwiseChannelMultiplierBlock0Step0, depthwiseFilterHeight, bBias, strActivationName ) {

    this.disposeTensors();

    this.stepCountPerBlock = stepCountPerBlock;
    this.bShuffleNetV2 = bShuffleNetV2;

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = depthwiseFilterHeight;

    this.depthwiseChannelMultiplierBlock0Step0 = depthwiseChannelMultiplierBlock0Step0;
    this.channelCountBlock0 = sourceChannelCount * depthwiseChannelMultiplierBlock0Step0;  // the channel count of the first block (Block 0).

//!!! ...unfinished...

//     // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
//     let heightReducedPerBlock;
//     if ( stepCountPerBlock <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.
//       heightReducedPerBlock = depthwiseFilterHeight - 1;
//     } else {  // ShuffleNetV2 or MobileNetV2. Halven per block.
//       heightReducedPerBlock = ???;
//     }

    if ( stepCountPerBlock <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerBlock = depthwiseFilterHeight - 1;

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerBlock );

    } else {  // ShuffleNetV2 or MobileNetV2. Halven per block.

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
      this.blockCount = Math.floor( Math.log2( sourceHeight ) );

    }

    this.blocks = new Array( this.blockCount );
    for ( let i = 0; i < this.blockCount; ++i )
    {
      let block = new ShuffleNetV2_MobileNetV2_Block.Base();
      block.init(
        sourceHeight, sourceChannelCount, targetHeight,
        stepCountPerBlock,
        bShuffleNetV2,
        strAvgMaxConv, depthwiseChannelMultiplierBlock0Step0, depthwiseFilterHeight, bBias, strActivationName );
      this.blocks[ i ] = block;
    }

    let block0 = this.blocks[ 0 ];

    // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
    this.name = `C${sourceChannelCount}_${this.channelCountBlock0}`
      + `__D${strAvgMaxConv}_${depthwiseFilterHeight}x${depthwiseFilterHeight}`
      + `${ ( block0.step0.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
      + `${ ( block0.step0.depthwiseActivationFunction ) ? ( "_" + strAvgMaxConv ) : "" }`
      + `${ ( block0.step0.bPointwise2 ) ? "__PConv" : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.step0.bPointwise2Bias ) ? ( "_PBias" ) : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.pointwise2ActivationName ) ? ( "_" + block0.step0.pointwise2ActivationName ) : "" }`
      + `__Block_${this.blockCount}`
      + `__Step${stepCountPerBlock}`
    ;
  }

  disposeTensors() {
    if ( this.blocks ) {
      for ( let block of this.blocks ) {
        block.disposeTensors();
      }
      this.blocks = null;
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

