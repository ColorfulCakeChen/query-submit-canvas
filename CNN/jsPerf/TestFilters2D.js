import * as ShuffleNetV2_MobileNetV2_Block from "../Layer/ShuffleNetV2_MobileNetV2_Block.js";

export { Base };

/**
 * Testing Filters of multiple blocks.
 *
 * @member {string} name
 *   This test filters' name.
 *
 * @member {number[]} totalChannelExpansionFactor
 *   The final output of this neural network will have ( totalChannelExpansionFactor * sourceChannelCount ) channel count.
 *
 * @member {number[]} sourceImageHeightWidth
 *   The size (i.e. [ height, width ]) of the source image. When apply() is called, the source image will be extracted from the sourceCanvas
 * and be resized to this size. The neural network receives this resized source image.
 */
class Base {

  /**
   * @param {number} depthwiseChannelMultiplierBlock0Step0
   *   The depthwise convolution of the first step (Step 0) of the first block (Block 0) will expand input channel by this factor.
   *
   * @see ShuffleNetV2_MobileNetV2_Block.init 
   */
  init(
    sourceHeight, sourceChannelCount, // targetHeight,
    stepCountPerBlock,
    bShuffleNetV2,
    strAvgMaxConv, depthwiseFilterHeight, depthwiseChannelMultiplierBlock0Step0, bBias, strActivationName ) {

    this.disposeTensors();

    this.stepCountPerBlock = stepCountPerBlock;
    this.bShuffleNetV2 = bShuffleNetV2;

    let targetHeight = 1; // The final output always has height x width = 1 x 1 (i.e. only one pixel per channel)

    let differenceHeight = sourceHeight - targetHeight;
    let filterWidth = depthwiseFilterHeight;

    this.depthwiseChannelMultiplierBlock0Step0 = depthwiseChannelMultiplierBlock0Step0;
    this.channelCountBlock0 = sourceChannelCount * depthwiseChannelMultiplierBlock0Step0;  // the channel count of the first block (Block 0).

    if ( stepCountPerBlock <= 0 ) { // Not ShuffleNetV2, Not MobileNetV2.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerBlock = depthwiseFilterHeight - 1;

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      this.blockCount = Math.floor( differenceHeight / heightReducedPerBlock );

      // Channel count only be expanded by channel multiplier of depthwise convolution of step 0 of block 0.
      this.totalChannelExpansionFactor = depthwiseChannelMultiplierBlock0Step0;

    } else {  // ShuffleNetV2 or MobileNetV2. Halven per block.

      // The block count for reducing sourceHeight to targetHeight by tf.depthwiseConv2d( strides = 2, pad = "same" ).
//      this.blockCount = Math.floor( Math.log2( sourceHeight ) );
      this.blockCount = Math.ceil( Math.log2( sourceHeight ) );

//!!! wrong
//       // Channel count is expanded both by channel multiplier of depthwise convolution of step 0 of block 0
//       // and by every block (half height x width and double channel count).
//       this.totalChannelExpansionFactor = depthwiseChannelMultiplierBlock0Step0 * Math.pow( 2, this.blockCount );

      // Channel count is expanded by every block (half height x width and double channel count).
      this.totalChannelExpansionFactor = Math.pow( 2, this.blockCount );
    }

    let nextBlockInputChannelCount = sourceChannelCount;
    let nextBlockDepthwiseChannelMultiplier = depthwiseChannelMultiplierBlock0Step0; // Only block 0 can have ( depthwise channel multiplier > 1 ).

    this.blocks = new Array( this.blockCount );
    for ( let i = 0; i < this.blockCount; ++i )
    {
      let block = new ShuffleNetV2_MobileNetV2_Block.Base();
      block.init(
        sourceHeight, nextBlockInputChannelCount, targetHeight,
        stepCountPerBlock,
        bShuffleNetV2,
        strAvgMaxConv, depthwiseFilterHeight, nextBlockDepthwiseChannelMultiplier, bBias, strActivationName );

      this.blocks[ i ] = block;
      nextBlockInputChannelCount = block.outputChannelCount; // Using previous block's output channel count as next block's input channel count.
      nextBlockDepthwiseChannelMultiplier = 1;               // Except block 0, all other blocks' depthwise channel multiplier should be 1.
    }

    let block0 = this.blocks[ 0 ];

    // e.g. "C24_24__DConv_101x101_DBias_RELU__PConv_PBias_RELU__Block_1__Step_1"
    this.name = `C${sourceChannelCount}_${this.channelCountBlock0}`

      + `${ ( block0.step0.bPointwise1 ) ? "__PConv1" : "" }`
      + `${ ( block0.step0.bPointwise1 && block0.step0.bPointwise1Bias ) ? ( "_PBias" ) : "" }`
      + `${ ( block0.step0.bPointwise1 && block0.step0.pointwise1ActivationFunction ) ? ( "_" + block0.step0.pointwise1ActivationName ) : "" }`

      + `${ ( block0.step0.bDepthwise ) ? `__D${strAvgMaxConv}_${depthwiseFilterHeight}x${depthwiseFilterHeight}` : "" }`
      + `${ ( block0.step0.bDepthwise && block0.step0.bDepthwiseBias ) ? ( "_DBias" ) : "" }`
      + `${ ( block0.step0.bDepthwise && block0.step0.depthwiseActivationFunction ) ? ( "_" + strActivationName ) : "" }`

      + `${ ( block0.step0.bPointwise2 ) ? "__PConv2" : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.step0.bPointwise2Bias ) ? ( "_PBias" ) : "" }`
      + `${ ( block0.step0.bPointwise2 && block0.step0.pointwise2ActivationFunction ) ? ( "_" + block0.step0.pointwise2ActivationName ) : "" }`

      + `__Block_${this.blockCount}`
      + `__Step_${stepCountPerBlock}`
    ;

    this.sourceImageHeightWidth = [ block0.sourceHeight, block0.sourceWidth ];
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
   * @param {HTMLCanvasElement} sourceCanvas
   *   The canvas which provides image.
   *
   * @param bReturn
   *   If true, the result tensor will be returned. Otherwise, all tensors are disposed.
   *
   * @return
   *   If ( bReturn == true ), return the result tensor. Otheriwse, return null.
   */
  apply( sourceCanvas, bReturn ) {
//    return tf.tidy( () => {

      // Using fromPixels() to get source image so that we can always dispose all tensors (including sourceImage) except the returning tensor.
      let sourceImageChannelCount = 4;
      let sourceImage = tf.browser.fromPixels( sourceCanvas, sourceImageChannelCount );

      // Resize source image to a default size (height x width) which is used when training the neural network.
      let t = tf.image.resizeBilinear( sourceImage, this.sourceImageHeightWidth, true ); // alignCorners = true
//!!! Temp Remarked for testing memory leak detection.
//      sourceImage.dispose();

      let block;
      for ( let i = 0; i < this.blocks.length; ++i ) {
        block = this.blocks[ i ];
        t = block.apply_and_destroy( t );
      }

      if ( bReturn )
        return t;
      else
        t.dispose();

//    });
  }

}

